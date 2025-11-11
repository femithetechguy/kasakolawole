# Table Sort Module

A lightweight, reusable JavaScript module for sorting table data with visual indicators.

## Features

- **Universal Compatibility**: Works with any data structure or table format
- **Smart Sorting**: Automatically detects data types (numbers, dates, strings)
- **Visual Feedback**: Bootstrap Icons-based sort indicators on column headers
- **Custom Comparators**: Define custom sorting logic for specific fields
- **Toggle Direction**: Click headers to cycle between ascending/descending/unsorted
- **Mobile Friendly**: Works with both table and card layouts

## Usage

### Basic Setup

```javascript
// Initialize the sorter
const sorter = new TableSort({
    data: myDataArray,
    onSortChange: (sortedData, sortInfo) => {
        // Update your UI with sortedData
        console.log(`Sorted by ${sortInfo.field} (${sortInfo.direction})`);
        renderTable(sortedData);
    }
});

// Add sort UI to table headers
const headers = document.querySelectorAll('thead th');
sorter.renderSortUI('fieldName', headers[0]);
```

### With Custom Comparators

```javascript
const sorter = new TableSort({
    data: myDataArray,
    onSortChange: (sortedData) => renderTable(sortedData),
    customComparators: {
        'amount': (a, b, direction) => {
            // Custom logic for currency amounts
            const aNum = parseFloat(String(a).replace(/[^0-9.-]/g, ''));
            const bNum = parseFloat(String(b).replace(/[^0-9.-]/g, ''));
            const result = aNum - bNum;
            return direction === 'asc' ? result : -result;
        },
        'dueDate': (a, b, direction) => {
            // Custom logic for MM-DD-YYYY dates
            const aDate = parseDate(a);
            const bDate = parseDate(b);
            const result = aDate.getTime() - bDate.getTime();
            return direction === 'asc' ? result : -result;
        }
    }
});
```

## API Reference

### Constructor Options

| Option | Type | Description |
|--------|------|-------------|
| `data` | Array | Initial data array to sort |
| `onSortChange` | Function | Callback when sort changes: `(sortedData, sortInfo) => {}` |
| `customComparators` | Object | Custom comparison functions keyed by field name |

### Methods

#### `setData(data)`
Update the data array and re-apply current sort.

```javascript
sorter.setData(newDataArray);
```

#### `sortBy(field, direction)`
Sort by a specific field. Direction can be `'asc'`, `'desc'`, or `null` (toggle).

```javascript
sorter.sortBy('amount', 'asc');  // Sort ascending
sorter.sortBy('amount', 'desc'); // Sort descending
sorter.sortBy('amount');         // Toggle direction
```

#### `clearSort()`
Remove sorting and restore original order.

```javascript
sorter.clearSort();
```

#### `renderSortUI(field, headerElement, config)`
Add sort icons and click handlers to a table header.

```javascript
sorter.renderSortUI('fieldName', headerElement);
```

#### `getSortedData()`
Get the current sorted data array.

```javascript
const sorted = sorter.getSortedData();
```

#### `getCurrentSort()`
Get current sort state.

```javascript
const { field, direction } = sorter.getCurrentSort();
```

## Built-in Sort Logic

The module automatically handles:

1. **Numbers**: Extracts numeric values from strings (e.g., `$123.45` → `123.45`)
2. **Dates**: Parses ISO dates and Date objects
3. **Strings**: Case-insensitive alphabetical sorting
4. **Null/Undefined**: Always sorted to the end

## Visual Indicators

Sort icons use Bootstrap Icons:
- **Inactive**: Gray double arrows (opacity 30%)
- **Ascending**: Blue up arrow highlighted
- **Descending**: Blue down arrow highlighted

## Example: Bill Table Integration

```javascript
const billSorter = new TableSort({
    data: billData,
    onSortChange: (sorted) => renderBillTable(sorted),
    customComparators: {
        'cells.2.value': (a, b, direction) => {
            // Currency sorting
            const aNum = parseFloat(String(a).replace(/[^0-9.-]/g, ''));
            const bNum = parseFloat(String(b).replace(/[^0-9.-]/g, ''));
            return direction === 'asc' ? aNum - bNum : bNum - aNum;
        }
    }
});

// Add sort to headers
const headers = {
    1: 'cells.1.value', // Bill Name
    2: 'cells.2.value', // Amount
    3: 'cells.3.value', // Due Date
    4: 'cells.4.value'  // Status
};

document.querySelectorAll('thead th').forEach((th, index) => {
    if (headers[index]) {
        billSorter.renderSortUI(headers[index], th);
    }
});
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires ES6 support (arrow functions, spread operator, etc.)
- Bootstrap Icons for visual indicators

## Nested Field Access

Supports dot notation for nested properties:

```javascript
// Sort by nested field
sorter.sortBy('user.profile.name', 'asc');

// In data structure:
const data = [
    { user: { profile: { name: 'Alice' } } },
    { user: { profile: { name: 'Bob' } } }
];
```

## Performance

- **Efficient**: Uses native `Array.sort()` with optimized comparators
- **Non-destructive**: Original data array is never modified
- **Minimal DOM**: Only updates sort icons, delegates rendering to callback

## License

MIT License - Free to use in personal and commercial projects
