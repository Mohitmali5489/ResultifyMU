let extractedData = [];

// DOM Elements
const processBtn = document.getElementById('process-btn');
const statusText = document.getElementById('status-text');
const dashboard = document.getElementById('dashboard');
const tableBody = document.getElementById('table-body');
const studentCount = document.getElementById('student-count');

processBtn.addEventListener('click', async () => {
    const fileInput = document.getElementById('pdf-upload');
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a PDF file.");
        return;
    }

    // Reset UI
    processBtn.disabled = true;
    processBtn.innerText = "Scanning...";
    statusText.innerText = "Initializing parser...";
    dashboard.classList.add('hidden');
    extractedData = [];

    const parser = new LedgerParser();

    try {
        extractedData = await parser.parse(file, (curr, total) => {
            statusText.innerText = `Scanning Page ${curr} of ${total}...`;
        });

        // Done
        statusText.innerText = "Processing Complete!";
        processBtn.innerText = "Process Ledger";
        processBtn.disabled = false;

        // Update Dashboard
        dashboard.classList.remove('hidden');
        studentCount.innerText = extractedData.length;
        renderTable(extractedData);

    } catch (error) {
        console.error(error);
        statusText.innerText = "Error: " + error.message;
        processBtn.disabled = false;
        processBtn.innerText = "Retry";
    }
});

function renderTable(data) {
    tableBody.innerHTML = '';
    
    // Show top 200 for performance
    const displayData = data.slice(0, 200);

    displayData.forEach(student => {
        const tr = document.createElement('tr');
        tr.className = "bg-white border-b hover:bg-slate-50";
        tr.innerHTML = `
            <td class="px-6 py-4 font-mono text-slate-600">${student.seatNo}</td>
            <td class="px-6 py-4 font-medium text-slate-900">${student.name}</td>
            <td class="px-6 py-4 text-xs text-slate-500">${student.prn}</td>
            <td class="px-6 py-4 font-bold text-slate-800">${student.sgpa}</td>
            <td class="px-6 py-4">
                <span class="px-2 py-1 rounded text-xs font-bold ${student.status === 'PASS' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                    ${student.status}
                </span>
            </td>
            <td class="px-6 py-4 text-right">
                <button onclick="viewCard('${student.seatNo}')" class="text-indigo-600 hover:text-indigo-900 font-bold text-sm">View Card</button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

window.viewCard = (seatNo) => {
    const student = extractedData.find(s => s.seatNo === seatNo);
    if (!student) return;

    // Inject HTML into Print Area
    document.getElementById('print-area').innerHTML = Renderer.renderCard(student);
    
    // Trigger Print
    window.print();
};

window.exportToExcel = () => {
    if (extractedData.length === 0) return;
    
    const ws = XLSX.utils.json_to_sheet(extractedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Results");
    XLSX.writeFile(wb, "Result_Data.xlsx");
};
