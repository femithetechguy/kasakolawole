/**
 * Home Dashboard JavaScript Module
 * Handles dynamic tab-based content loading and interactions
 */

console.log('🏠 Starting Home Dashboard...');

// Global dashboard state
window.KasaDashboard = {
    config: null,
    activeTab: null,
    tabs: {},
    loadedModules: new Set(), // Track loaded modules
    moduleContent: {} // Cache module content
};

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📄 DOM Ready');
    
    try {
        // Load configuration
        await loadDashboardConfig();
        
        // Initialize dashboard
        await initializeDashboard();
        
        console.log('✅ Dashboard initialized successfully');
        
    } catch (error) {
        console.error('❌ Error initializing dashboard:', error);
        showErrorState();
    }
});

/**
 * Load dashboard configuration from JSON
 */
async function loadDashboardConfig() {
    try {
        const response = await fetch('/home/home.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const config = await response.json();
        window.KasaDashboard.config = config;
        
        console.log('✅ Dashboard config loaded:', config);
        return config;
        
    } catch (error) {
        console.error('❌ Failed to load dashboard config:', error);
        throw error;
    }
}

/**
 * Initialize the dashboard
 */
async function initializeDashboard() {
    const config = window.KasaDashboard.config;
    
    // Update page title
    if (config.meta?.title) {
        document.title = config.meta.title;
    }
    
    // Setup navigation
    setupNavigation();
    
    // Setup tabs
    setupTabs();
    
    // Setup footer
    setupFooter();
    
    // Load default tab
    const defaultTab = config.app?.defaultTab || 'bill';
    await loadTab(defaultTab);
    
    // Setup event listeners
    setupEventListeners();
}

/**
 * Setup navigation header
 */
function setupNavigation() {
    const config = window.KasaDashboard.config;
    
    // Update brand
    if (config.navigation?.brand) {
        updateElement('.brand-name', config.navigation.brand.name);
        
        const logoIcon = document.querySelector('.logo-icon');
        if (logoIcon && config.navigation.brand.icon) {
            logoIcon.className = `${config.navigation.brand.icon} logo-icon`;
        }
    }
    
    // Setup user menu
    if (config.navigation?.user) {
        updateElement('#userName', config.navigation.user.name);
        
        // Setup user dropdown menu
        const userDropdown = document.querySelector('#userDropdown');
        if (userDropdown && config.navigation.user.menu) {
            userDropdown.innerHTML = config.navigation.user.menu.map(item => 
                `<a href="#" class="dropdown-item" data-action="${item.action}">
                    <i class="${item.icon}"></i>
                    ${item.text}
                </a>`
            ).join('');
        }
    }
}

/**
 * Setup tab navigation
 */
function setupTabs() {
    const config = window.KasaDashboard.config;
    const tabNavList = document.querySelector('#tabNavList');
    
    if (!tabNavList || !config.tabs) return;
    
    // Generate tab navigation
    const tabsHTML = Object.values(config.tabs).map(tab => 
        `<button class="tab-nav-item ${tab.active ? 'active' : ''}" 
                data-tab="${tab.id}" 
                id="tab-${tab.id}">
            <i class="${tab.icon}"></i>
            <span>${tab.title}</span>
        </button>`
    ).join('');
    
    tabNavList.innerHTML = tabsHTML;
    
    // Store tabs in global state
    window.KasaDashboard.tabs = config.tabs;
}

/**
 * Load and display a specific tab
 */
async function loadTab(tabId) {
    const config = window.KasaDashboard.config;
    const tab = config.tabs?.[tabId];
    
    if (!tab) {
        console.warn(`Tab "${tabId}" not found`);
        return;
    }
    
    console.log(`📋 Loading tab: ${tabId}`);
    
    // Update active tab state
    updateActiveTab(tabId);
    
    // Render tab content (now async)
    await renderTabContent(tab);
    
    // Update global state
    window.KasaDashboard.activeTab = tabId;
}

/**
 * Update active tab styling
 */
function updateActiveTab(tabId) {
    // Remove active class from all tabs
    document.querySelectorAll('.tab-nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to selected tab
    const activeTab = document.querySelector(`#tab-${tabId}`);
    if (activeTab) {
        activeTab.classList.add('active');
    }
}

/**
 * Render tab content dynamically
 */
async function renderTabContent(tab) {
    const container = document.querySelector('#tabContentContainer');
    if (!container) return;
    
    try {
        // Check if this is a standalone module
        if (tab.standalone && tab.url) {
            console.log(`📦 Loading standalone module: ${tab.id}`);
            
            // Check if module content is already cached
            if (window.KasaDashboard.moduleContent[tab.id]) {
                console.log(`🚀 Using cached content for module: ${tab.id}`);
                container.innerHTML = window.KasaDashboard.moduleContent[tab.id];
                
                // Re-initialize the module if it's already loaded
                if (window.KasaDashboard.loadedModules.has(tab.id)) {
                    const moduleInitName = `${tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}Module`;
                    if (window[moduleInitName] && typeof window[moduleInitName].init === 'function') {
                        console.log(`🔄 Re-initializing cached module: ${moduleInitName}`);
                        setTimeout(async () => {
                            try {
                                await window[moduleInitName].init();
                                console.log(`✅ Cached module ${moduleInitName} re-initialized`);
                            } catch (initError) {
                                console.error(`❌ Cached module re-init failed for ${moduleInitName}:`, initError);
                            }
                        }, 50);
                    }
                }
                return;
            }
            
            // Load the standalone module HTML for the first time
            const response = await fetch(tab.url);
            if (!response.ok) {
                throw new Error(`Failed to load ${tab.url}: ${response.statusText}`);
            }
            
            const html = await response.text();
            container.innerHTML = html;
            
            // Cache the content
            window.KasaDashboard.moduleContent[tab.id] = html;
            
            // Wait for next tick to ensure DOM is updated
            await new Promise(resolve => setTimeout(resolve, 0));
            
            // Load the corresponding module CSS and JS (only if not already loaded)
            if (!window.KasaDashboard.loadedModules.has(tab.id)) {
                await loadModuleAssets(tab.id);
                window.KasaDashboard.loadedModules.add(tab.id);
            } else {
                // Module already loaded, just re-initialize
                const moduleInitName = `${tab.id.charAt(0).toUpperCase() + tab.id.slice(1)}Module`;
                if (window[moduleInitName] && typeof window[moduleInitName].init === 'function') {
                    console.log(`🔄 Re-initializing existing module: ${moduleInitName}`);
                    setTimeout(async () => {
                        try {
                            await window[moduleInitName].init();
                            console.log(`✅ Existing module ${moduleInitName} re-initialized`);
                        } catch (initError) {
                            console.error(`❌ Existing module re-init failed for ${moduleInitName}:`, initError);
                        }
                    }, 50);
                }
            }
            
        } else {
            // Legacy content rendering (for backwards compatibility)
            console.log(`📋 Loading legacy content for: ${tab.id}`);
            
            const content = tab.content;
            if (!content) {
                throw new Error(`No content found for tab ${tab.id}`);
            }

            // Create tab content HTML (existing legacy approach)
            const tabHTML = `
                <div class="tab-content active" id="${tab.id}-content">
                    <!-- Tab Header -->
                    <div class="tab-header">
                        <div class="container">
                            <div class="tab-header-content">
                                <div class="tab-icon">
                                    <i class="${tab.icon}"></i>
                                </div>
                                <div class="tab-info">
                                    <h1 class="tab-title">${content.title}</h1>
                                    <p class="tab-subtitle">${content.subtitle}</p>
                                    <p class="tab-description">${content.description}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Tab Sections -->
                    <div class="tab-sections">
                        <div class="container">
                            ${renderTabSections(content.sections)}
                        </div>
                    </div>
                </div>
            `;
            
            container.innerHTML = tabHTML;
        }
        
        // Setup section interactions
        setupTabInteractions(tab.id);
        
    } catch (error) {
        console.error(`❌ Error rendering tab content for ${tab.id}:`, error);
        container.innerHTML = `
            <div class="tab-content active">
                <div class="container">
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>Error loading content:</strong> ${error.message}
                    </div>
                </div>
            </div>
        `;
    }
}

/**
 * Load module-specific CSS and JS assets
 */
async function loadModuleAssets(moduleName) {
    try {
        console.log(`🔧 Loading assets for module: ${moduleName}`);
        
        // Load CSS
        const cssId = `${moduleName}-module-css`;
        if (!document.getElementById(cssId)) {
            const cssLink = document.createElement('link');
            cssLink.id = cssId;
            cssLink.rel = 'stylesheet';
            cssLink.href = `../${moduleName}/${moduleName}.css`;
            document.head.appendChild(cssLink);
            console.log(`✅ CSS loaded: ${cssLink.href}`);
        }

        // Load JS
        const jsId = `${moduleName}-module-js`;
        if (!document.getElementById(jsId)) {
            const script = document.createElement('script');
            script.id = jsId;
            script.src = `../${moduleName}/${moduleName}.js`;
            script.defer = true;
            
            // Wait for script to load and initialize
            await new Promise((resolve, reject) => {
                script.onload = async () => {
                    console.log(`✅ JS loaded: ${script.src}`);
                    
                    // Wait a bit more for DOM to be ready, then initialize
                    setTimeout(async () => {
                        const moduleInitName = `${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Module`;
                        if (window[moduleInitName] && typeof window[moduleInitName].init === 'function') {
                            console.log(`🚀 Initializing module: ${moduleInitName}`);
                            try {
                                await window[moduleInitName].init();
                                console.log(`✅ Module ${moduleInitName} initialized`);
                            } catch (initError) {
                                console.error(`❌ Module init failed for ${moduleInitName}:`, initError);
                            }
                        }
                        resolve();
                    }, 100); // Small delay to ensure DOM is ready
                };
                script.onerror = (error) => {
                    console.error(`❌ Failed to load JS: ${script.src}`, error);
                    reject(error);
                };
                document.head.appendChild(script);
            });
        }
        
    } catch (error) {
        console.error(`❌ Error loading ${moduleName} module assets:`, error);
    }
}

/**
 * Render tab sections based on type
 */
function renderTabSections(sections) {
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
 * Setup tab-specific interactions
 */
function setupTabInteractions(tabId) {
    // Handle action buttons
    document.querySelectorAll('[data-action]').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const action = e.currentTarget.dataset.action;
            handleAction(action, e.currentTarget);
        });
    });
}

