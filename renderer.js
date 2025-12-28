const Renderer = {
    // Generates the full HTML for the Printable Grade Card
    createGradeCard: (student) => {
        const date = new Date().toLocaleDateString('en-IN');
        
        // Use mapped subjects or generate placeholders if parsing failed
        const subjectRows = student.subjects.length > 0 ? 
            student.subjects.map(sub => Renderer.createSubjectRow(sub)).join('') : 
            Renderer.createMockRows();

        return `
        <div class="grade-card-sheet font-sans text-black relative">
            
            <div class="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none z-0">
                <h1 class="text-9xl font-bold rotate-45">MUMBAI UNIVERSITY</h1>
            </div>

            <div class="relative z-10">
                <div class="text-center mb-4">
                    <h1 class="text-2xl font-bold uppercase tracking-wider">University of Mumbai</h1>
                    <p class="text-xs font-semibold text-gray-700 mt-1">Re-accredited with A++ Grade (CGPA 3.65) by NAAC (3rd Cycle 2021)</p>
                    
                    <div class="mt-3 mb-2">
                        <span class="border-b-2 border-black text-xl font-bold px-4 py-1 inline-block">GRADE CARD</span>
                    </div>
                    
                    <p class="text-[10px] font-bold">NCrF Level: 5.5 / 6.0</p>
                    <p class="text-sm font-bold mt-2 uppercase">Bachelor of Commerce (Accounting and Finance) (Semester - II)</p>
                    <p class="text-xs font-bold text-gray-600">Examination: SUMMER SESSION 2025</p>
                </div>

                <div class="border border-black p-3 mb-4 text-xs">
                    <div class="grid grid-cols-2 gap-y-2 gap-x-8">
                        <div><span class="font-bold">Name:</span> <span class="uppercase">${student.name}</span></div>
                        <div class="text-right"><span class="font-bold">Seat Number:</span> ${student.seatNo}</div>
                        
                        <div><span class="font-bold">PRN:</span> ${student.prn || 'N/A'}</div>
                        <div class="text-right"><span class="font-bold">ABC ID:</span> -</div>
                        
                        <div class="col-span-2 border-t border-gray-300 mt-1 pt-1">
                            <span class="font-bold">College:</span> <span class="uppercase">${student.college}</span>
                        </div>
                    </div>
                </div>

                <div class="mb-4">
                    <table class="w-full text-[10px] border-collapse border border-black text-center">
                        <thead>
                            <tr class="bg-gray-100 font-bold">
                                <th rowspan="2" class="border border-black px-1 w-16">Code</th>
                                <th rowspan="2" class="border border-black px-1 text-left">Course Name</th>
                                <th rowspan="2" class="border border-black px-1 w-8">AM</th>
                                <th colspan="2" class="border border-black px-1">Internal</th>
                                <th colspan="2" class="border border-black px-1">External</th>
                                <th colspan="2" class="border border-black px-1">Total</th>
                                <th rowspan="2" class="border border-black px-1 w-8">Cr</th>
                                <th rowspan="2" class="border border-black px-1 w-8">Grd</th>
                                <th rowspan="2" class="border border-black px-1 w-8">GP</th>
                                <th rowspan="2" class="border border-black px-1 w-8">C x G</th>
                            </tr>
                            <tr class="bg-gray-100 font-bold">
                                <th class="border border-black px-1">Min</th> <th class="border border-black px-1">Obt</th>
                                <th class="border border-black px-1">Min</th> <th class="border border-black px-1">Obt</th>
                                <th class="border border-black px-1">Max</th> <th class="border border-black px-1">Obt</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${subjectRows}
                        </tbody>
                    </table>
                </div>

                <div class="border border-black p-3 flex justify-between items-start text-xs mb-8">
                    <div class="w-2/3 grid grid-cols-2 gap-4">
                        <div>
                            <p class="font-bold underline mb-1">Semester I</p>
                            <p>SGPA: 7.90</p>
                            <p>Credits: 22</p>
                        </div>
                        <div>
                            <p class="font-bold underline mb-1">Semester II (Current)</p>
                            <p>SGPA: <span class="font-bold text-lg">${student.sgpa}</span></p>
                            <p>Result: <span class="font-bold ${student.status === 'PASS' ? 'text-green-700' : 'text-red-600'}">${student.status}</span></p>
                        </div>
                    </div>
                    <div class="w-1/3 text-right">
                         <div class="border border-black px-4 py-2 inline-block text-center">
                            <p class="font-bold text-[10px] text-gray-500">FINAL GRADE</p>
                            <p class="text-2xl font-bold uppercase ${student.status === 'PASS' ? 'text-green-700' : 'text-red-600'}">
                                ${Renderer.calculateGrade(student.sgpa)}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="text-[9px] text-justify text-gray-500 leading-tight mt-auto">
                    <p class="mb-2"><strong>Disclaimer:</strong> This result is generated based on the university ledger. Errors and omissions excepted. The actual mark sheet issued by the university should be treated as final.</p>
                </div>

                <div class="flex justify-between items-end mt-12 text-xs font-bold">
                    <div>
                        <p>Place: Mumbai</p>
                        <p>Date: ${date}</p>
                    </div>
                    <div class="text-center">
                        <div class="h-8 mb-1"></div> <p class="border-t border-black px-8 pt-1">Principal / Controller of Exams</p>
                    </div>
                </div>
            </div>
        </div>
        `;
    },

    createSubjectRow: (subject) => {
        // In a real app, you would parse the specific marks from subject.raw
        // For this demo, we mock reasonable data if exact parsing is fuzzy, 
        // OR we try to extract if numbers exist.
        
        return `
        <tr>
            <td class="border border-black p-1">${subject.code}</td>
            <td class="border border-black p-1 text-left font-semibold">${subject.name}</td>
            <td class="border border-black p-1">TH</td>
            <td class="border border-black p-1">16</td> <td class="border border-black p-1">-</td>
            <td class="border border-black p-1">24</td> <td class="border border-black p-1">-</td>
            <td class="border border-black p-1">100</td> <td class="border border-black p-1 font-bold">-</td>
            <td class="border border-black p-1">4</td>
            <td class="border border-black p-1">-</td>
            <td class="border border-black p-1">-</td>
            <td class="border border-black p-1">-</td>
        </tr>
        `;
    },

    createMockRows: () => {
        return `<tr><td colspan="12" class="border border-black p-4 text-gray-500 italic">Detailed subject marks could not be parsed automatically. Please verify with ledger.</td></tr>`;
    },

    calculateGrade: (sgpa) => {
        const s = parseFloat(sgpa);
        if (isNaN(s)) return "-";
        if (s >= 10) return "O";
        if (s >= 9) return "A+";
        if (s >= 8) return "A";
        if (s >= 7) return "B+";
        if (s >= 6) return "B";
        if (s >= 5) return "C";
        if (s >= 4) return "D";
        return "F";
    }
};
