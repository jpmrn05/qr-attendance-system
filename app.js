// ===== STUDENT DATABASE =====
const students = {
    "GRADE 4-BONIFACIO": [
        { id: "G4B001", name: "Alice Johnson", gender: "Male" },
        { id: "G4B002", name: "Bob Smith", gender: "Male" },
        { id: "G4B003", name: "Carina Santos", gender: "Female" },
        { id: "G4B004", name: "Daniel Reyes", gender: "Male" },
        { id: "G4B005", name: "Emily Cruz", gender: "Female" },
    ],
    "GRADE 5-LUNA": [
        { id: "G5L001", name: "Francisco Luna", gender: "Male" },
        { id: "G5L002", name: "Grace Maria", gender: "Female" },
        { id: "G5L003", name: "Henry Gonzales", gender: "Male" },
        { id: "G5L004", name: "Iris Mendoza", gender: "Female" },
        { id: "G5L005", name: "Juan Dela Cruz", gender: "Male" },
    ],
    "GRADE 6-RIZAL": [
        { id: "G6R001", name: "Karen Hernandez", gender: "Female" },
        { id: "G6R002", name: "Leo Villanueva", gender: "Male" },
        { id: "G6R003", name: "Maria Santos", gender: "Female" },
        { id: "G6R004", name: "Nathan Garcia", gender: "Male" },
        { id: "G6R005", name: "Olivia Perez", gender: "Female" },
    ]
};

// ===== CONFIG =====
let config = {
    classStartTime: "07:00",
    lateCutoffTime: "07:10",
    finalCutoffTime: "07:30"
};

// ===== ATTENDANCE DATA =====
let attendanceData = [];
let currentSession = {
    section: "",
    subject: "",
    sessionId: "",
    startTime: null
};

let qrScanner = null;
let qrCode = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Load data from localStorage
    loadFromStorage();
    
    // Set today's date in dashboard
    document.getElementById('dashboardDate').valueAsDate = new Date();
    
    // Setup navigation
    setupNavigation();
    
    // Display student list in settings
    displayStudentLists();
    
    // Display summary
    updateDashboard();
}

// ===== STORAGE MANAGEMENT =====
function saveToStorage() {
    localStorage.setItem('attendanceData', JSON.stringify(attendanceData));
    localStorage.setItem('students', JSON.stringify(students));
    localStorage.setItem('config', JSON.stringify(config));
}

function loadFromStorage() {
    const savedAttendance = localStorage.getItem('attendanceData');
    const savedStudents = localStorage.getItem('students');
    const savedConfig = localStorage.getItem('config');
    
    if (savedAttendance) attendanceData = JSON.parse(savedAttendance);
    if (savedStudents) Object.assign(students, JSON.parse(savedStudents));
    if (savedConfig) config = JSON.parse(savedConfig);
    
    // Update UI with saved config
    document.getElementById('classStartTime').value = config.classStartTime;
    document.getElementById('lateCutoffTime').value = config.lateCutoffTime;
    document.getElementById('finalCutoffTime').value = config.finalCutoffTime;
}

// ===== NAVIGATION =====
function setupNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const pageId = this.getAttribute('data-page');
            navigateTo(pageId);
        });
    });
}

function navigateTo(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Remove active class from nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected page
    document.getElementById(pageId).classList.add('active');
    document.querySelector(`[data-page="${pageId}"]`).classList.add('active');
    
    // Stop scanner if switching away from scanner page
    if (pageId !== 'scanner' && qrScanner) {
        qrScanner.stop();
        document.getElementById('qr-reader').style.display = 'none';
    }
}

// ===== DASHBOARD FUNCTIONS =====
function applyDashboardFilters() {
    updateDashboard();
}

