class LedgerParser {
    constructor() {
        this.students = [];
        this.courseMap = {}; 
    }

    async parse(file, onProgress) {
        console.log("Starting Parse...");
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const totalPages = pdf.numPages;
        console.log(`PDF Loaded. Total pages: ${totalPages}`);

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            
            // 1. Extract and Sort Text Items
            const items = content.items.map(item => ({
                str: item.str,
                x: item.transform[4],
                y: item.transform[5],
                w: item.width,
                h: item.height
            }));

            // Sort: Top to Bottom (Y desc), then Left to Right (X asc)
            items.sort((a, b) => {
                const yDiff = b.y - a.y;
                if (Math.abs(yDiff) < 5) return a.x - b.x; // If Y is close, sort by X
                return yDiff;
            });

            this.processPageLines(items);
            
            if (onProgress) onProgress(i, totalPages);
        }

        console.log("Parse Complete. Found students:", this.students.length);
        return this.students;
    }

    processPageLines(items) {
        // Group items into text lines
        const lines = [];
        let currentLine = { y: -1, text: "" };

        items.forEach(item => {
            if (Math.abs(item.y - currentLine.y) > 5) {
                // New Line
                if (currentLine.y !== -1) lines.push(currentLine.text.trim());
                currentLine = { y: item.y, text: item.str };
            } else {
                // Append to current line (add space if needed)
                currentLine.text += " " + item.str;
            }
        });
        if (currentLine.text) lines.push(currentLine.text.trim());

        // --- STATE MACHINE PARSING ---
        // We iterate through lines and track state
        let currentStudent = null;

        lines.forEach(line => {
            const cleanLine = line.replace(/\s+/g, ' ').trim();
            
            // DEBUG: Uncomment to see every line in console
            // console.log("Line:", cleanLine);

            // 1. Capture Course Codes (Header Check)
            // Pattern: (1162111): ...
            if (cleanLine.includes("):") && !currentStudent) {
                const match = cleanLine.match(/(\d{6,10}):\s*(.+)/);
                if (match) {
                     // logic to save course names if needed
                }
            }

            // 2. START NEW STUDENT: Look for Seat Number (7-12 digits at start of line)
            // Example: "262112770 ZUBIYA FAKRUDDIN SHAIKH"
            const seatMatch = cleanLine.match(/^(\d{7,15})\s+(.*)/);
            
            if (seatMatch) {
                // If we were processing a student, save them (unless they are incomplete/broken)
                if (currentStudent) {
                    this.students.push(currentStudent);
                }

                const possibleName = seatMatch[2].trim();
                
                // IGNORE headers/page numbers
                if (!possibleName.toLowerCase().includes("page") && possibleName.length > 2) {
                    currentStudent = {
                        seatNo: seatMatch[1],
                        name: possibleName,
                        prn: "Pending",
                        college: "University of Mumbai",
                        sgpa: "0.00",
                        status: "Result Pending",
                        subjects: []
                    };
                    console.log(`Found Student: ${currentStudent.seatNo} - ${currentStudent.name}`);
                }
            }

            if (!currentStudent) return;

            // 3. CAPTURE PRN
            // Pattern: (MU0341120240096421)
            if (cleanLine.includes("(MU")) {
                const prnMatch = cleanLine.match(/\((MU\w+)\)/);
                if (prnMatch) {
                    currentStudent.prn = prnMatch[1];
                }
            }

            // 4. CAPTURE COLLEGE
            // Pattern: contains "College" or "Societys"
            if ((cleanLine.includes("College") || cleanLine.includes("Societys")) && cleanLine.length > 10) {
                currentStudent.college = cleanLine;
            }

            // 5. CAPTURE RESULT / SGPA (Closing the block)
            // Pattern: "SGPA ... 7.45" or "Result: PASS" or "FAIL"
            if (cleanLine.includes("SGPA") || cleanLine.includes("FAIL") || cleanLine.includes("PASS")) {
                
                // Extract SGPA
                const sgpaMatch = cleanLine.match(/SGPA\D*(\d+\.\d+)/);
                if (sgpaMatch) {
                    currentStudent.sgpa = sgpaMatch[1];
                }

                // Extract Status
                if (cleanLine.includes("PASS") || (sgpaMatch && parseFloat(sgpaMatch[1]) > 0)) {
                    currentStudent.status = "PASS";
                }
                if (cleanLine.includes("FAIL") || cleanLine.includes("Fails")) {
                    currentStudent.status = "FAIL";
                }
                if (cleanLine.includes("ATKT")) {
                    currentStudent.status = "ATKT";
                }
            }
        });

        // Push the very last student of the loop/page
        if (currentStudent) {
            this.students.push(currentStudent);
        }
    }
}
