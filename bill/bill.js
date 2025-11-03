/**
 * Bill Tab JavaScript Module
 * Handles dynamic content loading and bill-specific interactions
 */

console.log('💵 Starting Bill Module...');

// Bill module state
window.BillModule = {
    config: null,
    initialized: false,
    configLastModified: null,
    autoRefreshInterval: null,
    chartInstances: {
        pieChart: null,
        barChart: null
    },
    
    // Public init function for dynamic loading
    init: async function() {
        console.log('🚀 Initializing Bill Module...');
        
        // Always force fresh initialization to avoid cached data
        try {
            // Clear any existing config to force fresh load
            this.config = null;
            this.initialized = false;
            
            await initializeBillModule();
            console.log('✅ Bill module initialized successfully');
            
            // Start auto-refresh checking
            this.startAutoRefresh();
        } catch (error) {
            console.error('❌ Error initializing bill module:', error);
            showBillError(error);
        }
    },
    
    // Start auto-refresh mechanism
    startAutoRefresh: function() {
        // Stop any existing interval first
        this.stopAutoRefresh();
        
        // Check for updates every 30 seconds
        this.autoRefreshInterval = setInterval(async () => {
            await this.checkForUpdates();
        }, 30000);
        
        // Store reference globally for cleanup
        window.billAutoRefreshInterval = this.autoRefreshInterval;
        
        console.log('🔄 Auto-refresh started (checking every 30 seconds)');
    },
    
    // Stop auto-refresh mechanism
    stopAutoRefresh: function() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
            console.log('⏹️ Auto-refresh stopped');
        }
        
        // Also clear global reference
        if (window.billAutoRefreshInterval) {
            clearInterval(window.billAutoRefreshInterval);
            window.billAutoRefreshInterval = null;
        }
    },
    
    // Check for configuration updates
    checkForUpdates: async function() {
        try {
            const response = await fetch('../bill/bill.json', {
                method: 'HEAD', // Just check headers, don't download content
                cache: 'no-cache'
            });
            
            if (response.ok) {
                const lastModified = response.headers.get('Last-Modified');
                
                if (lastModified && lastModified !== this.configLastModified) {
                    console.log('🔄 Bill configuration updated, refreshing...');
                    await this.refreshData();
                }
            }
        } catch (error) {
            console.warn('⚠️ Failed to check for updates:', error);
        }
    },
    
    // Refresh data and re-render
    refreshData: async function() {
        try {
            console.log('🔄 Starting complete bill data refresh...');
            
            // Load fresh configuration
            await loadBillConfig();
            
            // Force complete re-render of all sections
            renderBillContent();
            
            console.log('✅ Bill data refreshed successfully');
            
            // Show notification to user
            this.showRefreshNotification();
        } catch (error) {
            console.error('❌ Failed to refresh bill data:', error);
            this.showRefreshNotification('Error refreshing data. Please try again.', 'error');
        }
    },
    
    // Public method to manually trigger complete update
    forceUpdate: async function() {
        console.log('🔄 Force updating bill module...');
        await this.refreshData();
    },
    
    // Developer method to test complete re-rendering
    testUpdate: function() {
        console.log('🧪 Testing complete re-render...');
        console.log('Current chart instances:', this.chartInstances);
        this.forceUpdate();
    },
    
    // Show refresh notification
    showRefreshNotification: function(message = 'Bill data updated automatically', type = 'success') {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.className = `refresh-notification notification-${type}`;
        
        const icon = type === 'error' ? 'fas fa-exclamation-triangle' : 'fas fa-sync-alt';
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="${icon}"></i>
                <span>${message}</span>
            </div>
        `;
        
        // Add to page
        const billContent = document.querySelector('#bill-content');
        if (billContent) {
            billContent.appendChild(notification);
            
            // Animate in
            setTimeout(() => notification.classList.add('show'), 100);
            
            // Remove after 3 seconds
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📄 Bill DOM Ready');
    
    try {
        await initializeBillModule();
        console.log('✅ Bill module initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing bill module:', error);
        showBillError(error);
    }
});

/**
 * Initialize the bill module
 */
async function initializeBillModule() {
    // Load configuration
    await loadBillConfig();
    
    // Render content
    renderBillContent();
    
    // Setup interactions
    setupBillInteractions();
    
    // Mark as initialized
    window.BillModule.initialized = true;
}

async function loadBillConfig() {
    // Check if we have cached data from recent load
    const cachedConfig = localStorage.getItem('billConfig');
    const cacheTimestamp = localStorage.getItem('billConfigTimestamp');
    const currentTime = Date.now();
    
    // Use cache if it's less than 30 seconds old (to handle tab switching)
    if (cachedConfig && cacheTimestamp && (currentTime - parseInt(cacheTimestamp)) < 30000) {
        console.log('📦 Using cached bill config for quick loading');
        const config = JSON.parse(cachedConfig);
        window.BillModule.config = config;
        return config;
    }
    
    try {
        // Try to load from CSV first
        if (window.BillCSVLoader && typeof window.BillCSVLoader.loadBillDataFromCSV === 'function') {
            console.log('📊 Loading bill data from CSV...');
            const config = await window.BillCSVLoader.loadBillDataFromCSV();
            
            // Calculate dynamic overview from bill objects
            updateOverviewFromBillData(config);
            updateChartsFromBillData(config);
            
            // Cache the configuration for quick tab switching
            localStorage.setItem('billConfig', JSON.stringify(config));
            localStorage.setItem('billConfigTimestamp', Date.now().toString());
            
            window.BillModule.config = config;
            console.log('✅ Bill config loaded from CSV:', config);
            return config;
        } else {
            console.warn('⚠️ CSV Loader not available, loading CSV manually...');
            
            // Manually load CSV if loader not available
            try {
                const csvResponse = await fetch(`../assets/csv/bill_categories.csv?t=${Date.now()}`, {
                    cache: 'no-cache',
                    headers: {
                        'Cache-Control': 'no-cache, no-store, must-revalidate',
                        'Pragma': 'no-cache',
                        'Expires': '0'
                    }
                });
                
                if (csvResponse.ok) {
                    const csvText = await csvResponse.text();
                    console.log('📊 Manually parsing CSV data...');
                    
                    // Simple CSV to bill data conversion
                    const lines = csvText.trim().split('\n');
                    const headers = lines[0].split(',');
                    const billRows = lines.slice(1).map(line => {
                        const values = line.split(',');
                        const row = {};
                        headers.forEach((header, index) => {
                            row[header.trim()] = values[index]?.trim() || '';
                        });
                        return row;
                    }).filter(row => row.ID && row.ID.startsWith('bill-'));
                    
                    // Convert to bill structure
                    const bills = billRows.map(row => {
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
                                provider: row.Provider,
                                accountNumber: row['Account Number'],
                                historicalData: historicalData,
                                details: row.Details || "No details available"
                            },
                            cells: [
                                { type: "serial", value: row.Serial },
                                { type: "text", value: row['Bill Name'], icon: row.Icon || "fas fa-file-invoice" },
                                { type: "currency", value: parseFloat(row['Monthly Amount']) || 0, currency: "USD" },
                                { type: "date", value: row['Due Date'] },
                                { type: "status", value: row.Status, label: row.Status.charAt(0).toUpperCase() + row.Status.slice(1), color: getStatusColor(row.Status) },
                                { type: "link", value: row['Payment Link'] || "#", text: "Pay Now", icon: "fas fa-credit-card", target: "_blank" },
                                { type: "actions", buttons: [{ text: "Details", icon: "fas fa-info-circle", action: "details", type: "primary" }] }
                            ]
                        };
                    });
                    
                    console.log('✅ Loaded bills with details:', bills.slice(0, 2)); // Log first 2 bills
                    
                    const config = {
                        meta: {
                            title: "Bills - Kasa Kolawole",
                            description: "Comprehensive bill management and tracking system",
                            dataSource: "CSV manually loaded"
                        },
                        content: {
                            title: "Bill Management",
                            subtitle: "Track and manage your bills efficiently",
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
                                        headers: ["S/N", "Bill Name", "Amount", "Due Date", "Status", "Payment Link", "Details"],
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
                    
                    // Add charts configuration
                    config.charts = {
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
                    };
                    
                    updateOverviewFromBillData(config);
                    updateChartsFromBillData(config);
                    
                    // Cache the configuration for quick tab switching
                    localStorage.setItem('billConfig', JSON.stringify(config));
                    localStorage.setItem('billConfigTimestamp', Date.now().toString());
                    
                    window.BillModule.config = config;
                    console.log('✅ Bill config loaded manually from CSV:', config);
                    return config;
                }
            } catch (csvError) {
                console.error('❌ Manual CSV loading failed:', csvError);
            }
        }
        
        // Fallback to JSON if CSV loading fails
        console.log('📄 Falling back to JSON data...');
        const timestamp = new Date().getTime();
        const response = await fetch(`../bill/bill.json?t=${timestamp}`, {
            cache: 'no-cache',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const config = await response.json();
        
        // Add fallback message if no bill data
        if (!config.content.sections.find(s => s.id === 'recent-bills')?.data?.rows?.length) {
            config.content.sections.find(s => s.id === 'recent-bills').data.rows = [{
                id: "no-data",
                cells: [
                    { type: "text", value: "No bill data available - CSV file may not be accessible" },
                    { type: "text", value: "Please check bill_categories.csv file" },
                    { type: "text", value: "" },
                    { type: "text", value: "" },
                    { type: "text", value: "" },
                    { type: "text", value: "" },
                    { type: "text", value: "" }
                ]
            }];
        }
        
        // Calculate dynamic overview from bill objects
        updateOverviewFromBillData(config);
        
        // Cache the configuration for quick tab switching (even if it's empty)
        localStorage.setItem('billConfig', JSON.stringify(config));
        localStorage.setItem('billConfigTimestamp', Date.now().toString());
        
        window.BillModule.config = config;
        
        // Track last modified time for auto-refresh
        const lastModified = response.headers.get('Last-Modified');
        if (lastModified) {
            window.BillModule.configLastModified = lastModified;
        }
        
        console.log('✅ Bill config loaded from JSON:', config);
        return config;
        
    } catch (error) {
        console.error('❌ Failed to load bill config:', error);
        throw error;
    }
}

/**
 * Calculate and update overview statistics from bill objects
 */
function updateOverviewFromBillData(config) {
    const billsSection = config.content.sections.find(section => section.id === 'recent-bills');
    const overviewSection = config.content.sections.find(section => section.id === 'overview');
    
    if (!billsSection || !overviewSection || !billsSection.data.rows) {
        console.warn('Cannot calculate overview: bill data not found');
        return;
    }
    
    const bills = billsSection.data.rows;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Initialize counters
    let totalBills = bills.length;
    let pendingCount = 0;
    let overdueCount = 0;
    let paidThisMonthCount = 0;
    
    // Count bills by status and payment history
    bills.forEach(bill => {
        const statusCell = bill.cells.find(cell => cell.type === 'status');
        const dateCell = bill.cells.find(cell => cell.type === 'date');
        
        if (statusCell) {
            switch (statusCell.value) {
                case 'pending':
                case 'upcoming':
                    pendingCount++;
                    break;
                case 'overdue':
                    overdueCount++;
                    break;
                case 'paid':
                    // Check if paid this month
                    if (bill.metadata && bill.metadata.lastPaidDate) {
                        const lastPaidDate = new Date(bill.metadata.lastPaidDate);
                        if (lastPaidDate.getMonth() === currentMonth && lastPaidDate.getFullYear() === currentYear) {
                            paidThisMonthCount++;
                        }
                    }
                    break;
            }
        }
        
        // Check for overdue bills (due date has passed)
        if (statusCell?.value !== 'paid' && dateCell) {
            const dueDate = new Date(dateCell.value);
            if (dueDate < currentDate) {
                overdueCount++;
                // If it was counted as pending, remove it from pending
                if (statusCell?.value === 'pending') {
                    pendingCount--;
                }
            }
        }
    });
    
    // Calculate total monthly amount
    const totalMonthlyAmount = bills.reduce((sum, bill) => {
        if (bill.metadata && bill.metadata.monthlyAmount) {
            return sum + bill.metadata.monthlyAmount;
        }
        return sum;
    }, 0);
    
    // Update overview data
    overviewSection.data = [
        {
            "label": "Total Bills",
            "value": totalBills.toString(),
            "icon": "fas fa-file-invoice",
            "color": "primary",
            "metadata": {
                "monthlyAmount": `$${totalMonthlyAmount.toFixed(2)}`,
                "categories": [...new Set(bills.map(bill => bill.metadata?.subcategory).filter(Boolean))]
            }
        },
        {
            "label": "Pending",
            "value": pendingCount.toString(),
            "icon": "fas fa-clock",
            "color": "warning",
            "metadata": {
                "upcoming": bills.filter(bill => bill.cells.find(cell => cell.type === 'status')?.value === 'upcoming').length
            }
        },
        {
            "label": "Overdue",
            "value": overdueCount.toString(),
            "icon": "fas fa-exclamation-triangle",
            "color": "danger",
            "metadata": {
                "urgentCount": bills.filter(bill => bill.cells.find(cell => cell.type === 'link')?.urgent).length
            }
        },
        {
            "label": "Paid This Month",
            "value": paidThisMonthCount.toString(),
            "icon": "fas fa-check-circle",
            "color": "success",
            "metadata": {
                "autoPayEnabled": bills.filter(bill => bill.metadata?.autoPayEnabled).length
            }
        }
    ];
    
    console.log('📊 Overview updated from bill data:', {
        totalBills,
        pendingCount,
        overdueCount,
        paidThisMonthCount,
        totalMonthlyAmount: `$${totalMonthlyAmount.toFixed(2)}`
    });
    
    // Update chart data from bill objects
    updateChartsFromBillData(config);
}

/**
 * Calculate and update chart data from bill objects
 */
function updateChartsFromBillData(config) {
    const billsSection = config.content.sections.find(section => section.id === 'recent-bills');
    
    if (!billsSection || !billsSection.data.rows || !config.charts) {
        console.warn('Cannot calculate charts: bill data or charts config not found');
        return;
    }
    
    const bills = billsSection.data.rows;
    
    // Get unique categories from the bill data
    const allCategories = [...new Set(
        bills
            .map(bill => bill.metadata?.category?.toLowerCase())
            .filter(category => category && category.trim())
    )].sort();
    
    console.log('📊 Dynamic categories for charts:', allCategories);
    
    // Calculate pie chart data (bills by category)
    const categoryData = {};
    
    // Generate colors for categories dynamically
    const categoryColors = {
        'housing': '#3b82f6',
        'utilities': '#6366f1',
        'communication': '#10b981', 
        'transportation': '#f59e0b',
        'healthcare': '#ef4444',
        'subscriptions': '#8b5cf6',
        'debt': '#ec4899',
        'food': '#f97316',
        'financial': '#06b6d4',
        'personal': '#84cc16'
    };
    
    bills.forEach(bill => {
        const category = bill.metadata?.category?.toLowerCase() || 'other';
        const amount = bill.metadata?.monthlyAmount || 0;
        
        console.log('Chart data - Bill:', bill.id, 'Category:', category, 'Amount:', amount);
        
        if (!categoryData[category]) {
            categoryData[category] = 0;
        }
        categoryData[category] += amount;
    });
    
    // Update pie chart
    const pieLabels = Object.keys(categoryData).map(key => 
        key.charAt(0).toUpperCase() + key.slice(1)
    );
    const pieData = Object.values(categoryData);
    const pieColors = Object.keys(categoryData).map(key => categoryColors[key] || '#8b5cf6');
    
    config.charts.pieChart.data.labels = pieLabels;
    config.charts.pieChart.data.datasets[0].data = pieData;
    config.charts.pieChart.data.datasets[0].backgroundColor = pieColors;
    
    console.log('📊 Pie chart data updated:', { pieLabels, pieData, pieColors });
    
    // Calculate bar chart data from historical data
    const months = ["2025-05", "2025-06", "2025-07", "2025-08", "2025-09", "2025-10"];
    
    // Calculate monthly totals from historical data
    const monthlyTotals = months.map(month => {
        return bills.reduce((sum, bill) => {
            const historicalAmount = bill.metadata?.historicalData?.[month]?.amount || 0;
            return sum + historicalAmount;
        }, 0);
    });
    
    // Calculate individual category totals dynamically for top categories
    const topCategories = allCategories.slice(0, 4); // Get top 4 categories
    const categoryTotalsData = {};
    
    topCategories.forEach(category => {
        categoryTotalsData[category] = months.map(month => {
            return bills
                .filter(bill => bill.metadata?.category?.toLowerCase() === category)
                .reduce((sum, bill) => {
                    const historicalAmount = bill.metadata?.historicalData?.[month]?.amount || 0;
                    return sum + historicalAmount;
                }, 0);
        });
    });
    
    // Update bar chart datasets dynamically
    const barChartDatasets = config.charts.barChart.data.datasets;
    
    // Update existing datasets or create new ones
    topCategories.forEach((category, index) => {
        if (barChartDatasets[index]) {
            barChartDatasets[index].label = category.charAt(0).toUpperCase() + category.slice(1);
            barChartDatasets[index].data = categoryTotalsData[category];
            barChartDatasets[index].backgroundColor = categoryColors[category] || '#8b5cf6';
            barChartDatasets[index].borderColor = categoryColors[category] || '#8b5cf6';
        }
    });
    
    console.log('📊 Bar chart data updated with dynamic categories:', categoryTotalsData);
    
    console.log('📈 Charts updated from bill data:', {
        pieChart: {
            labels: pieLabels,
            data: pieData,
            categories: allCategories
        },
        barChart: {
            topCategories,
            categoryTotalsData
        }
    });
}

/**
 * Render bill content
 */
function renderBillContent() {
    const config = window.BillModule.config;
    const content = config.content;
    
    // Update page title
    if (config.meta?.title) {
        document.title = config.meta.title;
    }
    
    // Update tab header
    updateElement('.tab-title', content.title);
    updateElement('.tab-subtitle', content.subtitle);
    updateElement('.tab-description', content.description);
    
    // Update theme icon
    if (config.theme?.iconClass) {
        const iconElement = document.querySelector('.tab-icon i');
        if (iconElement) {
            iconElement.className = config.theme.iconClass;
        }
    }
    
    // Render sections
    const sectionsContainer = document.querySelector('#tabSections');
    if (sectionsContainer && content.sections) {
        sectionsContainer.innerHTML = renderBillSections(content.sections);
    }
    
    // Initialize search and filter functionality with improved retry
    let initRetryCount = 0;
    const maxInitRetries = 8;
    
    function tryInitializeSearch() {
        console.log(`🔄 Search initialization attempt ${initRetryCount + 1}/${maxInitRetries}`);
        
        // Check if the search container and its content exist
        const searchContainer = document.querySelector('.search-filter-controls');
        const searchInput = document.getElementById('billSearch');
        
        if (searchContainer && searchInput) {
            console.log('✅ Search elements found, initializing...');
            initializeSearchAndFilters();
        } else if (initRetryCount < maxInitRetries) {
            console.log(`❌ Search elements not ready, retrying in ${500 * (initRetryCount + 1)}ms...`);
            initRetryCount++;
            setTimeout(tryInitializeSearch, 500 * initRetryCount); // Exponential backoff
        } else {
            console.error('❌ Failed to initialize search after maximum retries');
        }
    }
    
    // Start initialization after a short delay
    setTimeout(tryInitializeSearch, 300);
    
    // Show and render charts
    renderBillCharts();
}

/**
 * Render bill sections
 */
function renderBillSections(sections) {
    return sections.map(section => {
        switch (section.type) {
            case 'stats':
                return renderStatsSection(section);
            case 'table':
                return renderTableSection(section);
            case 'actions':
                return renderActionsSection(section);
            default:
                return `<div class="section-unknown">Unknown section type: ${section.type}</div>`;
        }
    }).join('');
}

/**
 * Render statistics section
 */
function renderStatsSection(section) {
    const stats = section.data;
    return `
        <div class="section stats-section" id="${section.id}">
            <h3 class="section-title">${section.title}</h3>
            <div class="stats-grid">
                ${stats.map(stat => `
                    <div class="stat-card stat-${stat.color}">
                        <div class="stat-icon">
                            <i class="${stat.icon}"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-label">${stat.label}</div>
                            <div class="stat-value">${stat.value}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

/**
 * Render table section with proper cell validation
 */
function renderTableSection(section) {
    const { headers, rows } = section.data;
    const validatedRows = validateAndFixCellStructure(rows);
    
    // Extract unique categories from the bill rows for dynamic filter options
    const categories = [...new Set(
        validatedRows
            .map(row => row.metadata?.category)
            .filter(category => category && category.trim())
            .map(category => category.toLowerCase())
    )].sort();
    
    console.log('Extracted categories for filter:', categories); // Debug log
    
    // Fallback categories if none found in data
    if (categories.length === 0) {
        categories.push('housing', 'utilities', 'communication', 'debt', 'financial');
        console.log('Using fallback categories:', categories);
    }
    
    // Generate category options
    const categoryOptions = categories.map(category => 
        `<option value="${category}">${category.charAt(0).toUpperCase() + category.slice(1)}</option>`
    ).join('');
    
    // Always render the search and filter controls, even if no data
    const searchAndFilterControls = `
        <div class="table-controls">
            <div class="search-filter-controls">
                <div class="search-box">
                    <i class="fas fa-search search-icon"></i>
                    <input type="text" 
                           id="billSearch" 
                           placeholder="Search bills by name, provider..." 
                           class="search-input">
                    <button class="clear-search" id="clearSearch" style="display: none;">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="filter-controls">
                    <select id="statusFilter" class="filter-select">
                        <option value="">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Overdue</option>
                        <option value="upcoming">Upcoming</option>
                    </select>
                    <select id="categoryFilter" class="filter-select">
                        <option value="">All Categories</option>
                        ${categoryOptions}
                    </select>
                    <select id="amountFilter" class="filter-select">
                        <option value="">All Amounts</option>
                        <option value="0-50">$0 - $50</option>
                        <option value="50-100">$50 - $100</option>
                        <option value="100-500">$100 - $500</option>
                        <option value="500-1000">$500 - $1000</option>
                        <option value="1000+">$1000+</option>
                    </select>
                    <button class="btn btn-outline btn-sm" id="clearFilters">
                        <i class="fas fa-filter-circle-xmark"></i> Clear Filters
                    </button>
                </div>
            </div>
            <div class="view-and-actions">
                <div class="view-toggle">
                    <button class="view-btn active" data-view="table">
                        <i class="fas fa-table"></i> Table
                    </button>
                    <button class="view-btn" data-view="cards">
                        <i class="fas fa-th-large"></i> Cards
                    </button>
                </div>
                <div class="table-actions">
                    <span class="results-count" id="resultsCount"></span>
                    <button class="btn btn-primary btn-sm" onclick="window.BillModule.refreshData()" title="Refresh bill data">
                        <i class="fas fa-sync-alt"></i> Refresh
                    </button>
                    <button class="btn btn-warning btn-sm" data-action="export-csv" title="Export current bill data as CSV">
                        <i class="fas fa-download"></i> Export CSV
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Check if we have valid bill data
    if (!validatedRows.length || validatedRows[0].id === 'no-data') {
        return `
            <div class="section table-section" id="${section.id}">
                <h3 class="section-title">${section.title}</h3>
                <div class="table-container">
                    ${searchAndFilterControls}
                    <div class="empty-state">
                        <i class="fas fa-file-invoice-dollar"></i>
                        <h4>No Bill Data Available</h4>
                        <p>Please check if bill_categories.csv file is accessible</p>
                    </div>
                </div>
            </div>
        `;
    }

    return `
        <div class="section table-section" id="${section.id}">
            <h3 class="section-title">${section.title}</h3>
            <div class="table-container">
                ${searchAndFilterControls}
                
                <div class="table-view active">
                    <table class="bill-table">
                        <thead>
                            <tr>
                                ${headers.map(header => `<th>${header}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${validatedRows.map(row => `
                                <tr data-id="${row.id}">
                                    ${row.cells.map(cell => renderTableCell(cell)).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="cards-view">
                    <div class="bill-cards-grid">
                        ${validatedRows.map(row => renderBillCard(row)).join('')}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Render stats section
 */
function renderStatsSection(section) {
    const statsHTML = section.data.map(stat => 
        `<div class="stat-card" data-color="${stat.color}">
            <div class="stat-icon">
                <i class="${stat.icon}"></i>
            </div>
            <div class="stat-content">
                <h3 class="stat-value">${stat.value}</h3>
                <p class="stat-label">${stat.label}</p>
            </div>
        </div>`
    ).join('');
    
    return `
        <section class="section stats-section" id="${section.id}">
            <h2 class="section-title">${section.title}</h2>
            <div class="stats-grid">
                ${statsHTML}
            </div>
        </section>
    `;
}

/**
 * Render table cell based on type
 */
function renderTableCell(cell) {
    // Debug logging for link cells
    if (cell.type === 'link') {
        console.log('Rendering link cell:', cell);
    }
    
    switch (cell.type) {
        case 'serial':
            return `<td class="cell-serial">
                <span class="serial-number">${cell.value}</span>
            </td>`;
            
        case 'text':
            return `<td class="cell-text">
                ${cell.icon ? `<i class="${cell.icon}"></i>` : ''}
                <span>${cell.value}</span>
            </td>`;
        
        case 'currency':
            return `<td class="cell-currency">
                $${cell.value.toFixed(2)}
            </td>`;
        
        case 'date':
            const date = new Date(cell.value);
            return `<td class="cell-date">
                ${date.toLocaleDateString()}
            </td>`;
        
        case 'status':
            return `<td class="cell-status">
                <span class="status-badge status-${cell.color}">
                    ${cell.label}
                </span>
            </td>`;
            
        case 'link':
            const urgentClass = cell.urgent ? ' urgent-payment' : '';
            const linkText = cell.text || 'Pay Now';
            const linkIcon = cell.icon || '';
            const linkTarget = cell.target || '_self';
            const linkHref = cell.value || '#';
            
            const linkHtml = `<td class="cell-link">
                <a href="${linkHref}" 
                   target="${linkTarget}" 
                   class="payment-link${urgentClass}"
                   title="${linkText}">
                    ${linkIcon ? `<i class="${linkIcon}"></i>` : ''}
                    <span>${linkText}</span>
                </a>
            </td>`;
            console.log('Generated link HTML:', linkHtml);
            return linkHtml;
        
        case 'actions':
            const buttonsHTML = cell.buttons.map(btn => 
                `<button class="btn btn-${btn.type} btn-sm" 
                        data-action="${btn.action}" 
                        title="${btn.text}">
                    <i class="${btn.icon}"></i>
                    <span class="btn-text">${btn.text}</span>
                </button>`
            ).join('');
            return `<td class="cell-actions">
                <div class="action-buttons">
                    ${buttonsHTML}
                </div>
            </td>`;
        
        default:
            console.warn('Unknown cell type:', cell.type, cell);
            return `<td class="cell-unknown">${cell.value || ''}</td>`;
    }
}

/**
 * Render bill card for mobile view
 */
function renderBillCard(row) {
    const cells = row.cells;
    
    // Extract data from cells by type
    const serialCell = cells.find(cell => cell.type === 'serial');
    const textCell = cells.find(cell => cell.type === 'text');
    const currencyCell = cells.find(cell => cell.type === 'currency');
    const dateCell = cells.find(cell => cell.type === 'date');
    const statusCell = cells.find(cell => cell.type === 'status');
    const linkCell = cells.find(cell => cell.type === 'link');
    const actionsCell = cells.find(cell => cell.type === 'actions');
    
    // Debug logging for link cell
    if (linkCell) {
        console.log('Rendering card link cell:', linkCell);
    }
    
    const date = new Date(dateCell.value);
    const urgentClass = linkCell?.urgent ? ' urgent-card' : '';
    
    return `
        <div class="bill-card${urgentClass}" data-id="${row.id}">
            <div class="bill-card-content">
                <div class="bill-card-left">
                    <div class="bill-card-header">
                        <div class="bill-serial">#${serialCell.value}</div>
                        <div class="bill-name">
                            ${textCell.icon ? `<i class="${textCell.icon}"></i>` : ''}
                            <span>${textCell.value}</span>
                        </div>
                        <div class="bill-amount">$${currencyCell.value.toFixed(2)}</div>
                    </div>
                    
                    <div class="bill-card-details">
                        <div class="bill-detail">
                            <span class="detail-label">Due Date</span>
                            <span class="detail-value">${date.toLocaleDateString()}</span>
                        </div>
                        <div class="bill-detail">
                            <span class="detail-label">Status</span>
                            <span class="status-badge status-${statusCell.color}">${statusCell.label}</span>
                        </div>
                    </div>
                </div>
                
                <div class="bill-card-right">
                    ${linkCell ? `
                        <div class="bill-payment-compact">
                            <a href="${linkCell.value || '#'}" 
                               target="${linkCell.target || '_self'}" 
                               class="payment-link-compact${linkCell.urgent ? ' urgent-payment' : ''}">
                                ${linkCell.icon ? `<i class="${linkCell.icon}"></i>` : ''}
                                <span>${linkCell.text || 'Pay Now'}</span>
                            </a>
                        </div>
                    ` : ''}
                    ${actionsCell.buttons.length > 0 ? `
                        <div class="bill-actions-compact">
                            ${actionsCell.buttons.map(btn => 
                                `<button class="btn btn-${btn.type} btn-compact" 
                                        data-action="${btn.action}" 
                                        title="${btn.text}">
                                    <i class="${btn.icon}"></i>
                                </button>`
                            ).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

/**
 * Render actions section
 */
function renderActionsSection(section) {
    const actionsHTML = section.data.map(action => 
        `<div class="action-card">
            <button class="action-button btn btn-${action.type}" 
                    data-action="${action.action}">
                <div class="action-icon">
                    <i class="${action.icon}"></i>
                </div>
                <div class="action-content">
                    <h3 class="action-title">${action.text}</h3>
                    <p class="action-description">${action.description}</p>
                </div>
            </button>
        </div>`
    ).join('');
    
    return `
        <section class="section actions-section" id="${section.id}">
            <h2 class="section-title">${section.title}</h2>
            <div class="actions-grid">
                ${actionsHTML}
            </div>
        </section>
    `;
}

/**
 * Setup bill interactions
 */
function setupBillInteractions() {
    // Handle action buttons
    document.addEventListener('click', function(e) {
        const actionButton = e.target.closest('[data-action]');
        if (actionButton) {
            e.preventDefault();
            const action = actionButton.dataset.action;
            handleBillAction(action, actionButton);
        }
    });
}

/**
 * Handle bill-specific actions
 */
function handleBillAction(action, element) {
    console.log(`💵 Bill action triggered: ${action}`);
    
    switch (action) {
        case 'pay':
            showBillNotification('Payment processing...', 'info');
            setTimeout(() => {
                showBillNotification('Payment functionality coming soon!', 'warning');
            }, 1000);
            break;
        
        case 'details':
            showBillDetails(element);
            break;
        
        case 'edit':
            showBillNotification('Edit bill functionality coming soon!', 'info');
            break;
        
        case 'schedule':
            showBillNotification('Schedule payment functionality coming soon!', 'info');
            break;
        
        case 'add-bill':
            showBillNotification('Add new bill functionality coming soon!', 'info');
            break;
        
        case 'view-all':
            showBillNotification('View all bills functionality coming soon!', 'info');
            break;
        
        case 'settings':
            showBillNotification('Payment settings functionality coming soon!', 'info');
            break;
        
        case 'export':
            showBillNotification('Export data functionality coming soon!', 'info');
            break;
        
        case 'export-csv':
            handleCSVExport();
            break;
        
        default:
            console.log(`Unknown bill action: ${action}`);
    }
}

/**
 * Show bill details in a popup tooltip
 */
function showBillDetails(element) {
    // Find the row containing this button
    const row = element.closest('tr') || element.closest('.bill-card');
    if (!row) {
        console.error('Could not find bill row');
        return;
    }
    
    // Get bill ID from row
    const billId = row.dataset.id;
    if (!billId) {
        console.error('Could not find bill ID');
        return;
    }
    
    // Find the bill in config
    const bill = window.BillModule.config?.content?.sections
        ?.find(s => s.type === 'table')
        ?.data?.rows?.find(r => r.id === billId);
    
    if (!bill || !bill.metadata?.details) {
        showBillNotification('No details available for this bill', 'warning');
        return;
    }
    
    // Create popup
    const popup = document.createElement('div');
    popup.className = 'bill-details-popup';
    popup.innerHTML = `
        <div class="bill-details-content">
            <div class="bill-details-header">
                <h3><i class="fas fa-info-circle"></i> Bill Details</h3>
                <button class="close-details" onclick="this.closest('.bill-details-popup').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="bill-details-body">
                <div class="bill-name-section">
                    <strong>${bill.cells[1].value}</strong>
                </div>
                <div class="bill-details-text">
                    ${bill.metadata.details}
                </div>
            </div>
        </div>
        <div class="bill-details-overlay" onclick="this.parentElement.remove()"></div>
    `;
    
    document.body.appendChild(popup);
    
    // Animate in
    setTimeout(() => popup.classList.add('show'), 10);
}

/**
 * Show bill notification
 */
function showBillNotification(message, type = 'info') {
    if (window.KasaKolawole?.notify) {
        window.KasaKolawole.notify[type](message);
    } else {
        console.log(`Bill Notification [${type}]: ${message}`);
    }
}

/**
 * Handle CSV export - exports current bill data to CSV file
 */
function handleCSVExport() {
    console.log('� Starting CSV export...');
    
    try {
        // Get current bill data from BillModule
        const billConfig = window.BillModule?.config;
        
        if (!billConfig) {
            console.error('❌ billConfig is null or undefined');
            showBillNotification('Bill data not loaded yet. Please wait and try again.', 'warning');
            return;
        }
        
        // The sections are in config.content.sections
        const sections = billConfig.content?.sections;
        
        if (!sections) {
            console.error('❌ billConfig.content.sections is missing');
            showBillNotification('Bill data structure is invalid.', 'error');
            return;
        }
        
        const csvRows = [];
        
        // CSV Header
        csvRows.push([
            'Serial',
            'ID',
            'Bill Name',
            'Category',
            'Monthly Amount',
            'Due Date',
            'Status',
            'Payment Link',
            'Icon',
            'Priority',
            'Payment Method',
            'Auto Pay Enabled',
            'Provider',
            'Account Number'
        ].join(','));
        
        let exportCount = 0;
        
        // Loop through all sections and bills
        sections.forEach(section => {
            if (section.data && section.data.rows) {
                section.data.rows.forEach(bill => {
                    // Find cells
                    const serialCell = bill.cells?.find(cell => cell.type === 'serial');
                    const nameCell = bill.cells?.find(cell => cell.type === 'text');
                    const amountCell = bill.cells?.find(cell => cell.type === 'currency');
                    const dateCell = bill.cells?.find(cell => cell.type === 'date');
                    const statusCell = bill.cells?.find(cell => cell.type === 'status');
                    const linkCell = bill.cells?.find(cell => cell.type === 'link');
                    
                    // Build CSV row with current data (as-is, no modifications)
                    const csvRow = [
                        serialCell?.value || '',
                        bill.id || '',
                        `"${(nameCell?.value || '').replace(/"/g, '""')}"`, // Escape quotes
                        bill.metadata?.category || '',
                        amountCell?.value || 0,
                        dateCell?.value || '',
                        statusCell?.value || 'pending',
                        linkCell?.value || '',
                        nameCell?.icon || 'fas fa-file-invoice',
                        bill.metadata?.priority || 'medium',
                        bill.metadata?.paymentMethod || '',
                        bill.metadata?.autoPayEnabled || false,
                        `"${(bill.metadata?.provider || '').replace(/"/g, '""')}"`, // Escape quotes
                        bill.metadata?.accountNumber || ''
                    ];
                    
                    csvRows.push(csvRow.join(','));
                    exportCount++;
                });
            }
        });
        
        console.log(`✅ Prepared ${exportCount} bills for export`);
        
        // Create CSV content
        const csvContent = csvRows.join('\n');
        
        // Create blob and download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        // Generate filename with current date and time
        const date = new Date();
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const timeStr = `${String(date.getHours()).padStart(2, '0')}${String(date.getMinutes()).padStart(2, '0')}`;
        const filename = `bill_categories_${dateStr}_${timeStr}.csv`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log(`📥 Downloaded: ${filename}`);
        
        // Show success notification
        showBillNotification(
            `✅ Exported ${exportCount} bill${exportCount !== 1 ? 's' : ''} to ${filename}`,
            'success'
        );
        
    } catch (error) {
        console.error('❌ Error during CSV export:', error);
        showBillNotification(
            'Error exporting CSV: ' + error.message,
            'error'
        );
    }
}

