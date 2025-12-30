if (!window.Renderer) {

    window.Renderer = {
        renderCard: (student, college) => `
        <div class="p-10 text-sm" style="width:210mm;min-height:297mm;">
            <h2 class="text-center text-xl font-bold mb-1">
                University of Mumbai
            </h2>
            <p class="text-center font-semibold mb-4">
                GRADE CARD
            </p>

            <div class="border p-3 mb-4">
                <p><b>Name:</b> ${student.name}</p>
                <p><b>Seat No:</b> ${student.seatNo}</p>
                <p><b>ERN:</b> ${student.prn}</p>
                <p><b>College:</b> ${college?.name || "-"}</p>
            </div>

            <table class="w-full border text-xs">
                <thead class="bg-gray-100">
                    <tr>
                        <th class="border p-1">Code</th>
                        <th class="border p-1">Subject</th>
                        <th class="border p-1">Cr</th>
                        <th class="border p-1">Total</th>
                        <th class="border p-1">Grade</th>
                        <th class="border p-1">GP</th>
                        <th class="border p-1">C×G</th>
                    </tr>
                </thead>
                <tbody>
                    ${student.subjects.map(s => `
                        <tr>
                            <td class="border p-1">${s.code}</td>
                            <td class="border p-1">${s.name}</td>
                            <td class="border p-1">${s.credit}</td>
                            <td class="border p-1">${s.total}</td>
                            <td class="border p-1">${s.grade}</td>
                            <td class="border p-1">${s.gp}</td>
                            <td class="border p-1">${s.cp}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>

            <div class="mt-4">
                <p><b>SGPA:</b> ${student.sgpa}</p>
                <p><b>Result:</b> ${student.result}</p>
            </div>
        </div>
        `
    };
}
