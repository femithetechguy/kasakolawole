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
    
    // Public init function for dynamic loading
    init: async function() {
        console.log('🚀 Initializing Bill Module...');
        
        // Check if already initialized
        if (this.initialized) {
            console.log('ℹ️ Bill module already initialized, refreshing content...');
            if (this.config) {
                renderBillContent(); // Just re-render with existing config
                return;
            }
        }
        
        try {
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
            await loadBillConfig();
            renderBillContent();
            console.log('✅ Bill data refreshed successfully');
            
            // Show notification to user
            this.showRefreshNotification();
        } catch (error) {
            console.error('❌ Failed to refresh bill data:', error);
        }
    },
    
    // Show refresh notification
    showRefreshNotification: function() {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.className = 'refresh-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-sync-alt"></i>
                <span>Bill data updated automatically</span>
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

/**
 * Load bill configuration from JSON
 */
async function loadBillConfig() {
    try {
        const response = await fetch('../bill/bill.json', {
            cache: 'no-cache' // Always get fresh data
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const config = await response.json();
        window.BillModule.config = config;
        
        // Track last modified time for auto-refresh
        const lastModified = response.headers.get('Last-Modified');
        if (lastModified) {
            window.BillModule.configLastModified = lastModified;
        }
        
        console.log('✅ Bill config loaded:', config);
        return config;
        
    } catch (error) {
        console.error('❌ Failed to load bill config:', error);
        throw error;
    }
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
 * Render table section
 */
function renderTableSection(section) {
    const headersHTML = section.data.headers.map(header => 
        `<th>${header}</th>`
    ).join('');
    
    const rowsHTML = section.data.rows.map(row => 
        `<tr data-id="${row.id}">
            ${row.cells.map(cell => renderTableCell(cell)).join('')}
        </tr>`
    ).join('');
    
    return `
        <section class="section table-section" id="${section.id}">
            <h2 class="section-title">${section.title}</h2>
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>${headersHTML}</tr>
                    </thead>
                    <tbody>
                        ${rowsHTML}
                    </tbody>
                </table>
            </div>
        </section>
    `;
}

/**
 * Render table cell based on type
 */
function renderTableCell(cell) {
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
            return `<td class="cell-link">
                <a href="${cell.value}" 
                   target="${cell.target || '_self'}" 
                   class="payment-link${urgentClass}"
                   title="${cell.text}">
                    ${cell.icon ? `<i class="${cell.icon}"></i>` : ''}
                    <span>${cell.text}</span>
                </a>
            </td>`;
        
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
            return `<td>${cell.value}</td>`;
    }
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
        
        default:
            console.log(`Unknown bill action: ${action}`);
    }
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
    
    new Chart(ctx, {
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
}

/**
 * Render bar chart
 */
function renderBarChart(chartData) {
    const canvas = document.getElementById('billsBarChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    new Chart(ctx, {
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
}

// Export for global access
window.BillModule.handleAction = handleBillAction;
window.BillModule.showNotification = showBillNotification;