/**
 * Show bill error
 */
function showBillError(error) {
    const sectionsContainer = document.querySelector('#tabSections');
    if (sectionsContainer) {
        sectionsContainer.innerHTML = `
            <div class="error-state">
                <div class="error-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>Error Loading Bills</h2>
                    <p>Unable to load bill data. Please refresh the page.</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-refresh"></i> Refresh Page
                    </button>
                </div>
            </div>
        `;
    }
}

/**
 * Utility: Update element content safely
 */
function updateElement(selector, content) {
    const element = document.querySelector(selector);
    if (element && content) {
        element.textContent = content;
    }
}

/**
 * Render bill charts
 */
function renderBillCharts() {
    const config = window.BillModule.config;
    
    if (!config.charts) {
        console.warn('No chart data available');
        return;
    }
    
    // Show charts section
    const chartsSection = document.querySelector('#chartsSection');
    if (chartsSection) {
        chartsSection.style.display = 'block';
    }
    
    // Check if Chart.js is available
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js not loaded yet, retrying...');
        
        // Retry up to 10 times with increasing delays
        let retryCount = 0;
        const maxRetries = 10;
        
        const retryInterval = setInterval(() => {
            retryCount++;
            
            if (typeof Chart !== 'undefined') {
                console.log('✅ Chart.js loaded successfully');
                clearInterval(retryInterval);
                initializeCharts(config.charts);
            } else if (retryCount >= maxRetries) {
                console.error('❌ Failed to load Chart.js after maximum retries');
                clearInterval(retryInterval);
                showChartsError();
            } else {
                console.log(`🔄 Retry ${retryCount}/${maxRetries} - waiting for Chart.js...`);
            }
        }, 500);
        
        return;
    }
    
    // Chart.js is available, initialize charts
    initializeCharts(config.charts);
}

