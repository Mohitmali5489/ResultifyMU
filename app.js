window.fullResult = null;

document.addEventListener("DOMContentLoaded", () => {

    const processBtn = document.getElementById("process-btn");
    const statusText = document.getElementById("status-text");
    const dashboard = document.getElementById("dashboard");
    const tableBody = document.getElementById("table-body");
    const studentCount = document.getElementById("student-count");

    processBtn.onclick = async () => {
        const file = document.getElementById("pdf-upload").files[0];
        if (!file) return alert("Please select a PDF");

        processBtn.disabled = true;
        statusText.innerText = "Parsing PDF...";
        dashboard.classList.add("hidden");

        const parser = new window.LedgerParser();
        window.fullResult = await parser.parse(file, (c, t) => {
            statusText.innerText = `Processing page ${c}/${t}`;
        });

        renderTable(window.fullResult.students);

        studentCount.innerText = window.fullResult.students.length;
        dashboard.classList.remove("hidden");
        statusText.innerText = "Completed";
        processBtn.disabled = false;
    };

    function renderTable(students) {
        tableBody.innerHTML = "";
        students.forEach(s => {
            tableBody.innerHTML += `
                <tr class="border-b">
                    <td class="p-2">${s.seatNo}</td>
                    <td class="p-2">${s.name}</td>
                    <td class="p-2">${s.sgpa}</td>
                    <td class="p-2">${s.result}</td>
                    <td class="p-2 text-right">
                        <button class="text-indigo-600"
                                onclick="viewCard('${s.seatNo}')">
                            View Card
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    window.viewCard = seatNo => {
        const student = window.fullResult.students.find(s => s.seatNo === seatNo);
        document.getElementById("print-area").innerHTML =
            window.Renderer.renderCard(student, window.fullResult.college);
        window.print();
    };

    window.exportToExcel = () => {
        const ws = XLSX.utils.json_to_sheet(window.fullResult.students);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Results");
        XLSX.writeFile(wb, "MU_Results.xlsx");
    };
});
