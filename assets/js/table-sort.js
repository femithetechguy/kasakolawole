/**
 * Modular Table Sort System
 * A simple, reusable sort component for any table/data structure
 * 
 * Usage:
 * const sorter = new TableSort({
 *     data: myDataArray,
 *     onSortChange: (sortedData, sortInfo) => {
 *         // Update your UI with sortedData
 *     }
 * });
 * 
 * sorter.renderSortUI('fieldName', headerElement);
 * sorter.sortBy('fieldName', 'asc');
 */

class TableSort {
    constructor(options = {}) {
        this.data = options.data || [];
        this.sortedData = [...this.data];
        this.currentSort = {
            field: null,
            direction: null // 'asc' or 'desc'
        };
        this.onSortChange = options.onSortChange || (() => {});
        this.customComparators = options.customComparators || {};
    }

    /**
     * Set data for sorting
     * @param {Array} data - Array of objects to sort
     */
    setData(data) {
        this.data = data;
        this.sortedData = [...data];
        if (this.currentSort.field) {
            this.applySort();
        }
    }

    /**
     * Sort by a specific field
     * @param {string} field - The field name to sort on
     * @param {string} direction - Sort direction: 'asc' or 'desc'. If null, toggles current direction
     */
    sortBy(field, direction = null) {
        // If no direction specified, toggle or default to ascending
        if (!direction) {
            if (this.currentSort.field === field) {
                // Toggle direction
                direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                // New field, default to ascending
                direction = 'asc';
            }
        }

        this.currentSort = { field, direction };
        this.applySort();
        this.updateAllSortIcons();
    }

    /**
     * Clear sorting (restore original order)
     */
    clearSort() {
        this.currentSort = { field: null, direction: null };
        this.sortedData = [...this.data];
        this.onSortChange(this.sortedData, this.currentSort);
        this.updateAllSortIcons();
    }

    /**
     * Apply sorting to the data
     */
    applySort() {
        if (!this.currentSort.field) {
            this.sortedData = [...this.data];
            this.onSortChange(this.sortedData, this.currentSort);
            return;
        }

        this.sortedData = [...this.data].sort((a, b) => {
            const aValue = this.getNestedValue(a, this.currentSort.field);
            const bValue = this.getNestedValue(b, this.currentSort.field);
            
            // Use custom comparator if provided
            if (this.customComparators[this.currentSort.field]) {
                return this.customComparators[this.currentSort.field](aValue, bValue, this.currentSort.direction);
            }
            
            return this.compareValues(aValue, bValue, this.currentSort.direction);
        });

        this.onSortChange(this.sortedData, this.currentSort);
    }

    /**
     * Get nested value from object using dot notation
     * @param {Object} obj - The object to get value from
     * @param {string} path - The path to the value (e.g., 'metadata.category')
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Compare two values for sorting
     * @param {*} a - First value
     * @param {*} b - Second value
     * @param {string} direction - Sort direction ('asc' or 'desc')
     * @returns {number} Comparison result
     */
    compareValues(a, b, direction) {
        // Handle null/undefined
        if (a === null || a === undefined) return direction === 'asc' ? 1 : -1;
        if (b === null || b === undefined) return direction === 'asc' ? -1 : 1;

        // Try numeric comparison first (handles currency like $123.45)
        const aNum = parseFloat(String(a).replace(/[^0-9.-]/g, ''));
        const bNum = parseFloat(String(b).replace(/[^0-9.-]/g, ''));
        if (!isNaN(aNum) && !isNaN(bNum)) {
            const result = aNum - bNum;
            return direction === 'asc' ? result : -result;
        }

        // Try date comparison
        const aDate = new Date(a);
        const bDate = new Date(b);
        if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
            const result = aDate.getTime() - bDate.getTime();
            return direction === 'asc' ? result : -result;
        }

        // String comparison (case-insensitive)
        const aStr = String(a).toLowerCase();
        const bStr = String(b).toLowerCase();
        const result = aStr.localeCompare(bStr);
        return direction === 'asc' ? result : -result;
    }

    /**
     * Render sort UI for a table header
     * @param {string} field - The field name to sort by
     * @param {HTMLElement} headerCell - The header cell element
     * @param {Object} config - Sort configuration (optional)
     */
    renderSortUI(field, headerCell, config = {}) {
        // Make header cell clickable
        headerCell.style.cursor = 'pointer';
        headerCell.style.userSelect = 'none';
        headerCell.style.position = 'relative';
        
        // Add some padding for the icon
        const originalPadding = window.getComputedStyle(headerCell).paddingRight;
        headerCell.style.paddingRight = 'calc(' + originalPadding + ' + 20px)';

        // Create sort icon container
        const sortIconContainer = document.createElement('span');
        sortIconContainer.className = 'sort-icon-container';
        sortIconContainer.style.cssText = `
            position: absolute;
            right: 8px;
            top: 50%;
            transform: translateY(-50%);
            display: inline-flex;
            flex-direction: column;
            gap: 2px;
            opacity: 0.3;
        `;
        sortIconContainer.dataset.field = field;

        // Create sort icons
        const sortAscIcon = document.createElement('i');
        sortAscIcon.className = 'bi bi-caret-up-fill sort-asc-icon';
        sortAscIcon.style.cssText = 'font-size: 0.6em; line-height: 1;';
        
        const sortDescIcon = document.createElement('i');
        sortDescIcon.className = 'bi bi-caret-down-fill sort-desc-icon';
        sortDescIcon.style.cssText = 'font-size: 0.6em; line-height: 1;';

        sortIconContainer.appendChild(sortAscIcon);
        sortIconContainer.appendChild(sortDescIcon);
        headerCell.appendChild(sortIconContainer);

        // Update icon state
        this.updateSortIcon(field, sortIconContainer);

        // Click handler
        headerCell.addEventListener('click', () => {
            this.sortBy(field);
        });
    }

    /**
     * Update sort icon based on current sort state
     * @param {string} field - The field name
     * @param {HTMLElement} iconContainer - The icon container element
     */
    updateSortIcon(field, iconContainer) {
        const isActive = this.currentSort.field === field;
        const direction = this.currentSort.direction;

        if (isActive) {
            iconContainer.style.opacity = '1';
            if (direction === 'asc') {
                iconContainer.querySelector('.sort-asc-icon').style.color = '#0d6efd';
                iconContainer.querySelector('.sort-desc-icon').style.color = '#6c757d';
            } else {
                iconContainer.querySelector('.sort-asc-icon').style.color = '#6c757d';
                iconContainer.querySelector('.sort-desc-icon').style.color = '#0d6efd';
            }
        } else {
            iconContainer.style.opacity = '0.3';
            iconContainer.querySelector('.sort-asc-icon').style.color = '';
            iconContainer.querySelector('.sort-desc-icon').style.color = '';
        }
    }

    /**
     * Update all sort icons in the DOM
     */
    updateAllSortIcons() {
        document.querySelectorAll('.sort-icon-container').forEach(container => {
            const field = container.dataset.field;
            if (field) {
                this.updateSortIcon(field, container);
            }
        });
    }

    /**
     * Get sorted data
     * @returns {Array} The sorted data
     */
    getSortedData() {
        return this.sortedData;
    }

    /**
     * Get current sort state
     * @returns {Object} Current sort configuration
     */
    getCurrentSort() {
        return { ...this.currentSort };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TableSort;
}