function updateDashboard() {
    const section = document.getElementById('dashboardSection').value;
    const subject = document.getElementById('dashboardSubject').value;
    const date = document.getElementById('dashboardDate').value;
    
    // Filter attendance data
    let filteredData = attendanceData.filter(record => {
        const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
        return record.section === section &&
               (subject === '' || record.subject === subject) &&
               recordDate === date;
    });
    
    // Get all students in section
    const sectionStudents = students[section] || [];
    
    // Build full attendance list
    let attendanceList = sectionStudents.map(student => {
        const record = filteredData.find(r => r.studentId === student.id);
        if (record) {
            return record;
        } else {
            // Auto-generate ABSENT if no record
            return {
                studentId: student.id,
                name: student.name,
                section: section,
                subject: subject === '' ? 'All' : subject,
                timestamp: null,
                status: 'Absent',
                timeIn: '—'
            };
        }
    });
    
    // Display table
    displayAttendanceTable(attendanceList);
    
    // Update summary
    updateSummary(attendanceList);
}

function displayAttendanceTable(data) {
    const tbody = document.getElementById('attendanceTableBody');
    tbody.innerHTML = '';
    
    data.forEach(record => {
        const row = document.createElement('tr');
        const statusClass = `status-${record.status.toLowerCase()}`;
        
        row.innerHTML = `
            <td>${record.name}</td>
            <td>${record.section}</td>
            <td>${record.subject}</td>
            <td>${record.timeIn}</td>
            <td><span class="${statusClass}">${record.status}</span></td>
        `;
        tbody.appendChild(row);
    });
}

function updateSummary(data) {
    const present = data.filter(r => r.status === 'Present').length;
    const late = data.filter(r => r.status === 'Late').length;
    const absent = data.filter(r => r.status === 'Absent').length;
    const total = data.length;
    
    document.getElementById('presentCount').textContent = present;
    document.getElementById('lateCount').textContent = late;
    document.getElementById('absentCount').textContent = absent;
    document.getElementById('totalCount').textContent = total;
}

// ===== SCANNER FUNCTIONS =====
function startScanner() {
    const section = document.getElementById('scannerSection').value;
    const subject = document.getElementById('scannerSubject').value;
    
    if (!section || !subject) {
        showMessage('Please select section and subject', 'error', 'scannerMessage');
        return;
    }
    
    // Update current session
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
    currentSession = {
        section: section,
        subject: subject,
        sessionId: `${dateStr}-${timeStr.replace(':', '')}`,
        startTime: now
    };
    
    // Update UI
    document.getElementById('activeSection').textContent = section;
    document.getElementById('activeSubject').textContent = subject;
    document.getElementById('activeSessionId').textContent = currentSession.sessionId;
    
    // Start HTML5 QR Code Scanner
    const qrReaderDiv = document.getElementById('qr-reader');
    qrReaderDiv.style.display = 'block';
    
    qrScanner = new Html5Qrcode("qr-reader");
    
    qrScanner.start(
        { facingMode: "environment" },
        {
            fps: 10,
            qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
            handleQRScan(decodedText);
        },
        (errorMessage) => {
            // Handle errors silently
        }
    ).catch(err => {
        showMessage('Camera access denied or not available', 'error', 'scannerMessage');
    });
    
    showMessage('Scanner started! Position QR code in front of camera', 'success', 'scannerMessage');
}

function handleQRScan(qrData) {
    try {
        // Parse QR data
        const payload = JSON.parse(qrData);
        
        // Validate QR matches current session
        if (payload.section !== currentSession.section || payload.subject !== currentSession.subject) {
            showMessage('QR code does not match current session', 'error', 'scannerMessage');
            return;
        }
        
        // Show student selection
        selectStudent(payload);
    } catch (e) {
        showMessage('Invalid QR code format', 'error', 'scannerMessage');
    }
}

function selectStudent(qrPayload) {
    const section = qrPayload.section;
    const sectionStudents = students[section] || [];
    
    if (sectionStudents.length === 0) {
        showMessage('No students found for this section', 'error', 'scannerMessage');
        return;
    }
    
    // Create student selection dialog
    const studentOptions = sectionStudents
        .map(s => `<button onclick="recordAttendance('${s.id}', '${s.name}', '${qrPayload.section}', '${qrPayload.subject}')" class="student-select-btn">${s.name}</button>`)
        .join('');
    
    const studentList = `
        <div class="student-selection-dialog">
            <h3>Select Student:</h3>
            <div class="student-buttons">${studentOptions}</div>
            <button onclick="closeStudentSelection()" class="btn-secondary">Cancel</button>
        </div>
    `;
    
    // Show dialog
    const messageBox = document.getElementById('scannerMessage');
    messageBox.innerHTML = studentList;
    messageBox.style.display = 'block';
}