/**
 * Initialize charts once Chart.js is loaded
 */
function initializeCharts(chartsConfig) {
    try {
        // Destroy existing charts first
        destroyExistingCharts();
        
        // Render pie chart
        renderPieChart(chartsConfig.pieChart);
        
        // Render bar chart
        renderBarChart(chartsConfig.barChart);
        
        console.log('✅ Charts rendered successfully');
    } catch (error) {
        console.error('❌ Error rendering charts:', error);
        showChartsError();
    }
}

/**
 * Destroy existing chart instances
 */
function destroyExistingCharts() {
    if (window.BillModule.chartInstances.pieChart) {
        window.BillModule.chartInstances.pieChart.destroy();
        window.BillModule.chartInstances.pieChart = null;
        console.log('🗑️ Destroyed existing pie chart');
    }
    
    if (window.BillModule.chartInstances.barChart) {
        window.BillModule.chartInstances.barChart.destroy();
        window.BillModule.chartInstances.barChart = null;
        console.log('🗑️ Destroyed existing bar chart');
    }
}

/**
 * Show error message if charts fail to load
 */
function showChartsError() {
    const chartsSection = document.querySelector('#chartsSection');
    if (chartsSection) {
        chartsSection.innerHTML = `
            <div class="error-state">
                <div class="error-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Charts Unavailable</h3>
                    <p>Unable to load chart visualization. Please refresh the page.</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-refresh"></i>
                        Refresh Page
                    </button>
                </div>
            </div>
        `;
    }
}

