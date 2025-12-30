// SUBJECT ORDER AS PER MU LEDGER (SEM II – AF)
const SUBJECT_MASTER = [
    { code: "1102311", name: "Social Media Marketing (OE)", credit: 2 },
    { code: "1112312", name: "Environmental Science", credit: 2 },
    { code: "1162111", name: "Financial Accounting - II", credit: 4 },
    { code: "1162112", name: "Auditing - II", credit: 2 },
    { code: "1162411", name: "Vocational Skills in Accounting & Finance - III", credit: 2 },
    { code: "1162412", name: "Vocational Skills in Accounting & Finance - IV", credit: 2 },
    { code: "1242211", name: "Introduction to Business", credit: 2 },
    { code: "2512511", name: "Lekhan Kaushalya", credit: 2 },
    { code: "2542520", name: "Foundation of Behavioral Skills", credit: 2 },
    { code: "2522620", name: "Sports, Health & Yoga", credit: 2 }
];

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

        return this.result;
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
        let subjectIndex = 0;

        for (let line of lines) {
            const clean = line.replace(/\s+/g, " ").trim();
            const upper = clean.toUpperCase();

            // COLLEGE
            if (!this.result.college.name && upper.includes("COLLEGE")) {
                this.result.college = { name: clean };
            }

            // STUDENT START
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
                    result: "-",
                    subjects: []
                };

                subjectIndex = 0;
                continue;
            }

            if (!student) continue;

            // ERN / PRN (MU...)
            const prnMatch = clean.match(/\((MU\d+)\)/);
            if (prnMatch) {
                student.prn = prnMatch[1];
            }

            // SUBJECT TOTAL ROW
            const totMatch = clean.match(
                /^TOT\s+(\d+)\s+(\d+)\s+([A-F\+O]+)\s+(\d+)\s+([\d\.]+)$/i
            );

            if (totMatch && SUBJECT_MASTER[subjectIndex]) {
                const subj = SUBJECT_MASTER[subjectIndex];

                student.subjects.push({
                    code: subj.code,
                    name: subj.name,
                    credit: subj.credit,
                    total: Number(totMatch[1]),
                    gp: Number(totMatch[2]),
                    grade: totMatch[3],
                    cp: Number(totMatch[5])
                });

                subjectIndex++;
            }

            // SGPA
            if (upper.includes("SGPA")) {
                const sgpaMatch = clean.match(/SGPA\s*[:\-]?\s*(\d+\.\d+)/i);
                if (sgpaMatch) {
                    student.sgpa = sgpaMatch[1];
                }
            }

            // RESULT
            if (upper.includes("RESULT")) {
                if (upper.includes("PASS")) student.result = "PASS";
                else if (upper.includes("FAIL")) student.result = "FAIL";
            }
        }

        if (student) {
            this.result.students.push(student);
        }
    }
}