/**
 * Handle action clicks
 */
function handleAction(action, element) {
    console.log(`🔄 Action triggered: ${action}`);
    
    switch (action) {
        case 'logout':
            handleLogout();
            break;
        case 'pay':
        case 'edit':
        case 'schedule':
        case 'add-bill':
        case 'view-all':
        case 'settings':
        case 'export':
            // Show placeholder for future functionality
            showToast(`${action} functionality coming soon!`, 'info');
            break;
        case 'pay-debt':
            showToast('Debt payment functionality coming soon!', 'info');
            break;
        case 'debt-details':
            showToast('Debt details view coming soon!', 'info');
            break;
        case 'debt-calculator':
            showToast('Debt payoff calculator coming soon!', 'info');
            break;
        case 'add-debt':
            showToast('Add debt functionality coming soon!', 'info');
            break;
        case 'payment-history':
            showToast('Payment history view coming soon!', 'info');
            break;
        case 'debt-consolidation':
            showToast('Debt consolidation tools coming soon!', 'info');
            break;
        default:
            console.log(`Unknown action: ${action}`);
    }
}

/**
 * Handle logout
 */
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear session
        if (window.KasaKolawole?.storage) {
            window.KasaKolawole.storage.clear();
        }
        
        // Redirect to login
        window.location.href = '/';
    }
}