function recordAttendance(studentId, studentName, section, subject) {
    const now = new Date();
    const timeIn = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    // Check for duplicate scans
    const isDuplicate = attendanceData.some(record => 
        record.studentId === studentId &&
        record.section === section &&
        record.subject === subject &&
        new Date(record.timestamp).toDateString() === now.toDateString()
    );
    
    if (isDuplicate) {
        showMessage(`✓ Already recorded for ${studentName}`, 'warning', 'scannerMessage');
        closeStudentSelection();
        return;
    }
    
    // Determine status
    const status = determineStatus(now);
    
    // Add attendance record
    const record = {
        studentId: studentId,
        name: studentName,
        section: section,
        subject: subject,
        timestamp: now.toISOString(),
        status: status,
        timeIn: timeIn
    };
    
    attendanceData.push(record);
    saveToStorage();
    
    // Update UI
    const scanCount = attendanceData.filter(r => 
        r.section === section && 
        r.subject === subject &&
        new Date(r.timestamp).toDateString() === now.toDateString()
    ).length;
    
    document.getElementById('scanCount').textContent = scanCount;
    
    const statusEmoji = status === 'Present' ? '✓' : status === 'Late' ? '⚠' : '✗';
    showMessage(`${statusEmoji} ${studentName} recorded as ${status}`, 'success', 'scannerMessage');
    
    closeStudentSelection();
}

function determineStatus(timestamp) {
    const timeStr = timestamp.toTimeString().substring(0, 5); // HH:MM format
    const lateCutoff = config.lateCutoffTime; // "07:10"
    const finalCutoff = config.finalCutoffTime; // "07:30"
    
    if (timeStr < lateCutoff) {
        return 'Present';
    } else if (timeStr < finalCutoff) {
        return 'Late';
    } else {
        return 'Absent';
    }
}

function closeStudentSelection() {
    document.getElementById('scannerMessage').style.display = 'none';
    document.getElementById('scannerMessage').innerHTML = '';
}

function endSession() {
    const section = currentSession.section;
    const subject = currentSession.subject;
    const now = new Date();
    
    if (!section || !subject) {
        showMessage('No active session to end', 'error', 'scannerMessage');
        return;
    }
    
    // Get all students in section
    const sectionStudents = students[section] || [];
    
    // Find students not yet marked
    sectionStudents.forEach(student => {
        const hasRecord = attendanceData.some(record => 
            record.studentId === student.id &&
            record.section === section &&
            record.subject === subject &&
            new Date(record.timestamp).toDateString() === now.toDateString()
        );
        
        if (!hasRecord) {
            // Auto-mark as ABSENT
            attendanceData.push({
                studentId: student.id,
                name: student.name,
                section: section,
                subject: subject,
                timestamp: now.toISOString(),
                status: 'Absent',
                timeIn: '—'
            });
        }
    });
    
    saveToStorage();
    
    // Stop scanner
    if (qrScanner) {
        qrScanner.stop();
        document.getElementById('qr-reader').style.display = 'none';
    }
    
    // Reset session
    currentSession = { section: "", subject: "", sessionId: "", startTime: null };
    document.getElementById('scanCount').textContent = '0';
    
    showMessage('Session ended. Absent records auto-generated.', 'success', 'scannerMessage');
    
    // Reset UI
    setTimeout(() => {
        document.getElementById('scannerSection').value = '';
        document.getElementById('scannerSubject').value = '';
        document.getElementById('activeSection').textContent = '-';
        document.getElementById('activeSubject').textContent = '-';
        document.getElementById('activeSessionId').textContent = '-';
    }, 2000);
}

