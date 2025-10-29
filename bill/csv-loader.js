/**
 * CSV to JSON Data Loader
 * Dynamically loads bill data from CSV file
 */

// CSV to JSON conversion utility
function csvToJson(csv) {
    const lines = csv.trim().split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const obj = {};
        headers.forEach((header, index) => {
            obj[header.trim()] = values[index]?.trim() || '';
        });
        return obj;
    });
}

// Proper CSV line parsing (handles commas in quoted fields)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

// Convert CSV bill data to JSON structure compatible with existing app
function convertBillDataToJSON(csvData) {
    const bills = csvData.filter(row => row.ID && row.ID.startsWith('bill-')).map(row => {
        const monthlyAmount = parseFloat(row['Monthly Amount']) || 0;
        
        // Map CSV Item to chart-friendly subcategory
        const itemToSubcategory = {
            'Mortgage/Rent': 'mortgage',
            'Internet': 'internet',
            'Water': 'water',
            'Gas': 'gas',
            'Electricity': 'electricity',
            'Property Taxes': 'other',
            'Insurance': 'other',
            'HOA/Fees': 'other',
            'Trash': 'other'
        };
        const subcategory = itemToSubcategory[row.Item] || 'other';
        
        // Generate historical data for charts (last 6 months)
        const historicalData = {};
        const months = ["2025-05", "2025-06", "2025-07", "2025-08", "2025-09", "2025-10"];
        months.forEach(month => {
            // Add some variation to historical data (±10% of monthly amount)
            const variation = (Math.random() - 0.5) * 0.2; // -10% to +10%
            const amount = monthlyAmount * (1 + variation);
            historicalData[month] = {
                amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
                status: Math.random() > 0.2 ? 'paid' : 'pending' // 80% paid, 20% pending
            };
        });
        
        return {
            id: row.ID,
            metadata: {
                category: row.Category.toLowerCase(),
                subcategory: subcategory,
                priority: row.Priority,
                monthlyAmount: monthlyAmount,
                paymentMethod: row['Payment Method'],
                autoPayEnabled: row['Auto Pay Enabled'].toLowerCase() === 'true',
                lastPaidDate: row['Last Paid Date'] || null,
                createdDate: row['Created Date'] || null,
                provider: row.Provider,
                accountNumber: row['Account Number'],
                billingCycle: row['Billing Cycle'],
                averageAmount: parseFloat(row['Average Amount']) || 0,
                historicalData: historicalData,
                notifications: {
                    dueDateReminder: parseInt(row['Due Date Reminder']) || 10,
                    overdueAlert: parseInt(row['Overdue Alert']) || 3
                }
            },
            cells: [
                {
                    type: "serial",
                    value: row.Serial
                },
                {
                    type: "text",
                    value: row['Bill Name'],
                    icon: row.Icon || "fas fa-file-invoice"
                },
                {
                    type: "currency",
                    value: parseFloat(row['Monthly Amount']) || 0,
                    currency: "USD"
                },
                {
                    type: "date",
                    value: row['Due Date']
                },
                {
                    type: "status",
                    value: row.Status,
                    label: capitalizeFirst(row.Status),
                    color: getStatusColor(row.Status)
                },
                {
                    type: "link",
                    value: row['Payment Link'] || "#",
                    text: "Pay Now",
                    icon: "fas fa-credit-card",
                    target: "_blank"
                },
                {
                    type: "actions",
                    buttons: [
                        {
                            text: "Edit",
                            icon: "fas fa-edit",
                            action: "edit",
                            type: "outline"
                        }
                    ]
                }
            ]
        };
    });

    // Add charts configuration for CSV loaded data
    const baseConfig = {
        meta: {
            title: "Bills - Kasa Kolawole",
            description: "Comprehensive bill management and tracking system",
            keywords: ["bills", "payments", "financial management", "tracking"],
            author: "Kasa Kolawole",
            version: "1.0.0",
            lastUpdated: new Date().toISOString().split('T')[0]
        },
        content: {
            title: "Bill Management",
            subtitle: "Track and manage your bills efficiently",
            description: "Keep track of all your bills, payment schedules, and financial obligations in one place.",
            sections: [
                {
                    id: "overview",
                    title: "Overview",
                    type: "stats",
                    data: generateOverviewStats(bills)
                },
                {
                    id: "recent-bills",
                    title: "Recent Bills",
                    type: "table",
                    data: {
                        headers: ["S/N", "Bill Name", "Amount", "Due Date", "Status", "Payment Link", "Actions"],
                        rows: bills
                    }
                },
                {
                    id: "charts",
                    title: "Bill Analytics",
                    type: "charts",
                    data: {}
                }
            ]
        }
    };
    
    // Add charts configuration for CSV loaded data
    const config = {
        ...baseConfig,
        charts: {
            pieChart: {
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: []
                    }]
                }
            },
            barChart: {
                data: {
                    labels: ["May", "Jun", "Jul", "Aug", "Sep", "Oct"],
                    datasets: [
                        {
                            label: "Mortgage",
                            data: [],
                            backgroundColor: "#3b82f6"
                        },
                        {
                            label: "Internet",
                            data: [],
                            backgroundColor: "#10b981"
                        },
                        {
                            label: "Water",
                            data: [],
                            backgroundColor: "#f59e0b"
                        },
                        {
                            label: "Gas",
                            data: [],
                            backgroundColor: "#ef4444"
                        }
                    ]
                }
            }
        }
    };
    
    return config;
}

// Helper functions
function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function getStatusColor(status) {
    const colors = {
        'pending': 'warning',
        'overdue': 'danger', 
        'paid': 'success',
        'upcoming': 'info',
        'auto': 'success'
    };
    return colors[status] || 'secondary';
}

function generateOverviewStats(bills) {
    const total = bills.length;
    const pending = bills.filter(b => b.metadata.category === 'pending').length;
    const overdue = bills.filter(b => b.metadata.category === 'overdue').length;
    const paid = bills.filter(b => b.metadata.category === 'paid').length;

    return [
        {
            label: "Total Bills",
            value: total.toString(),
            icon: "fas fa-file-invoice",
            color: "primary"
        },
        {
            label: "Pending",
            value: pending.toString(),
            icon: "fas fa-clock",
            color: "warning"
        },
        {
            label: "Overdue", 
            value: overdue.toString(),
            icon: "fas fa-exclamation-triangle",
            color: "danger"
        },
        {
            label: "Paid This Month",
            value: paid.toString(),
            icon: "fas fa-check-circle",
            color: "success"
        }
    ];
}

// Main loader function
async function loadBillDataFromCSV() {
    try {
        const timestamp = Date.now();
        const response = await fetch(`../assets/csv/bill_categories.csv?t=${timestamp}`, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to load CSV: ${response.status}`);
        }
        
        const csvText = await response.text();
        const csvData = csvToJson(csvText);
        const jsonData = convertBillDataToJSON(csvData);
        
        console.log('✅ Successfully loaded bill data from CSV');
        return jsonData;
        
    } catch (error) {
        console.error('❌ Error loading CSV data:', error);
        throw error;
    }
}

// Export for use in bill.js
window.BillCSVLoader = {
    loadBillDataFromCSV,
    csvToJson,
    convertBillDataToJSON
};