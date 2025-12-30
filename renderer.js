const Renderer = {
    renderCard: (student, college) => `
    <div class="p-10 text-sm" style="width:210mm;min-height:297mm;">
        <h2 class="text-center text-xl font-bold mb-2">University of Mumbai</h2>
        <p class="text-center mb-4">GRADE CARD</p>

        <div class="border p-3 mb-4">
            <p><b>Name:</b> ${student.name}</p>
            <p><b>Seat No:</b> ${student.seatNo}</p>
            <p><b>PRN:</b> ${student.prn}</p>
            <p><b>College:</b> ${college?.name || "-"}</p>
        </div>

        <div class="mt-4">
            <p><b>SGPA:</b> ${student.sgpa}</p>
            <p><b>Result:</b> ${student.result}</p>
        </div>
    </div>
    `
};
