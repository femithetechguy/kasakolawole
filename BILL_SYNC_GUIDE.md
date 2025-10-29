# Bill Data Synchronization Guide

## Overview
Your Kasa Kolawole app now supports multiple approaches for managing bill data between CSV and JSON formats.

## ✅ **Recommended Approach: CSV-First (Implemented)**

### How It Works:
1. **Primary Data Source**: `assets/bill_categories.csv` 
2. **Dynamic Loading**: `bill/csv-loader.js` converts CSV to JSON in real-time
3. **Automatic Sync**: Changes to CSV are immediately reflected in the app
4. **Fallback Support**: JSON file still works if CSV loading fails

### Benefits:
- ✅ **Single Source of Truth**: Edit CSV, app updates automatically
- ✅ **Excel Compatible**: Easy to edit in Excel/Google Sheets
- ✅ **Real-time Updates**: No manual sync required
- ✅ **Backward Compatible**: JSON still works as fallback

### Usage:
```bash
# To update bills:
1. Edit `/assets/bill_categories.csv` in Excel or text editor
2. Save the file
3. Refresh the app - changes appear immediately
```

---

## Alternative Approaches

### Option 2: Manual Sync Utility
Use the sync utility to generate JSON from CSV when needed:

```javascript
// Generate JSON file from current CSV data
await window.CSVSyncUtility.syncCSVToJSON();
```

### Option 3: File Watcher (Development)
Enable automatic refresh when CSV changes:

```javascript
// Start watching for CSV file changes
window.CSVSyncUtility.watchCSVChanges();
```

---

## File Structure

```
kasakolawole/
├── assets/
│   └── bill_categories.csv          # 📊 Primary data source
├── bill/
│   ├── bill.json                    # 📄 Fallback data
│   ├── bill.js                      # 🔄 Updated to load CSV first
│   ├── csv-loader.js               # 🔧 CSV to JSON converter
│   └── sync-utility.js             # 🛠️ Optional sync tools
└── home/
    └── home.js                      # 📱 Updated to load CSV loader
```

---

## Data Flow

```
CSV File → CSV Loader → JSON Structure → App Display
    ↓           ↓            ↓             ↓
Edit in     Converts     Compatible    Real-time
Excel       to JSON      with app      updates
```

---

## Quick Start

### To Add New Bills:
1. Open `assets/bill_categories.csv`
2. Add new row with bill-## ID format
3. Fill in all required columns
4. Save file
5. Refresh app

### To Modify Existing Bills:
1. Edit relevant row in CSV
2. Save file  
3. App updates automatically

### To Export JSON:
```javascript
// In browser console
await window.CSVSyncUtility.syncCSVToJSON();
```

---

## CSV Column Reference

| Column | Description | Example |
|--------|-------------|---------|
| ID | bill-## format | bill-1 |
| Serial | 3-digit number | 001 |
| Bill Name | Display name | Mortgage Payment |
| Category | Main category | Housing |
| Item | Subcategory | Mortgage/Rent |
| Priority | critical/high/medium/low | critical |
| Monthly Amount | Dollar amount | 2450.00 |
| Payment Method | bank_transfer/credit_card/etc | bank_transfer |
| Auto Pay Enabled | true/false | true |
| Provider | Company name | First National Mortgage |
| Account Number | Account ID | FNM-789012 |
| Due Date | YYYY-MM-DD or text | 2025-11-01 |
| Status | pending/paid/overdue/auto | pending |
| Icon | FontAwesome class | fas fa-home |

---

## Troubleshooting

### CSV Not Loading?
1. Check file path: `/assets/bill_categories.csv`
2. Verify CSV format (comma-separated)
3. Check browser console for errors
4. App will fallback to JSON automatically

### Changes Not Appearing?
1. Clear browser cache (Ctrl+F5)
2. Check CSV file saved properly
3. Verify no syntax errors in CSV

### Need to Revert to JSON Only?
Simply remove or rename `csv-loader.js` - app will use JSON automatically.

---

## Summary

**✅ Current Setup**: CSV file drives the app, JSON is backup
**🎯 Recommendation**: Edit `bill_categories.csv` for all updates
**🔧 Sync**: Automatic - no manual steps needed
**📱 Compatibility**: Works on all devices, Excel-friendly