/**
 * Setup footer
 */
function setupFooter() {
    const config = window.KasaDashboard.config;
    
    if (config.footer?.company) {
        updateElement('.footer-brand .brand-name', config.footer.company.name);
        updateElement('.footer-brand p', config.footer.company.description);
        updateElement('.footer-bottom p', config.footer.copyright);
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Tab navigation clicks
    document.addEventListener('click', async (e) => {
        if (e.target.closest('.tab-nav-item')) {
            const tabId = e.target.closest('.tab-nav-item').dataset.tab;
            if (tabId) {
                await loadTab(tabId);
            }
        }
    });
    
    // User menu toggle
    const userMenuToggle = document.querySelector('#userMenuToggle');
    const userDropdown = document.querySelector('#userDropdown');
    
    if (userMenuToggle && userDropdown) {
        userMenuToggle.addEventListener('click', (e) => {
            e.preventDefault();
            userDropdown.classList.toggle('active');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.user-menu-container')) {
                userDropdown.classList.remove('active');
            }
        });
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
 * Show error state
 */
function showErrorState() {
    const container = document.querySelector('#tabContentContainer');
    if (container) {
        container.innerHTML = `
            <div class="error-state">
                <div class="error-content">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h2>Error Loading Dashboard</h2>
                    <p>Unable to load dashboard configuration. Please refresh the page.</p>
                    <button class="btn btn-primary" onclick="location.reload()">
                        <i class="fas fa-refresh"></i> Refresh Page
                    </button>
                </div>
            </div>
        `;
    }
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
    if (window.KasaKolawole?.notify) {
        window.KasaKolawole.notify[type](message);
    } else {
        console.log(`Toast: ${message}`);
    }
}

// Export for global access
window.KasaDashboard.loadTab = loadTab;
window.KasaDashboard.handleAction = handleAction;