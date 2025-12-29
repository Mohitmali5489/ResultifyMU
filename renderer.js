let fullResult = null;

const btn = document.getElementById("process-btn");
const status = document.getElementById("status-text");
const dashboard = document.getElementById("dashboard");
const tableBody = document.getElementById("table-body");
const count = document.getElementById("student-count");

btn.onclick = async () => {
    const file = document.getElementById("pdf-upload").files[0];
    if (!file) return alert("Select PDF");

    btn.disabled = true;
    status.innerText = "Parsing PDF...";

    const parser = new LedgerParser();
    fullResult = await parser.parse(file, (c, t) => {
        status.innerText = `Scanning page ${c}/${t}`;
    });

    btn.disabled = false;
    status.innerText = "Completed";

    dashboard.classList.remove("hidden");
    count.innerText = fullResult.students.length;
    renderTable();
};

function renderTable() {
    tableBody.innerHTML = "";
    fullResult.students.forEach(s => {
        tableBody.innerHTML += `
        <tr class="border-b">
            <td class="p-2">${s.seatNo}</td>
            <td class="p-2">${s.name}</td>
            <td class="p-2 font-bold">${s.sgpa}</td>
            <td class="p-2">
                <span class="${s.result === 'PASS' ? 'text-green-600' : 'text-red-600'}">
                    ${s.result}
                </span>
            </td>
            <td class="p-2 text-right">
                <button class="text-indigo-600 font-bold"
                        onclick="viewCard('${s.seatNo}')">
                    View Card
                </button>
            </td>
        </tr>`;
    });
}

function viewCard(seatNo) {
    const student = fullResult.students.find(s => s.seatNo === seatNo);
    document.getElementById("print-area").innerHTML =
        Renderer.renderCard(student, fullResult.college);
    window.print();
}

function exportToExcel() {
    const ws = XLSX.utils.json_to_sheet(fullResult.students);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "MU_Result.xlsx");
}