/**
 * Render pie chart
 */
function renderPieChart(chartData) {
    const canvas = document.getElementById('billsPieChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Create new chart instance and store reference
    const chartInstance = new Chart(ctx, {
        type: 'pie',
        data: chartData.data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12,
                            family: 'Inter'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value}% (${percentage}%)`;
                        }
                    }
                }
            },
            animation: {
                animateRotate: true,
                duration: 1000
            }
        }
    });
    
    // Store chart instance for future cleanup
    window.BillModule.chartInstances.pieChart = chartInstance;
    console.log('📊 Pie chart created and stored');
}

/**
 * Render bar chart
 */
function renderBarChart(chartData) {
    const canvas = document.getElementById('billsBarChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Create new chart instance and store reference
    const chartInstance = new Chart(ctx, {
        type: 'bar',
        data: chartData.data,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12,
                            family: 'Inter'
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#3b82f6',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: $${context.parsed.y}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value;
                        },
                        font: {
                            family: 'Inter'
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        font: {
                            family: 'Inter'
                        }
                    }
                }
            },
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            }
        }
    });
    
    // Store chart instance for future cleanup
    window.BillModule.chartInstances.barChart = chartInstance;
    console.log('📊 Bar chart created and stored');
}

// Helper function to validate and fix cell structure
function validateAndFixCellStructure(rows) {
    if (!Array.isArray(rows)) return [];
    
    return rows.map(row => {
        if (!row.cells || !Array.isArray(row.cells)) {
            console.warn('Row missing cells array:', row);
            return row;
        }
        
        // Validate each cell and fix if needed
        row.cells = row.cells.map((cell, index) => {
            if (!cell || typeof cell !== 'object') {
                console.warn('Invalid cell structure:', cell, 'at index', index);
                return { type: 'text', value: cell || '' };
            }
            
            // Ensure link cells have proper structure
            if (cell.type === 'link') {
                return {
                    type: 'link',
                    value: cell.value || '#',
                    text: cell.text || 'Pay Now',
                    icon: cell.icon || 'fas fa-credit-card',
                    target: cell.target || '_blank',
                    urgent: cell.urgent || false
                };
            }
            
            // Ensure other cell types have proper structure
            if (!cell.type) {
                cell.type = 'text';
            }
            
            return cell;
        });
        
        return row;
    });
}

// Helper function to get status color
function getStatusColor(status) {
    const colors = {
        'UNPAID': '#dc3545',
        'PAID': '#28a745',
        'OVERDUE': '#fd7e14',
        'PENDING': '#ffc107'
    };
    return colors[status] || '#6c757d';
}

// Helper function to generate overview stats
function generateOverviewStats(bills) {
    if (!bills || bills.length === 0) {
        return {
            totalBills: 0,
            totalAmount: 0,
            paidAmount: 0,
            unpaidAmount: 0,
            overdueAmount: 0
        };
    }

    let totalAmount = 0;
    let paidAmount = 0;
    let unpaidAmount = 0;
    let overdueAmount = 0;

    bills.forEach(bill => {
        const amount = parseFloat(bill.amount) || 0;
        totalAmount += amount;

        switch(bill.status) {
            case 'PAID':
                paidAmount += amount;
                break;
            case 'UNPAID':
                unpaidAmount += amount;
                break;
            case 'OVERDUE':
                overdueAmount += amount;
                break;
        }
    });

    return {
        totalBills: bills.length,
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        unpaidAmount: unpaidAmount,
        overdueAmount: overdueAmount
    };
}

// Search and Filter functionality
let originalBillData = null;
let currentFilters = {
    search: '',
    status: '',
    category: '',
    amount: ''
};

/**
 * Initialize search and filter functionality
 */
function initializeSearchAndFilters() {
    console.log('🔍 Initializing search and filters...');
    
    // Get all required elements
    const searchInput = document.getElementById('billSearch');
    const clearSearchBtn = document.getElementById('clearSearch');
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const amountFilter = document.getElementById('amountFilter');
    const clearFiltersBtn = document.getElementById('clearFilters');
    const viewBtns = document.querySelectorAll('.view-btn');

    // Debug: Check what elements exist
    console.log('Search elements found:', {
        searchInput: !!searchInput,
        clearSearchBtn: !!clearSearchBtn,
        statusFilter: !!statusFilter,
        categoryFilter: !!categoryFilter,
        amountFilter: !!amountFilter,
        clearFiltersBtn: !!clearFiltersBtn,
        viewBtns: viewBtns.length
    });

    // Check if critical elements exist
    if (!searchInput) {
        console.error('❌ Search input (billSearch) not found - DOM not ready');
        return false;
    }
    
    if (!statusFilter || !categoryFilter) {
        console.error('❌ Filter elements not found - DOM not ready');
        return false;
    }

    console.log('✅ All search elements found, setting up event listeners...');

    // Store original data
    const config = window.BillModule.config;
    const billsSection = config.content.sections.find(section => section.id === 'recent-bills');
    if (billsSection && !originalBillData) {
        originalBillData = [...billsSection.data.rows];
    }

    // Search functionality
    searchInput.addEventListener('input', (e) => {
        currentFilters.search = e.target.value.toLowerCase().trim();
        clearSearchBtn.style.display = currentFilters.search ? 'block' : 'none';
        applyFilters();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentFilters.search = '';
        clearSearchBtn.style.display = 'none';
        applyFilters();
    });

    // Filter functionality
    statusFilter.addEventListener('change', (e) => {
        currentFilters.status = e.target.value;
        applyFilters();
    });

    categoryFilter.addEventListener('change', (e) => {
        currentFilters.category = e.target.value;
        applyFilters();
    });

    amountFilter.addEventListener('change', (e) => {
        currentFilters.amount = e.target.value;
        applyFilters();
    });

    clearFiltersBtn.addEventListener('click', () => {
        currentFilters = { search: '', status: '', category: '', amount: '' };
        searchInput.value = '';
        statusFilter.value = '';
        categoryFilter.value = '';
        amountFilter.value = '';
        clearSearchBtn.style.display = 'none';
        applyFilters();
    });

    // Initial count update
    updateResultsCount(originalBillData ? originalBillData.length : 0);
    
    // Add view toggle functionality
    const viewButtons = document.querySelectorAll('.view-btn');
    const tableView = document.querySelector('.table-view');
    const cardsView = document.querySelector('.cards-view');
    
    viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            
            // Update active button
            viewButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show/hide views
            if (view === 'table') {
                tableView.classList.add('active');
                cardsView.classList.remove('active');
            } else {
                tableView.classList.remove('active');
                cardsView.classList.add('active');
            }
        });
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + F to focus search
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
            e.preventDefault();
            searchInput.focus();
        }
        
        // Escape to clear search
        if (e.key === 'Escape' && document.activeElement === searchInput) {
            searchInput.value = '';
            currentFilters.search = '';
            clearSearchBtn.style.display = 'none';
            searchInput.blur();
            applyFilters();
        }
    });
    
    console.log('✅ Search and filter functionality initialized successfully');
    return true; // Success
}

/**
 * Apply current filters to bill data
 */
function applyFilters() {
    if (!originalBillData) return;

    let filteredBills = [...originalBillData];

    // Apply search filter
    if (currentFilters.search) {
        filteredBills = filteredBills.filter(bill => {
            const billName = bill.cells.find(cell => cell.type === 'text')?.value?.toLowerCase() || '';
            const provider = bill.metadata?.provider?.toLowerCase() || '';
            const accountNumber = bill.metadata?.accountNumber?.toLowerCase() || '';
            
            return billName.includes(currentFilters.search) ||
                   provider.includes(currentFilters.search) ||
                   accountNumber.includes(currentFilters.search);
        });
    }

    // Apply status filter
    if (currentFilters.status) {
        filteredBills = filteredBills.filter(bill => {
            const status = bill.cells.find(cell => cell.type === 'status')?.value?.toLowerCase();
            return status === currentFilters.status;
        });
    }

    // Apply category filter
    if (currentFilters.category) {
        filteredBills = filteredBills.filter(bill => {
            const category = bill.metadata?.category?.toLowerCase();
            return category === currentFilters.category;
        });
    }

    // Apply amount filter
    if (currentFilters.amount) {
        filteredBills = filteredBills.filter(bill => {
            const amount = bill.cells.find(cell => cell.type === 'currency')?.value || 0;
            
            switch (currentFilters.amount) {
                case '0-50':
                    return amount >= 0 && amount <= 50;
                case '50-100':
                    return amount > 50 && amount <= 100;
                case '100-500':
                    return amount > 100 && amount <= 500;
                case '500-1000':
                    return amount > 500 && amount <= 1000;
                case '1000+':
                    return amount > 1000;
                default:
                    return true;
            }
        });
    }

    // Update the display
    updateBillDisplay(filteredBills);
    updateResultsCount(filteredBills.length);
}

/**
 * Update bill display with filtered data
 */
function updateBillDisplay(filteredBills) {
    const tableBody = document.querySelector('.bill-table tbody');
    const cardsGrid = document.querySelector('.bill-cards-grid');

    if (tableBody) {
        if (filteredBills.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="no-results">
                        <div class="no-results-content">
                            <i class="fas fa-search"></i>
                            <h4>No bills found</h4>
                            <p>Try adjusting your search or filters</p>
                        </div>
                    </td>
                </tr>
            `;
        } else {
            tableBody.innerHTML = filteredBills.map(row => `
                <tr data-id="${row.id}">
                    ${row.cells.map(cell => renderTableCell(cell)).join('')}
                </tr>
            `).join('');
        }
    }

    if (cardsGrid) {
        if (filteredBills.length === 0) {
            cardsGrid.innerHTML = `
                <div class="no-results-card">
                    <div class="no-results-content">
                        <i class="fas fa-search"></i>
                        <h4>No bills found</h4>
                        <p>Try adjusting your search or filters</p>
                    </div>
                </div>
            `;
        } else {
            cardsGrid.innerHTML = filteredBills.map(row => renderBillCard(row)).join('');
        }
    }
}

/**
 * Update results count display
 */
function updateResultsCount(count) {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
        const total = originalBillData ? originalBillData.length : 0;
        if (count === total) {
            resultsCount.textContent = `${count} bills`;
        } else {
            resultsCount.textContent = `${count} of ${total} bills`;
        }
        resultsCount.style.display = count > 0 ? 'block' : 'none';
    }
}

// Export for global access
window.BillModule.handleAction = handleBillAction;
window.BillModule.showNotification = showBillNotification;
window.BillModule.initializeSearchAndFilters = initializeSearchAndFilters;
window.BillModule.applyFilters = applyFilters;