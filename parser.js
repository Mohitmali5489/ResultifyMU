const SUBJECTS = [
    { code: "1102311", name: "Social Media Marketing (OE)", credit: 2 },
    { code: "1112312", name: "Environmental Science", credit: 2 },
    { code: "1162111", name: "Financial Accounting - II", credit: 4 },
    { code: "1162112", name: "Auditing - II", credit: 2 },
    { code: "1162411", name: "Vocational Skills in A&F - III", credit: 2 },
    { code: "1162412", name: "Vocational Skills in A&F - IV", credit: 2 },
    { code: "1242211", name: "Introduction to Business", credit: 2 },
    { code: "2512511", name: "Lekhan Kaushalya", credit: 2 },
    { code: "2542520", name: "Foundation of Behavioral Skills", credit: 2 },
    { code: "2522620", name: "Sports, Yoga & Fitness", credit: 2 }
];

class LedgerParser {
    constructor() {
        this.result = {
            university: "University of Mumbai",
            exam: "",
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

            if (!this.result.college.name && upper.includes("COLLEGE")) {
                this.result.college = {
                    code: "MU-1122",
                    name: clean
                };
            }

            const seatMatch = clean.match(/^(\d{7,15})\s+([A-Z\s\.]+)$/);
            if (seatMatch) {
                if (student) this.result.students.push(student);
                student = {
                    seatNo: seatMatch[1],
                    name: seatMatch[2],
                    prn: "",
                    sgpa: null,
                    result: "FAIL",
                    subjects: []
                };
                subjectIndex = 0;
                continue;
            }

            if (!student) continue;

            const prnMatch = clean.match(/\((MU\w+)\)/);
            if (prnMatch) student.prn = prnMatch[1];

            const subjectRow = clean.match(/^(\d+)\s+(\d+)\s+([A-F\+O]+)\s+(\d+)\s+([\d\.]+)$/);
            if (subjectRow && SUBJECTS[subjectIndex]) {
                const s = SUBJECTS[subjectIndex];
                student.subjects.push({
                    code: s.code,
                    name: s.name,
                    credit: s.credit,
                    total: Number(subjectRow[1]),
                    grade: subjectRow[3],
                    gp: Number(subjectRow[2]),
                    cp: Number(subjectRow[5])
                });
                subjectIndex++;
            }

            if (upper.includes("SGPA")) {
                student.sgpa = parseFloat(clean.match(/(\d+\.\d+)/)?.[1] || 0);
                student.result = upper.includes("PASS") ? "PASS" : "FAIL";
            }
        }

        if (student) {
            const exists = this.result.students.some(s => s.seatNo === student.seatNo);
            if (!exists) this.result.students.push(student);
        }
    }
}
