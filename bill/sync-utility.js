/**
 * CSV to JSON Sync Utility
 * Optional utility to generate JSON from CSV data for backup/compatibility
 */

// Convert CSV data to JSON and save as file
async function syncCSVToJSON() {
    try {
        console.log('🔄 Starting CSV to JSON sync...');
        
        // Load CSV data
        const csvData = await window.BillCSVLoader.loadBillDataFromCSV();
        
        // Convert to JSON string
        const jsonString = JSON.stringify(csvData, null, 2);
        
        // Create download link
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bill-sync.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ CSV synced to JSON successfully');
        
    } catch (error) {
        console.error('❌ Error syncing CSV to JSON:', error);
    }
}

// Watch for CSV file changes (development utility)
function watchCSVChanges() {
    let lastModified = null;
    
    setInterval(async () => {
        try {
            const response = await fetch('../assets/csv/bill_categories.csv', { method: 'HEAD' });
            const currentModified = response.headers.get('Last-Modified');
            
            if (lastModified && currentModified !== lastModified) {
                console.log('📄 CSV file changed, triggering refresh...');
                if (window.BillModule && window.BillModule.refreshData) {
                    await window.BillModule.refreshData();
                }
            }
            
            lastModified = currentModified;
        } catch (error) {
            console.warn('⚠️ Failed to check CSV changes:', error);
        }
    }, 5000); // Check every 5 seconds
}

// Export utility functions
window.CSVSyncUtility = {
    syncCSVToJSON,
    watchCSVChanges
};