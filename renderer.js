const Renderer = {
    renderCard: (student) => {
        const date = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY

        return `
        <div class="bg-white text-black font-sans p-8 mx-auto" style="width: 210mm; min-height: 297mm;">
            
            <div class="text-center mb-6">
                <div class="flex justify-center mb-2">
                   <div class="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center text-[10px] text-gray-400">LOGO</div>
                </div>
                <h1 class="text-2xl font-bold uppercase tracking-wide">University of Mumbai</h1>
                <p class="text-[10px] font-semibold text-gray-600">Re-accredited with A++ Grade (CGPA 3.65) by NAAC (3rd Cycle 2021)</p>
                
                <div class="mt-2 mb-2">
                    <span class="border-b-2 border-black text-lg font-bold px-4 py-1 inline-block">GRADE CARD</span>
                </div>
                
                <p class="text-[10px] font-bold">NCrF Level: 6.0</p>
                <p class="text-xs font-bold uppercase mt-1">Bachelor of Commerce (Accounting and Finance)</p>
                <p class="text-xs font-bold text-gray-600">Examination: SUMMER SESSION 2025</p>
            </div>

            <div class="border border-black p-3 mb-4 text-xs">
                <div class="grid grid-cols-2 gap-y-1 gap-x-4">
                    <div><span class="font-bold">Name:</span> ${student.name}</div>
                    <div class="text-right"><span class="font-bold">Seat Number:</span> ${student.seatNo}</div>
                    
                    <div><span class="font-bold">PRN:</span> ${student.prn}</div>
                    <div class="text-right"><span class="font-bold">College Code:</span> 1122</div>
                    
                    <div class="col-span-2 mt-1 pt-1 border-t border-gray-300">
                        <span class="font-bold">College:</span> ${student.college || 'Kalyan Citizens Education Societys B K Birla College'}
                    </div>
                </div>
            </div>

            <div class="mb-4">
                <table class="w-full text-[10px] border-collapse border border-black text-center">
                    <thead>
                        <tr class="bg-gray-100 font-bold">
                            <th class="border border-black p-1">Code</th>
                            <th class="border border-black p-1 text-left">Course Name</th>
                            <th class="border border-black p-1">AM</th>
                            <th class="border border-black p-1">Int (Min/Obt)</th>
                            <th class="border border-black p-1">Ext (Min/Obt)</th>
                            <th class="border border-black p-1">Total (Max/Obt)</th>
                            <th class="border border-black p-1">Cr</th>
                            <th class="border border-black p-1">Grd</th>
                            <th class="border border-black p-1">GP</th>
                            <th class="border border-black p-1">C x G</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="border border-black p-1">1162111</td>
                            <td class="border border-black p-1 text-left">Financial Accounting - II</td>
                            <td class="border border-black p-1">TH</td>
                            <td class="border border-black p-1">16 / --</td>
                            <td class="border border-black p-1">24 / --</td>
                            <td class="border border-black p-1">100 / <span class="font-bold">--</span></td>
                            <td class="border border-black p-1">4</td>
                            <td class="border border-black p-1 font-bold">A</td>
                            <td class="border border-black p-1">8</td>
                            <td class="border border-black p-1">32</td>
                        </tr>
                        <tr>
                            <td class="border border-black p-1">1162112</td>
                            <td class="border border-black p-1 text-left">Auditing - II</td>
                            <td class="border border-black p-1">TH</td>
                            <td class="border border-black p-1">16 / --</td>
                            <td class="border border-black p-1">24 / --</td>
                            <td class="border border-black p-1">100 / <span class="font-bold">--</span></td>
                            <td class="border border-black p-1">4</td>
                            <td class="border border-black p-1 font-bold">B+</td>
                            <td class="border border-black p-1">7</td>
                            <td class="border border-black p-1">28</td>
                        </tr>
                        <tr>
                            <td colspan="10" class="border border-black p-2 text-gray-500 italic">
                                * Detailed course-wise marks are summarized. Refer to official ledger for raw split.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class="border border-black p-3 flex justify-between items-start text-xs mb-8">
                <div class="w-2/3">
                    <p class="font-bold mb-1">Semester Summary</p>
                    <p>Total Credits: 22</p>
                    <p>SGPA: <span class="text-lg font-bold">${student.sgpa}</span></p>
                    <p>Status: <span class="font-bold ${student.status === 'PASS' ? 'text-green-700' : 'text-red-600'}">${student.status}</span></p>
                </div>
                <div class="w-1/3 text-right">
                    <div class="border border-black px-4 py-2 inline-block text-center">
                        <p class="font-bold text-[10px] text-gray-500">FINAL RESULT</p>
                        <p class="text-xl font-bold uppercase ${student.status === 'PASS' ? 'text-green-700' : 'text-red-600'}">
                            ${student.status}
                        </p>
                    </div>
                </div>
            </div>

            <div class="mt-auto pt-8">
                <p class="text-[9px] text-justify text-gray-500 mb-8">
                    <strong>Disclaimer:</strong> This document is generated electronically based on the University Ledger. 
                    It is for informational purposes only. The original mark sheet issued by the University should be treated as authentic.
                </p>

                <div class="flex justify-between items-end text-xs font-bold">
                    <div>
                        <p>Place: Mumbai</p>
                        <p>Date: ${date}</p>
                    </div>
                    <div class="text-center">
                        <p class="border-t border-black px-8 pt-1">Principal Signature</p>
                    </div>
                </div>
            </div>
        </div>
        `;
    }
};