// ===== QR GENERATOR FUNCTIONS =====
function generateQRCode() {
    const section = document.getElementById('qrSection').value;
    const subject = document.getElementById('qrSubject').value;
    
    // Clear previous QR
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = '';
    
    // Create QR payload
    const qrPayload = {
        section: section,
        subject: subject,
        sessionId: new Date().toISOString().split('T')[0]
    };
    
    // Generate QR
    qrCode = new QRCode(qrContainer, {
        text: JSON.stringify(qrPayload),
        width: 300,
        height: 300,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
    
    showMessage(`QR Code generated for ${section} - ${subject}`, 'success', 'scannerMessage');
}

// ===== BULK UPLOAD FUNCTIONS =====
function handleBulkUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileName = file.name;
    document.getElementById('fileName').textContent = `Selected: ${fileName}`;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            let data = [];
            
            // Check if it's Excel or CSV
            if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                // Parse Excel
                const workbook = XLSX.read(e.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                data = XLSX.utils.sheet_to_json(sheet);
            } else {
                // Parse CSV
                const csvText = e.target.result;
                data = parseCSV(csvText);
            }
            
            // Validate and process data
            processBulkStudents(data);
        } catch (error) {
            showBulkMessage(`Error: ${error.message}`, 'error');
        }
    };
    
    if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        reader.readAsBinaryString(file);
    } else {
        reader.readAsText(file);
    }
}

function parseCSV(text) {
    const rows = text.trim().split('\n');
    const headers = rows[0].split(',').map(h => h.trim().toLowerCase());
    const data = [];
    
    for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue;
        
        const values = rows[i].split(',').map(v => v.trim());
        const row = {};
        
        headers.forEach((header, index) => {
            row[header] = values[index] || '';
        });
        
        data.push(row);
    }
    
    return data;
}

