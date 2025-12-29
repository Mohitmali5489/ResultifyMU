// GLOBAL STATE (SAFE)
window.fullResult = null;

window.addEventListener("DOMContentLoaded", () => {

    window.processBtn = document.getElementById("process-btn");
    window.statusText = document.getElementById("status-text");
    window.dashboardEl = document.getElementById("dashboard");
    window.tableBody = document.getElementById("table-body");
    window.studentCount = document.getElementById("student-count");

    processBtn.addEventListener("click", async () => {
        const file = document.getElementById("pdf-upload").files[0];
        if (!file) {
            alert("Please select a PDF file");
            return;
        }

        processBtn.disabled = true;
        statusText.innerText = "Initializing parser...";
        dashboardEl.classList.add("hidden");

        try {
            const parser = new LedgerParser();

            window.fullResult = await parser.parse(file, (curr, total) => {
                statusText.innerText = `Scanning page ${curr} of ${total}...`;
            });

            statusText.innerText = "Completed";
            processBtn.disabled = false;

            studentCount.innerText = window.fullResult.students.length;
            dashboardEl.classList.remove("hidden");

            renderTable(window.fullResult.students);

        } catch (err) {
            console.error(err);
            statusText.innerText = "Error occurred. Check console.";
            processBtn.disabled = false;
        }
    });
});

function renderTable(students) {
    tableBody.innerHTML = "";

    students.forEach(student => {
        const tr = document.createElement("tr");
        tr.className = "border-b";

        tr.innerHTML = `
            <td class="p-2">${student.seatNo}</td>
            <td class="p-2">${student.name}</td>
            <td class="p-2 font-bold">${student.sgpa ?? "-"}</td>
            <td class="p-2">
                <span class="${student.result === 'PASS'
                    ? 'text-green-600'
                    : 'text-red-600'}">
                    ${student.result}
                </span>
            </td>
            <td class="p-2 text-right">
                <button
                    class="text-indigo-600 font-bold"
                    onclick="viewCard('${student.seatNo}')">
                    View Card
                </button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

window.viewCard = (seatNo) => {
    const student = window.fullResult.students.find(
        s => s.seatNo === seatNo
    );

    document.getElementById("print-area").innerHTML =
        Renderer.renderCard(student, window.fullResult.college);

    window.print();
};

window.exportToExcel = () => {
    if (!window.fullResult) return;

    const ws = XLSX.utils.json_to_sheet(window.fullResult.students);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "MU_Result.xlsx");
};
