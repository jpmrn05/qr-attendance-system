# QR Code Attendance System - Offline Web App

📱 A fully offline-capable QR Code Attendance System for teachers managing multiple classroom sections.

## Features

✅ **QR Code Scanning**
- Unique QR codes for each section and subject
- Offline scanning with HTML5 QR Code library
- Mobile-friendly camera integration

✅ **Automatic Attendance Status**
- **Present**: Scanned before 7:10 AM
- **Late**: Scanned between 7:10 AM - 7:30 AM
- **Absent**: Auto-detected when student doesn't scan

✅ **Multi-Section Support**
- GRADE 4 - BONIFACIO
- GRADE 5 - LUNA
- GRADE 6 - RIZAL

✅ **Three Subjects**
- MAPEH
- Math
- (Easily expandable)

✅ **Complete Dashboard**
- Filter by section, subject, and date
- Real-time attendance summary
- Attendance table with status indicators

✅ **Data Management**
- CSV export functionality
- Backup and restore (JSON format)
- LocalStorage persistence (no internet required)

✅ **Settings & Configuration**
- Adjustable time cutoffs
- Student database management
- Daily data reset

## How to Use

### 1. **Setup**
   - Open `index.html` in any modern browser
   - System works fully offline (no internet needed)

### 2. **Add Students**
   - Go to **Settings**
   - Select section and add student names
   - Students are stored locally

### 3. **Generate QR Codes**
   - Go to **QR Generator**
   - Select section and subject
   - Click "Generate QR"
   - Display QR code in class

### 4. **Scan Attendance**
   - Go to **Scanner**
   - Select section and subject
   - Click "Start Scanner"
   - Each student scans the QR code
   - System automatically assigns status (Present/Late/Absent)

### 5. **View Dashboard**
   - Go to **Dashboard**
   - Filter by section, subject, and date
   - View summary cards and attendance table
   - Export to CSV

### 6. **End Session**
   - Click "End Session" to auto-mark absent students
   - Auto-generates ABSENT records for students who didn't scan

## Settings

### Time Configuration
- **Class Start Time**: 07:00 (default)
- **Late Cutoff Time**: 07:10 (default)
- **Final Cutoff Time**: 07:30 (default)

Modify these in **Settings** page.

## Data Storage

- **LocalStorage**: All attendance data, students, and settings
- **No Backend**: Completely offline
- **No Firebase**: Pure client-side JavaScript

## Export Options

- **CSV Export**: Download attendance records as CSV file
- **JSON Backup**: Complete backup of all data
- **Restore**: Upload previously backed-up JSON file

## Mobile Compatibility

✅ Android Chrome
✅ iPhone Safari
✅ Any modern browser with camera access

## File Structure

```
qr-attendance-system/
├── index.html          # Main HTML file
├── styles.css          # Styling
├── app.js              # Application logic
├── README.md           # This file
└── .gitignore          # Git ignore rules
```

## Browser Requirements

- Modern browser (Chrome, Firefox, Safari, Edge)
- Camera access (for QR scanning)
- LocalStorage support
- JavaScript enabled

## Supported QR Code Format

The system generates and scans QR codes with this payload:

```json
{
  "section": "GRADE 6-RIZAL",
  "subject": "Math",
  "sessionId": "2026-06-15"
}
```

## Key Features Explained

### Automatic Duplicate Prevention
- Only the first scan per student per session counts
- Additional scans show "Already recorded" message

### Auto-Absent Generation
- When session ends, all students without scans are marked ABSENT
- No need to manually mark absentees

### Configurable Status Logic
- Easily adjust time cutoffs in Settings
- System recalculates status based on new times

### Dashboard Filters
- Filter by single or multiple sections
- Filter by subject
- Filter by date
- Real-time summary updates

## Troubleshooting

**Camera not working?**
- Ensure browser has camera permission
- Try different browser
- Check URL (must be HTTPS or localhost)

**QR code not scanning?**
- Ensure QR code is clear and well-lit
- Hold camera steady
- Try moving camera closer/farther

**Data not saving?**
- Check if LocalStorage is enabled
- Ensure browser isn't in private/incognito mode
- Check browser storage limits

## License

Open source - Feel free to modify and use in your classroom!

---

**Ready to use!** Simply open `index.html` in a browser and start tracking attendance. 📱✅