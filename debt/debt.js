/**
 * Debt Tab JavaScript Module
 * Handles dynamic content loading and debt-specific interactions
 */

console.log('💳 Starting Debt Module...');

// Debt module state
window.DebtModule = {
    config: null,
    initialized: false,
    
    // Public init function for dynamic loading
    init: async function() {
        console.log('🚀 Initializing Debt Module...');
        
        // Check if already initialized
        if (this.initialized) {
            console.log('ℹ️ Debt module already initialized, refreshing content...');
            if (this.config) {
                renderDebtContent(); // Just re-render with existing config
                return;
            }
        }
        
        try {
            await initializeDebtModule();
            console.log('✅ Debt module initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing debt module:', error);
            showDebtError(error);
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📄 Debt DOM Ready');
    
    try {
        await initializeDebtModule();
        console.log('✅ Debt module initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing debt module:', error);
        showDebtError(error);
    }
});

/**
 * Initialize the debt module
 */
async function initializeDebtModule() {
    // Load configuration
    await loadDebtConfig();
    
    // Render content
    renderDebtContent();
    
    // Setup interactions
    setupDebtInteractions();
    
    // Mark as initialized
    window.DebtModule.initialized = true;
}

/**
 * Load debt configuration from JSON
 */
async function loadDebtConfig() {
    try {
        const response = await fetch('../debt/debt.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const config = await response.json();
        window.DebtModule.config = config;
        
        console.log('✅ Debt config loaded:', config);
        return config;
        
    } catch (error) {
        console.error('❌ Failed to load debt config:', error);
        throw error;
    }
}

/**
 * Render debt content
 */
function renderDebtContent() {
    const config = window.DebtModule.config;
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
        sectionsContainer.innerHTML = renderDebtSections(content.sections);
    }
}

/**
 * Render debt sections
 */
function renderDebtSections(sections) {
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
 * Setup debt interactions
 */
function setupDebtInteractions() {
    // Handle action buttons
    document.addEventListener('click', function(e) {
        const actionButton = e.target.closest('[data-action]');
        if (actionButton) {
            e.preventDefault();
            const action = actionButton.dataset.action;
            handleDebtAction(action, actionButton);
        }
    });
}

/**
 * Handle debt-specific actions
 */
function handleDebtAction(action, element) {
    console.log(`💳 Debt action triggered: ${action}`);
    
    switch (action) {
        case 'pay-debt':
            showDebtNotification('Processing debt payment...', 'info');
            setTimeout(() => {
                showDebtNotification('Debt payment functionality coming soon!', 'warning');
            }, 1000);
            break;
        
        case 'debt-details':
            showDebtNotification('Debt details view coming soon!', 'info');
            break;
        
        case 'debt-calculator':
            showDebtCalculator();
            break;
        
        case 'add-debt':
            showDebtNotification('Add debt functionality coming soon!', 'info');
            break;
        
        case 'payment-history':
            showDebtNotification('Payment history view coming soon!', 'info');
            break;
        
        case 'debt-consolidation':
            showDebtNotification('Debt consolidation tools coming soon!', 'info');
            break;
        
        default:
            console.log(`Unknown debt action: ${action}`);
    }
}

/**
 * Show debt calculator (placeholder)
 */
function showDebtCalculator() {
    showDebtNotification('Opening debt calculator...', 'info');
    
    // Create a simple calculator placeholder
    const calculatorHTML = `
        <div class="debt-calculator">
            <h3 class="debt-calculator-title">
                <i class="fas fa-calculator"></i>
                Debt Payoff Calculator
            </h3>
            <p>Advanced debt calculation tools coming soon!</p>
            <div class="calculator-placeholder">
                <p><strong>Features coming:</strong></p>
                <ul>
                    <li>Snowball vs Avalanche method comparison</li>
                    <li>Payment schedule optimization</li>
                    <li>Interest savings calculator</li>
                    <li>Payoff timeline visualization</li>
                </ul>
            </div>
        </div>
    `;
    
    // Find a good place to inject the calculator
    const actionsSection = document.querySelector('#debt-actions');
    if (actionsSection) {
        actionsSection.insertAdjacentHTML('afterend', calculatorHTML);
        
        // Scroll to calculator
        setTimeout(() => {
            document.querySelector('.debt-calculator').scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 100);
    }
}

/**
 * Show debt notification
 */
function showDebtNotification(message, type = 'info') {
    if (window.KasaKolawole?.notify) {
        window.KasaKolawole.notify[type](message);
    } else {
        console.log(`Debt Notification [${type}]: ${message}`);
    }
}

/**
 * Show debt error
 */
function showDebtError(error) {
    const sectionsContainer = document.querySelector('#tabSections');
    if (sectionsContainer) {
        sectionsContainer.innerHTML = `
            <div class="error-state">
                <div class="error-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>Error Loading Debts</h2>
                    <p>Unable to load debt data. Please refresh the page.</p>
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
window.DebtModule.handleAction = handleDebtAction;
window.DebtModule.showNotification = showDebtNotification;
window.DebtModule.showCalculator = showDebtCalculator;