function processBulkStudents(data) {
    let addedCount = 0;
    let errorCount = 0;
    const errors = [];
    
    data.forEach((row, index) => {
        try {
            // Get values from different possible column names
            const name = row.name || row.Name || row.student_name || row['Student Name'] || '';
            const gender = row.gender || row.Gender || '';
            const section = row.section || row.Section || '';
            
            // Validate
            if (!name || !gender || !section) {
                errors.push(`Row ${index + 2}: Missing Name, Gender, or Section`);
                errorCount++;
                return;
            }
            
            // Check if section exists
            if (!students[section]) {
                errors.push(`Row ${index + 2}: Invalid section "${section}"`);
                errorCount++;
                return;
            }
            
            // Normalize gender
            const normalizedGender = gender.toLowerCase() === 'male' ? 'Male' : 
                                    gender.toLowerCase() === 'female' ? 'Female' : '';
            
            if (!normalizedGender) {
                errors.push(`Row ${index + 2}: Gender must be Male or Female`);
                errorCount++;
                return;
            }
            
            // Generate ID
            const id = `${section.match(/\d+/)}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            
            // Add student
            students[section].push({
                id: id,
                name: name.trim(),
                gender: normalizedGender
            });
            
            addedCount++;
        } catch (err) {
            errors.push(`Row ${index + 2}: ${err.message}`);
            errorCount++;
        }
    });
    
    // Save and update
    saveToStorage();
    displayStudentLists();
    
    // Show result message
    let message = `✓ Successfully added ${addedCount} student(s)`;
    if (errorCount > 0) {
        message += `\n⚠ ${errorCount} row(s) had errors`;
    }
    
    showBulkMessage(message, errorCount === 0 ? 'success' : 'warning');
    
    if (errors.length > 0 && errors.length <= 5) {
        console.log('Upload Errors:', errors);
        showBulkMessage(message + '\n\nErrors:\n' + errors.slice(0, 5).join('\n'), 'warning');
    }
    
    // Reset file input
    document.getElementById('csvFileInput').value = '';
    document.getElementById('fileName').textContent = '';
}

function showBulkMessage(text, type) {
    const messageDiv = document.getElementById('uploadMessage');
    messageDiv.innerHTML = `<div class="message-box ${type}">${text}</div>`;
}

// ===== SETTINGS FUNCTIONS =====
function addStudent() {
    const section = document.getElementById('studentSection').value;
    const name = document.getElementById('studentName').value.trim();
    const gender = document.getElementById('studentGender').value;
    
    if (!name || !gender) {
        alert('Please fill in all fields');
        return;
    }
    
    // Generate ID
    const id = `${section.match(/\d+/)}-${Date.now()}`;
    
    // Add student
    if (!students[section]) students[section] = [];
    students[section].push({ id, name, gender });
    
    // Save
    saveToStorage();
    
    // Clear form
    document.getElementById('studentName').value = '';
    document.getElementById('studentGender').value = '';
    
    // Refresh display
    displayStudentLists();
    alert('Student added successfully!');
}

function removeStudent(section, studentId) {
    if (confirm('Remove this student?')) {
        students[section] = students[section].filter(s => s.id !== studentId);
        saveToStorage();
        displayStudentLists();
    }
}

function displayStudentLists() {
    const container = document.getElementById('studentListContainer');
    container.innerHTML = '';
    
    Object.keys(students).forEach(section => {
        const studentList = document.createElement('div');
        studentList.className = 'student-list';
        
        let html = `<h4>${section} (${students[section].length} students)</h4>`;
        students[section].forEach(student => {
            html += `
                <div class="student-item">
                    <span>${student.name} (${student.gender})</span>
                    <button onclick="removeStudent('${section}', '${student.id}')">Remove</button>
                </div>
            `;
        });
        
        studentList.innerHTML = html;
        container.appendChild(studentList);
    });
}

function saveConfig() {
    config.classStartTime = document.getElementById('classStartTime').value;
    config.lateCutoffTime = document.getElementById('lateCutoffTime').value;
    config.finalCutoffTime = document.getElementById('finalCutoffTime').value;
    
    saveToStorage();
    alert('Configuration saved!');
}

// Watch for config changes
document.addEventListener('change', function(e) {
    if (e.target.id.includes('Time')) {
        saveConfig();
    }
});

function clearAllData() {
    if (confirm('Are you sure? This will delete ALL attendance records and cannot be undone.')) {
        attendanceData = [];
        saveToStorage();
        updateDashboard();
        alert('All data cleared!');
    }
}

function resetDailyData() {
    const today = new Date().toISOString().split('T')[0];
    attendanceData = attendanceData.filter(record => 
        !record.timestamp.startsWith(today)
    );
    saveToStorage();
    updateDashboard();
    alert('Daily data reset!');
}

function downloadBackup() {
    const backup = {
        attendanceData: attendanceData,
        students: students,
        config: config,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(backup, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
}

function restoreBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const backup = JSON.parse(e.target.result);
            attendanceData = backup.attendanceData || [];
            Object.assign(students, backup.students || {});
            Object.assign(config, backup.config || {});
            saveToStorage();
            loadFromStorage();
            updateDashboard();
            alert('Backup restored successfully!');
        } catch (error) {
            alert('Invalid backup file!');
        }
    };
    reader.readAsText(file);
}

// ===== EXPORT FUNCTIONS =====
function exportToCSV() {
    const section = document.getElementById('dashboardSection').value;
    const subject = document.getElementById('dashboardSubject').value;
    const date = document.getElementById('dashboardDate').value;
    
    // Filter data
    let filteredData = attendanceData.filter(record => {
        const recordDate = new Date(record.timestamp).toISOString().split('T')[0];
        return record.section === section &&
               (subject === '' || record.subject === subject) &&
               recordDate === date;
    });
    
    // Get all students
    const sectionStudents = students[section] || [];
    let csvData = sectionStudents.map(student => {
        const record = filteredData.find(r => r.studentId === student.id);
        if (record) {
            return [record.name, record.section, record.subject, record.timeIn, record.status];
        } else {
            return [student.name, section, subject, '—', 'Absent'];
        }
    });
    
    // Create CSV
    let csv = 'Name,Section,Subject,Time In,Status\n';
    csvData.forEach(row => {
        csv += row.map(cell => `"${cell}"`).join(',') + '\n';
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance-${section}-${date}.csv`;
    link.click();
}

// ===== UTILITY FUNCTIONS =====
function showMessage(text, type, elementId) {
    const element = document.getElementById(elementId);
    element.textContent = text;
    element.className = `message-box ${type}`;
    element.style.display = 'block';
}