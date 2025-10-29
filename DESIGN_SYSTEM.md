# Kasa Kolawole Design System

## 🎨 Global Design Consistency Guidelines

### Overview
This design system ensures visual consistency across all modules in the Kasa Kolawole application. All styles are centralized in `assets/css/global.css` with module-specific theming applied through CSS custom properties.

## 🎯 Design Tokens

### Colors
```css
--primary-color: #2C3E50     /* Main brand color */
--secondary-color: #E74C3C   /* Accent/danger color */
--accent-color: #F39C12      /* Warning/highlight color */
--success-color: #059669     /* Success states */
--error-color: #dc3545       /* Error states */
--warning-color: #f59e0b     /* Warning states */
--info-color: #3b82f6        /* Info states */
```

### Module Theming
Each module uses specific theme colors while maintaining consistency:

**Bill Module:**
- Primary: `#3b82f6` (Blue)
- Accent: `#10b981` (Green)
- Background: `rgba(59, 130, 246, 0.05)`

**Debt Module:**
- Primary: `#dc2626` (Red)
- Accent: `#f59e0b` (Orange)
- Background: `rgba(220, 38, 38, 0.05)`

### Typography Scale
```css
--font-size-xs: 0.75rem      /* 12px */
--font-size-sm: 0.875rem     /* 14px */
--font-size-base: 1rem       /* 16px */
--font-size-lg: 1.125rem     /* 18px */
--font-size-xl: 1.25rem      /* 20px */
--font-size-2xl: 1.5rem      /* 24px */
--font-size-3xl: 1.875rem    /* 30px */
--font-size-4xl: 2.25rem     /* 36px */
```

### Spacing System
```css
--spacing-xs: 0.25rem        /* 4px */
--spacing-sm: 0.5rem         /* 8px */
--spacing-base: 1rem         /* 16px */
--spacing-lg: 1.5rem         /* 24px */
--spacing-xl: 2rem           /* 32px */
--spacing-2xl: 2.5rem        /* 40px */
--spacing-3xl: 3rem          /* 48px */
```

## 🧩 Components

### Status Badges
Use global status classes for consistency:
```html
<span class="status-badge status-pending">Pending</span>
<span class="status-badge status-overdue">Overdue</span>
<span class="status-badge status-upcoming">Upcoming</span>
<span class="status-badge status-paid">Paid</span>
<span class="status-badge status-success">Success</span>
<span class="status-badge status-warning">Warning</span>
<span class="status-badge status-danger">Danger</span>
<span class="status-badge status-info">Info</span>
```

### Stat Cards
```html
<div class="stat-card" data-color="primary">
    <div class="stat-icon">
        <i class="fas fa-chart-line"></i>
    </div>
    <div class="stat-content">
        <div class="stat-label">Total Revenue</div>
        <div class="stat-value">$12,450</div>
    </div>
</div>
```

Available `data-color` values:
- `primary`, `secondary`, `success`, `warning`, `danger`, `info`

### Buttons
```html
<button class="btn btn-primary">Primary Action</button>
<button class="btn btn-secondary">Secondary Action</button>
<button class="btn btn-accent">Accent Action</button>
<button class="btn btn-outline">Outline Action</button>
```

### Loading States
```html
<div class="loading-state">
    <div class="loading-content">
        <div class="spinner"></div>
        <p>Loading content...</p>
    </div>
</div>
```

## 🎨 Module Theming

### Implementation
Each module applies its theme through CSS custom properties:

```css
/* In module-specific CSS */
.tab-content#module-content {
    --module-primary: #3b82f6;
    --module-accent: #10b981;
    --module-bg: rgba(59, 130, 246, 0.05);
}
```

### Benefits
1. **Consistency**: All modules use the same component structure
2. **Flexibility**: Each module can have its own color palette
3. **Maintainability**: Global changes affect all modules
4. **Performance**: Minimal CSS duplication

## 📐 Layout Standards

### Container Widths
- `--max-content-width: 1200px` - Maximum content width
- Use `.container` class for responsive containers

### Border Radius
- `--border-radius: 10px` - Standard border radius
- `--border-radius-lg: 15px` - Large border radius
- `--border-radius-xl: 20px` - Extra large border radius

### Shadows
- `--shadow-sm` - Subtle shadow
- `--shadow-base` - Standard shadow
- `--shadow-lg` - Prominent shadow
- `--shadow-xl` - Large shadow
- `--shadow-2xl` - Extra large shadow

### Transitions
- `--transition-fast: 0.15s ease` - Quick interactions
- `--transition-base: 0.3s ease` - Standard transitions
- `--transition-slow: 0.5s ease` - Slower animations

## 🎯 Best Practices

### CSS Architecture
1. **Global First**: Use global styles whenever possible
2. **Module Specific**: Only add module-specific styles for unique requirements
3. **Custom Properties**: Use CSS custom properties for theming
4. **Scoped Selectors**: Scope module styles to prevent conflicts

### Example Module CSS Structure
```css
/* Module Theme Variables */
.tab-content#module-content {
    --module-primary: #color;
    --module-accent: #color;
    --module-bg: rgba(color, 0.05);
}

/* Module-specific component overrides */
#module-content .component {
    /* Use module theme variables */
    background: var(--module-primary);
}

/* Module-specific animations/interactions */
#module-content .interactive-element:hover {
    /* Module-specific hover states */
}
```

### Naming Conventions
- Use semantic class names: `.status-badge`, `.stat-card`
- Module prefixes when needed: `#bill-content`, `#debt-content`
- Consistent state classes: `.active`, `.disabled`, `.loading`

## 🚀 Adding New Modules

1. **Use Global Components**: Leverage existing stat cards, buttons, status badges
2. **Define Module Theme**: Set custom properties in module CSS
3. **Minimal Overrides**: Only override what's absolutely necessary
4. **Test Consistency**: Ensure visual harmony with existing modules

## 📱 Responsive Design

All components are built mobile-first with responsive breakpoints:
- Mobile: `< 768px`
- Tablet: `768px - 1024px`
- Desktop: `> 1024px`

Use utility classes and design tokens for consistent responsive behavior.

---

This design system ensures the Kasa Kolawole application maintains visual consistency while allowing for module-specific customization and branding.