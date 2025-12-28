class LedgerParser {
    constructor() {
        this.students = [];
    }

    async parse(file, onProgress) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const totalPages = pdf.numPages;

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            
            // 1. Extract Items with coordinates
            let items = content.items.map(item => ({
                str: item.str,
                x: item.transform[4],
                y: item.transform[5],
                h: item.height
            }));

            // 2. Sort Items: Top-to-Bottom, Left-to-Right
            items.sort((a, b) => {
                if (Math.abs(b.y - a.y) < 4) return a.x - b.x; // Same line (tolerance 4px)
                return b.y - a.y; // Descending Y
            });

            // 3. Reconstruct Visual Lines
            const lines = this.reconstructLines(items);

            // 4. Parse the Clean Lines
            this.processLines(lines);
            
            if (onProgress) onProgress(i, totalPages);
        }

        return this.students;
    }

    reconstructLines(items) {
        const lines = [];
        if (items.length === 0) return lines;

        let currentLineY = items[0].y;
        let currentLineText = [];

        items.forEach(item => {
            // If item Y is significantly different, start new line
            if (Math.abs(item.y - currentLineY) > 5) {
                lines.push(currentLineText.join(" ").trim());
                currentLineText = [];
                currentLineY = item.y;
            }
            currentLineText.push(item.str);
        });
        
        // Push last line
        if (currentLineText.length > 0) lines.push(currentLineText.join(" ").trim());
        
        return lines;
    }

    processLines(lines) {
        let currentStudent = null;

        for (let line of lines) {
            let cleanLine = line.replace(/\s+/g, " ").trim();
            let upperLine = cleanLine.toUpperCase();

            // --- A. IGNORE HEADERS & FOOTERS ---
            if (upperLine.includes("UNIVERSITY OF MUMBAI") || 
                upperLine.includes("OFFICE REGISTER") || 
                upperLine.includes("PAGE :") ||
                upperLine.includes("CENTRE :") ||
                upperLine.includes("CREDITS") || 
                upperLine.includes("COURSE NAME")) {
                continue;
            }

            // --- B. DETECT START OF STUDENT (Seat No & Name) ---
            // Regex: Starts with 7-15 digits, followed by Name (Letters/Spaces)
            // Example: "262112770 ZUBIYA FAKRUDDIN SHAIKH"
            const seatMatch = cleanLine.match(/^(\d{7,15})\s+([A-Z\.\s]+)$/);
            
            if (seatMatch) {
                // If we were building a student, save them now
                if (currentStudent) this.students.push(currentStudent);

                currentStudent = {
                    seatNo: seatMatch[1],
                    name: seatMatch[2].trim(),
                    prn: "-",
                    college: "",
                    sgpa: "0.00",
                    status: "FAIL" // Assume fail until we find passing criteria
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
            // Pattern: Look for "College" or "Society" but ignore generic headers
            if ((upperLine.includes("COLLEGE") || upperLine.includes("SOCIETYS")) && cleanLine.length > 20) {
                // Simple heuristic: Take the whole line as college name
                currentStudent.college = cleanLine;
            }

            // --- E. DETECT RESULT / SGPA (End of Block) ---
            // Pattern: "SGPA ... 7.45"
            if (upperLine.includes("SGPA") || upperLine.includes("RESULT")) {
                const sgpaMatch = cleanLine.match(/SGPA\D*(\d+\.\d+)/);
                if (sgpaMatch) currentStudent.sgpa = sgpaMatch[1];

                if (upperLine.includes("PASS")) currentStudent.status = "PASS";
                else if (upperLine.includes("FAIL")) currentStudent.status = "FAIL";
                else if (upperLine.includes("ATKT")) currentStudent.status = "ATKT";
            }
        }
        
        // Don't forget the very last student on the page
        if (currentStudent) {
            // Avoid duplicates if logic runs per page
            const exists = this.students.some(s => s.seatNo === currentStudent.seatNo);
            if (!exists) this.students.push(currentStudent);
        }
    }
}
