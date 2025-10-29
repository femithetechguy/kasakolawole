/**
 * Bill Tab JavaScript Module
 * Handles dynamic content loading and bill-specific interactions
 */

console.log('💵 Starting Bill Module...');

// Bill module state
window.BillModule = {
    config: null,
    initialized: false,
    
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
        } catch (error) {
            console.error('❌ Error initializing bill module:', error);
            showBillError(error);
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
        const response = await fetch('../bill/bill.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const config = await response.json();
        window.BillModule.config = config;
        
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

// Export for global access
window.BillModule.handleAction = handleBillAction;
window.BillModule.showNotification = showBillNotification;