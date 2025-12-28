class LedgerParser {
    constructor() {
        this.students = [];
    }

    async parse(file, onProgress) {
        console.log("Starting Parse...");
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const totalPages = pdf.numPages;

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            
            // 1. Get all text items with their coordinates
            let items = content.items.map(item => ({
                str: item.str,
                x: item.transform[4],
                y: item.transform[5], // PDF Y starts from bottom
                h: item.height
            }));

            // 2. Sort items: Top to Bottom (High Y to Low Y), then Left to Right
            items.sort((a, b) => {
                // If Y is roughly same (within 3px), sort by X
                if (Math.abs(b.y - a.y) < 3) return a.x - b.x;
                return b.y - a.y; // Descending Y
            });

            this.processPage(items);
            
            if (onProgress) onProgress(i, totalPages);
        }

        console.log(`Parse Complete. Total Students: ${this.students.length}`);
        return this.students;
    }

    processPage(items) {
        // 3. Reconstruct Lines (Group items by Y)
        const lines = [];
        let currentLine = { y: -999, text: "" };

        items.forEach(item => {
            if (Math.abs(item.y - currentLine.y) > 4) {
                // New visual line
                if (currentLine.y !== -999) lines.push(currentLine.text.trim());
                currentLine = { y: item.y, text: item.str };
            } else {
                // Same line, append text
                currentLine.text += " " + item.str;
            }
        });
        // Push last line
        if (currentLine.text) lines.push(currentLine.text.trim());

        // 4. PARSE THE CLEAN LINES
        let currentStudent = null;

        for (let line of lines) {
            const cleanLine = line.replace(/\s+/g, ' ').trim();

            // --- A. IGNORE HEADERS/FOOTERS ---
            // If line contains these phrases, skip it immediately
            const upper = cleanLine.toUpperCase();
            if (upper.includes("UNIVERSITY OF MUMBAI") || 
                upper.includes("OFFICE REGISTER") || 
                upper.includes("PAGE :") || 
                upper.includes("CENTRE :") ||
                upper.includes("COURSE CODE") ||
                upper.includes("CREDITS")) {
                continue;
            }

            // --- B. DETECT STUDENT (Seat No & Name) ---
            // Pattern: Starts with 7+ digits followed by text (Name)
            // Example: "262112770 ZUBIYA FAKRUDDIN SHAIKH"
            const seatMatch = cleanLine.match(/^(\d{7,15})\s+([A-Z\.\s]+)$/);
            
            if (seatMatch) {
                // Save previous student if exists
                if (currentStudent) this.students.push(currentStudent);

                currentStudent = {
                    seatNo: seatMatch[1],
                    name: seatMatch[2].trim(),
                    prn: "-",
                    college: "University of Mumbai", // Default
                    sgpa: "0.00",
                    status: "FAIL" // Default until passed
                };
            }

            if (!currentStudent) continue;

            // --- C. DETECT PRN ---
            // Pattern: (MU034...)
            if (cleanLine.includes("(MU")) {
                const prnMatch = cleanLine.match(/\((MU\w+)\)/);
                if (prnMatch) currentStudent.prn = prnMatch[1];
            }

            // --- D. DETECT COLLEGE ---
            // Pattern: Contains "College" or "Societys"
            // We ensure it's not the generic header line by checking we are inside a student block
            if ((cleanLine.toLowerCase().includes("college") || cleanLine.toLowerCase().includes("societys")) && cleanLine.length > 15) {
                currentStudent.college = cleanLine;
            }

            // --- E. DETECT RESULT (SGPA / STATUS) ---
            // Pattern: "SGPA ... 7.45" or "Result: PASS"
            if (upper.includes("SGPA") || upper.includes("RESULT")) {
                const sgpaMatch = cleanLine.match(/SGPA\D*(\d+\.\d+)/);
                if (sgpaMatch) currentStudent.sgpa = sgpaMatch[1];

                if (upper.includes("PASS")) currentStudent.status = "PASS";
                else if (upper.includes("FAIL")) currentStudent.status = "FAIL";
                else if (upper.includes("ATKT")) currentStudent.status = "ATKT";
            }
        }

        // Push the last student found on the page
        if (currentStudent) this.students.push(currentStudent);
    }
}
