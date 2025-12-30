window.fullResult = null;

window.addEventListener("DOMContentLoaded", () => {

    const processBtn = document.getElementById("process-btn");
    const statusText = document.getElementById("status-text");
    const dashboard = document.getElementById("dashboard");
    const tableBody = document.getElementById("table-body");
    const studentCount = document.getElementById("student-count");

    processBtn.addEventListener("click", async () => {
        const file = document.getElementById("pdf-upload").files[0];
        if (!file) return alert("Select a PDF");

        processBtn.disabled = true;
        statusText.innerText = "Parsing PDF...";
        dashboard.classList.add("hidden");

        try {
            const parser = new LedgerParser();
            window.fullResult = await parser.parse(file, (c, t) => {
                statusText.innerText = `Scanning page ${c}/${t}`;
            });

            renderTable(window.fullResult.students);

            studentCount.innerText = window.fullResult.students.length;
            dashboard.classList.remove("hidden");
            statusText.innerText = "Completed";
            processBtn.disabled = false;

        } catch (err) {
            console.error(err);
            statusText.innerText = "Error occurred";
            processBtn.disabled = false;
        }
    });

    function renderTable(students) {
        tableBody.innerHTML = "";

        if (!Array.isArray(students)) return;

        students.forEach(s => {
            const tr = document.createElement("tr");
            tr.className = "border-b";

            tr.innerHTML = `
                <td class="p-2">${s.seatNo}</td>
                <td class="p-2">${s.name}</td>
                <td class="p-2 font-bold">${s.sgpa}</td>
                <td class="p-2">${s.result}</td>
                <td class="p-2 text-right">
                    <button class="text-indigo-600 font-bold"
                        onclick="viewCard('${s.seatNo}')">
                        View Card
                    </button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    window.viewCard = (seatNo) => {
        const s = window.fullResult.students.find(x => x.seatNo === seatNo);
        document.getElementById("print-area").innerHTML =
            Renderer.renderCard(s, window.fullResult.college);
        window.print();
    };

    window.exportToExcel = () => {
        if (!window.fullResult) return;
        const ws = XLSX.utils.json_to_sheet(window.fullResult.students);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Results");
        XLSX.writeFile(wb, "MU_Result.xlsx");
    };
});
