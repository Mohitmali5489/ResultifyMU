class LedgerParser {
    constructor() {
        this.result = {
            university: "University of Mumbai",
            college: {},
            students: []
        };
    }

    async parse(file, onProgress) {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(buffer).promise;

        for (let p = 1; p <= pdf.numPages; p++) {
            const page = await pdf.getPage(p);
            const content = await page.getTextContent();

            let items = content.items.map(i => ({
                str: i.str,
                x: i.transform[4],
                y: i.transform[5]
            }));

            items.sort((a, b) =>
                Math.abs(b.y - a.y) < 4 ? a.x - b.x : b.y - a.y
            );

            const lines = this.rebuildLines(items);
            this.processLines(lines);

            if (onProgress) onProgress(p, pdf.numPages);
        }

        return this.result; // ALWAYS returns students array
    }

    rebuildLines(items) {
        const lines = [];
        let currentY = null;
        let buffer = [];

        items.forEach(i => {
            if (currentY === null || Math.abs(i.y - currentY) < 5) {
                buffer.push(i.str);
            } else {
                lines.push(buffer.join(" ").trim());
                buffer = [i.str];
            }
            currentY = i.y;
        });

        if (buffer.length) lines.push(buffer.join(" ").trim());
        return lines;
    }

    processLines(lines) {
        let student = null;

        for (let line of lines) {
            const clean = line.replace(/\s+/g, " ").trim();
            const upper = clean.toUpperCase();

            // Detect college
            if (!this.result.college.name && upper.includes("COLLEGE")) {
                this.result.college = { name: clean };
            }

            // Detect student row
            const seatMatch = clean.match(
                /^(\d{7,15})\s+([A-Z\s]+)\s+(REGULAR|PRIVATE)/i
            );

            if (seatMatch) {
                if (student) this.result.students.push(student);

                student = {
                    seatNo: seatMatch[1],
                    name: seatMatch[2].trim(),
                    prn: "",
                    sgpa: "-",
                    result: "-"
                };
                continue;
            }

            if (!student) continue;

            // Detect PRN
            const prnMatch = clean.match(/\((MU\w+)\)/);
            if (prnMatch) student.prn = prnMatch[1];

            // Detect SGPA & Result
            if (upper.includes("SGPA")) {
                const sgpaMatch = clean.match(/(\d+\.\d+)/);
                if (sgpaMatch) student.sgpa = sgpaMatch[1];
                student.result = upper.includes("PASS") ? "PASS" : "FAIL";
            }
        }

        if (student) this.result.students.push(student);
    }
}
