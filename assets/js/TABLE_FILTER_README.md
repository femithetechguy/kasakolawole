# Table Filter Module - Usage Guide

## Overview
A simple, modular filter system for any table or data structure. Can be used across all tabs (bills, debts, etc.).

## Features
- ✅ Text search filtering
- ✅ Dropdown select filtering
- ✅ Range filtering (for numbers)
- ✅ Multiple simultaneous filters
- ✅ Nested object field support (e.g., `metadata.category`)
- ✅ Visual filter indicators
- ✅ Auto-generated unique value lists
- ✅ Debounced text input

## Basic Usage

### 1. Include the script
```html
<script src="/assets/js/table-filter.js"></script>
```

### 2. Initialize the filter
```javascript
const filter = new TableFilter({
    data: yourDataArray,
    onFilterChange: (filteredData, activeFilters) => {
        // This callback is triggered whenever filters change
        renderTable(filteredData);
        updateResultsCount(filteredData.length);
    }
});
```

### 3. Add filter UI to table headers
```javascript
// Text filter
filter.renderFilterUI('Bill Name', headerElement, {
    type: 'text',
    placeholder: 'Search bills...'
});

// Dropdown filter
filter.renderFilterUI('Status', headerElement, {
    type: 'select',
    options: ['paid', 'pending', 'overdue']
});

// Range filter (for amounts)
filter.renderFilterUI('Monthly Amount', headerElement, {
    type: 'range'
});
```

## Filter Types

### Text Filter
```javascript
filter.renderFilterUI('fieldName', headerElement, {
    type: 'text',
    placeholder: 'Type to filter...'
});
```

### Select/Dropdown Filter
```javascript
filter.renderFilterUI('fieldName', headerElement, {
    type: 'select',
    options: ['option1', 'option2', 'option3'],
    formatValue: (value) => value.toUpperCase() // Optional formatter
});
```

### Range Filter (Numbers)
```javascript
filter.renderFilterUI('amount', headerElement, {
    type: 'range'
});
```

## Programmatic Filtering

### Add a filter
```javascript
// Text contains
filter.addFilter('Bill Name', 'mortgage', 'contains');

// Exact match
filter.addFilter('Status', 'paid', 'equals');

// Range
filter.addFilter('amount', [100, 500], 'range');

// Multiple values
filter.addFilter('category', ['housing', 'utilities'], 'in');
```

### Remove a filter
```javascript
filter.removeFilter('Bill Name');
```

### Clear all filters
```javascript
filter.clearAllFilters();
```

## Filter Operators
- `contains` - Text contains (case-insensitive)
- `equals` - Exact match (case-insensitive)
- `in` - Value in array
- `range` - Number between [min, max]
- `gt` - Greater than
- `lt` - Less than
- `gte` - Greater than or equal
- `lte` - Less than or equal

## Nested Field Support
```javascript
// Filter on nested object fields using dot notation
filter.addFilter('metadata.category', 'housing', 'equals');
filter.addFilter('metadata.priority', 'critical', 'equals');
```

## Getting Data

### Get filtered data
```javascript
const filtered = filter.getFilteredData();
```

### Get active filters
```javascript
const activeFilters = filter.getActiveFilters();
// Returns: { 'field1': { value: 'x', operator: 'contains' }, ... }
```

### Get unique values for a field
```javascript
const statuses = filter.getUniqueValues('Status');
// Returns: ['paid', 'pending', 'overdue']
```

## Complete Example

```javascript
// Initialize
const billFilter = new TableFilter({
    data: billsData,
    onFilterChange: (filteredData) => {
        renderBillTable(filteredData);
        document.getElementById('resultsCount').textContent = 
            `${filteredData.length} bills`;
    }
});

// Add filters to table headers
const headers = {
    'Bill Name': { type: 'text', placeholder: 'Search bills...' },
    'Status': { type: 'select' },
    'Monthly Amount': { type: 'range' },
    'metadata.category': { type: 'select', placeholder: 'Category' }
};

Object.entries(headers).forEach(([field, config]) => {
    const headerCell = document.querySelector(`[data-field="${field}"]`);
    if (headerCell) {
        billFilter.renderFilterUI(field, headerCell, config);
    }
});
```

## Styling

The filter UI uses Bootstrap classes but you can customize:

```css
.filter-icon {
    margin-left: 8px;
    cursor: pointer;
    font-size: 0.9em;
    color: #6c757d;
}

.filter-icon:hover {
    color: #0d6efd;
}

.filter-dropdown {
    position: absolute;
    top: 100%;
    left: 0;
    z-index: 1000;
    background: white;
    border: 1px solid #ddd;
    border-radius: 4px;
    padding: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}
```

## Integration with Existing Code

### For Bills Module
```javascript
// In bill.js, after loading data:
window.BillModule.filter = new TableFilter({
    data: billsData.rows,
    onFilterChange: (filtered) => {
        // Re-render table with filtered data
        renderFilteredBills(filtered);
    }
});

// Add to existing table headers
window.BillModule.addColumnFilters = function() {
    const config = {
        'cells[1].value': { type: 'text', placeholder: 'Bill name' },
        'cells[4].value': { type: 'select', placeholder: 'Status' },
        'cells[2].value': { type: 'range' }
    };
    
    // Apply to headers...
};
```

## Best Practices

1. **Use debouncing for text inputs** - Already built in (300ms delay)
2. **Close dropdowns on click outside** - Handled automatically
3. **Visual indicator for active filters** - Icon turns blue when filter is active
4. **Provide clear options** - Use formatValue to make dropdown options readable
5. **Handle nested data** - Use dot notation for nested object fields
