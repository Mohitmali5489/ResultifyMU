class LedgerParser {
    constructor() {
        this.students = [];
        this.courseMap = {}; // Maps code to name
    }

    async parse(file, onProgress) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        const totalPages = pdf.numPages;

        for (let i = 1; i <= totalPages; i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            
            // Normalize items with position
            const items = content.items.map(item => ({
                str: item.str,
                x: item.transform[4],
                y: item.transform[5],
                hasHeight: item.height > 0
            }));

            this.processPage(items);
            
            if (onProgress) onProgress(i, totalPages);
        }

        return this.students;
    }

    processPage(items) {
        // Group items by Y coordinate (lines)
        const lines = {};
        const TOLERANCE = 4; // Vertical tolerance in pixels

        items.forEach(item => {
            // Bucketize Y to group items on roughly the same line
            const yKey = Math.floor(item.y / TOLERANCE) * TOLERANCE;
            if (!lines[yKey]) lines[yKey] = [];
            lines[yKey].push(item);
        });

        // Sort lines top to bottom
        const sortedY = Object.keys(lines).sort((a, b) => b - a);

        let tempStudent = null;
        let captureSubjects = false;

        for (let y of sortedY) {
            // Sort items in line Left to Right
            const lineItems = lines[y].sort((a, b) => a.x - b.x);
            const lineStr = lineItems.map(i => i.str).join(" ").trim();
            const cleanStr = lineStr.replace(/\s+/g, " "); // Remove extra spaces

            // 1. EXTRACT COURSE MAPPING (Top of page)
            // Pattern: (1162111): 1162111: Financial Accounting - II
            if (lineStr.includes("):") && lineStr.includes(":")) {
                const match = lineStr.match(/(\d{6,8}):\s*(.+)/);
                if (match) {
                    // Extract code and name. 
                    // Example: "1162111: Financial Accounting"
                    const parts = match[0].split(":");
                    if(parts.length >= 2) {
                        const code = parts[0].trim();
                        const name = parts.slice(1).join(":").trim();
                        this.courseMap[code] = name;
                    }
                }
            }

            // 2. DETECT STUDENT START (Seat No & Name)
            // Pattern: 7+ digit number at start, followed by text
            const seatMatch = cleanStr.match(/^(\d{7,12})\s+([A-Z\.\s]+)$/);
            
            // Exclude "Page" or "University" lines
            if (seatMatch && !cleanStr.toLowerCase().includes("page")) {
                
                // Save previous student
                if (tempStudent) {
                    this.finalizeStudent(tempStudent);
                    this.students.push(tempStudent);
                }

                // Init new student
                tempStudent = {
                    seatNo: seatMatch[1],
                    name: seatMatch[2].trim(),
                    prn: "",
                    college: "",
                    sgpa: "0.00",
                    status: "FAIL", // Default to FAIL/Pending until PASS found
                    subjects: [] 
                };
                captureSubjects = true; // Start looking for marks
            }

            if (!tempStudent) continue;

            // 3. DETECT PRN
            // Pattern: (MU...)
            if (cleanStr.includes("(MU")) {
                const prnMatch = cleanStr.match(/\((MU\w+)\)/);
                if (prnMatch) tempStudent.prn = prnMatch[1];
            }

            // 4. DETECT COLLEGE
            // Usually contains "College" or specific ID "MU-XXXX"
            if (cleanStr.includes("College") || cleanStr.includes("Societys") || cleanStr.includes("MU-")) {
                if (!tempStudent.college || tempStudent.college.length < 5) {
                    tempStudent.college = cleanStr.replace(/^[,\s]+|[,\s]+$/g, '');
                }
            }

            // 5. DETECT RESULT / SGPA
            // The footer of the student block
            if (cleanStr.includes("SGPA") || cleanStr.includes("Result")) {
                const sgpaMatch = cleanStr.match(/SGPA\D*(\d+\.\d+)/);
                if (sgpaMatch) tempStudent.sgpa = sgpaMatch[1];

                if (cleanStr.includes("PASS")) tempStudent.status = "PASS";
                if (cleanStr.includes("FAIL") || cleanStr.includes("Fails")) tempStudent.status = "FAIL";
                if (cleanStr.includes("ATKT")) tempStudent.status = "ATKT";
                
                captureSubjects = false; // End of student block
            }

            // 6. DETECT SUBJECTS / MARKS (Simplified)
            // We look for lines starting with a course code (e.g., 1162111) 
            // OR lines that look like marks rows if we are inside a student block.
            // *Note*: Extracting exact marks from plain text without coordinates logic is hard.
            // We will attempt to find the Course Code in the line.
            
            if (captureSubjects) {
                // Check if any known course code is in this line
                for (const code in this.courseMap) {
                    if (cleanStr.includes(code)) {
                        // Found a subject line! 
                        // Let's try to extract marks. 
                        // This is a rough heuristic: get numbers from line
                        const marks = cleanStr.match(/\d+/g) || [];
                        
                        // We need a robust way to guess which number is which.
                        // Usually: Code, Internal, External, Total, Credits, GradePoints
                        
                        // For now, we store the raw line data and the mapped name
                        // In a real production app, you map column X-coords to fields.
                        tempStudent.subjects.push({
                            code: code,
                            name: this.courseMap[code],
                            raw: cleanStr
                        });
                        break; 
                    }
                }
            }
        }

        // Push last student
        if (tempStudent) {
            this.finalizeStudent(tempStudent);
            this.students.push(tempStudent);
        }
    }

    finalizeStudent(student) {
        // Fallback: If college is empty, fill generic
        if (!student.college) student.college = "University of Mumbai Affiliated College";
        
        // Clean up Name (remove trailing chars)
        student.name = student.name.replace(/[^A-Z\s]/g, '').trim();
    }
}
