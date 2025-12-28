let extractedData = [];

// DOM Elements
const processBtn = document.getElementById('process-btn');
const statusContainer = document.getElementById('status-container');
const progressBar = document.getElementById('progress-bar');
const statusText = document.getElementById('status-text');
const dashboard = document.getElementById('dashboard');
const tableBody = document.getElementById('students-table-body');
const searchBox = document.getElementById('search-box');

// Event Listener: Process
processBtn.addEventListener('click', async () => {
    const fileInput = document.getElementById('pdf-upload');
    if (fileInput.files.length === 0) {
        alert("Please select a PDF file first.");
        return;
    }

    // UI Reset
    processBtn.disabled = true;
    processBtn.innerText = "Processing...";
    statusContainer.classList.remove('hidden');
    dashboard.classList.add('hidden');
    extractedData = [];

    const parser = new LedgerParser();
    
    try {
        const students = await parser.parse(fileInput.files[0], (pageNum, total) => {
            const percent = Math.round((pageNum / total) * 100);
            progressBar.style.width = `${percent}%`;
            statusText.innerText = `Scanning page ${pageNum} of ${total}...`;
        });

        extractedData = students;
        
        // Finalize UI
        statusText.innerText = "Processing Complete!";
        setTimeout(() => statusContainer.classList.add('hidden'), 1000);
        
        dashboard.classList.remove('hidden');
        document.getElementById('student-count').innerText = extractedData.length;
        
        renderTable(extractedData);
        processBtn.disabled = false;
        processBtn.innerText = "Process Ledger";

    } catch (err) {
        console.error(err);
        statusText.innerText = "Error: " + err.message;
        statusText.classList.add('text-red-600');
        processBtn.disabled = false;
    }
});

// Render Table
function renderTable(data) {
    tableBody.innerHTML = '';
    
    // Limit display to first 100 for performance if list is huge
    const displayData = data.slice(0, 200);

    if (displayData.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-gray-500">No students found.</td></tr>';
        return;
    }

    displayData.forEach((student, index) => {
        const row = document.createElement('tr');
        row.className = "bg-white border-b hover:bg-blue-50 transition";
        row.innerHTML = `
            <td class="px-6 py-4 font-medium text-gray-900">${student.seatNo}</td>
            <td class="px-6 py-4">${student.name}</td>
            <td class="px-6 py-4 font-mono text-xs text-slate-500">${student.prn || '-'}</td>
            <td class="px-6 py-4 text-center font-bold text-slate-700">${student.sgpa}</td>
            <td class="px-6 py-4 text-center">
                <span class="px-2 py-1 rounded text-xs font-bold ${getStatusColor(student.status)}">
                    ${student.status}
                </span>
            </td>
            <td class="px-6 py-4 text-center">
                <button onclick="generatePDF('${student.seatNo}')" class="text-blue-600 hover:text-blue-800 font-medium text-sm border border-blue-200 px-3 py-1 rounded hover:bg-blue-100 transition">
                    View Card
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Helper: Status Colors
function getStatusColor(status) {
    if (status === 'PASS') return 'bg-green-100 text-green-700';
    if (status === 'FAIL') return 'bg-red-100 text-red-700';
    return 'bg-yellow-100 text-yellow-700';
}

// Search Functionality
searchBox.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = extractedData.filter(s => 
        s.name.toLowerCase().includes(term) || 
        s.seatNo.includes(term) || 
        (s.prn && s.prn.includes(term))
    );
    renderTable(filtered);
});

// EXPORT: Excel
window.exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(extractedData.map(s => ({
        "Seat No": s.seatNo,
        "Name": s.name,
        "PRN": s.prn,
        "College": s.college,
        "SGPA": s.sgpa,
        "Status": s.status
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Result_Data");
    XLSX.writeFile(wb, "University_Result_Ledger.xlsx");
};

// EXPORT: CSV
window.exportToCSV = () => {
    const ws = XLSX.utils.json_to_sheet(extractedData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "University_Result.csv";
    link.click();
};

// GENERATE INDIVIDUAL PDF (Print Logic)
window.generatePDF = (seatNo) => {
    const student = extractedData.find(s => s.seatNo === seatNo);
    if (!student) return;

    const printArea = document.getElementById('print-area');
    printArea.innerHTML = Renderer.createGradeCard(student);

    // Trigger Browser Print
    window.print();
};
