# Restaurant KOT System - Design System Guide

## Quick Reference for Developers

### 1. Colors

```jsx
// Primary (Blue)
className="bg-primary-600 text-white"
className="text-primary-600"

// Secondary (Emerald)
className="bg-secondary-600 text-white"
className="text-secondary-600"

// Accent (Amber)
className="bg-accent-600 text-white"

// Status Colors
className="bg-success-DEFAULT"      // Green
className="bg-processing-DEFAULT"  // Yellow
className="bg-error-DEFAULT"        // Red
className="bg-info-DEFAULT"         // Blue
className="bg-offline-DEFAULT"      // Gray
className="bg-ready-DEFAULT"        // Emerald
className="bg-pending-DEFAULT"      // Orange
```

### 2. Typography

```jsx
// Headings
<h1 className="text-4xl font-bold">Heading 1</h1>
<h2 className="text-3xl font-bold">Heading 2</h2>

// Body Text
<p className="text-base text-text-secondary">Body text</p>
<span className="text-sm text-text-tertiary">Small text</span>
```

### 3. Cards

```jsx
// Basic Card
<div className="card">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>

// Interactive Card
<div className="card card-interactive">
  Clickable card
</div>

// Elevated Card
<div className="card card-elevated">
  Prominent card
</div>
```

### 4. Buttons

```jsx
// Primary Button
<button className="btn btn-primary">Primary</button>

// Secondary Button
<button className="btn btn-secondary">Secondary</button>

// Ghost Button
<button className="btn btn-ghost">Ghost</button>

// Destructive Button
<button className="btn btn-destructive">Delete</button>

// Button Sizes
<button className="btn btn-primary btn-sm">Small</button>
<button className="btn btn-primary btn-lg">Large</button>

// Button with Icon
<button className="btn btn-primary">
  <svg className="btn-icon">...</svg>
  Click Me
</button>

// Loading Button
<button className="btn btn-primary btn-loading">Loading...</button>
```

### 5. Form Elements

```jsx
// Input Field
<label className="label">Email</label>
<input type="email" className="input" placeholder="Enter email" />

// Input with Error
<input type="text" className="input input-error" />

// Input with Success
<input type="text" className="input input-success" />

// Select Dropdown
<select className="select">
  <option>Choose option</option>
</select>

// Checkbox
<input type="checkbox" className="checkbox" />

// Radio Button
<input type="radio" className="radio" />

// Toggle Switch
<label className="toggle">
  <input type="checkbox" />
  <span className="toggle-slider"></span>
</label>

// Error Message
<div className="error-message">
  <svg>...</svg>
  Error message here
</div>
```

### 6. Status Badges

```jsx
// Success Badge
<span className="badge badge-success">
  <span className="badge-dot"></span>
  Success
</span>

// Pending Badge
<span className="badge badge-pending">Pending</span>

// Processing Badge
<span className="badge badge-processing">Processing</span>

// Ready Badge
<span className="badge badge-ready">Ready</span>

// Error Badge
<span className="badge badge-error">Error</span>

// Offline Badge
<span className="badge badge-offline">Offline</span>
```

### 7. Tables

```jsx
<div className="table-wrapper">
  <table className="table">
    <thead>
      <tr>
        <th className="table-sortable">
          Name
          <span className="table-sort-icon">↑</span>
        </th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Item 1</td>
        <td><span className="badge badge-success">Active</span></td>
      </tr>
    </tbody>
  </table>
</div>
```

### 8. Modals

```jsx
<div className="modal-overlay">
  <div className="modal-content">
    <div className="modal-header">
      <h2 className="modal-title">Modal Title</h2>
      <button className="modal-close">×</button>
    </div>
    <div className="modal-body">
      Modal content here
    </div>
    <div className="modal-footer">
      <button className="btn btn-secondary">Cancel</button>
      <button className="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

### 9. Toast Notifications

```jsx
// Success Toast
<div className="toast toast-success toast-top-right">
  <svg className="toast-icon">...</svg>
  <div className="toast-content">
    <p className="toast-title">Success!</p>
    <p className="toast-message">Operation completed</p>
  </div>
  <button className="toast-close">×</button>
</div>

// Error Toast
<div className="toast toast-error toast-top-right">...</div>

// Warning Toast
<div className="toast toast-warning toast-top-right">...</div>

// Info Toast
<div className="toast toast-info toast-top-right">...</div>
```

### 10. Navigation

```jsx
// Nav Link
<a className="nav-link">Dashboard</a>

// Active Nav Link
<a className="nav-link nav-link-active">Dashboard</a>

// Sidebar Nav Item
<button className="sidebar-nav-item">Menu</button>

// Active Sidebar Item
<button className="sidebar-nav-item sidebar-nav-item-active">Menu</button>
```

### 11. Charts

```jsx
<div className="chart-container">
  <h3 className="chart-title">Sales Report</h3>
  <div className="chart-placeholder">
    Chart will render here
  </div>
  <div className="chart-legend">
    <div className="chart-legend-item">
      <span className="chart-legend-color bg-primary-600"></span>
      Sales
    </div>
  </div>
</div>
```

### 12. Skeleton Loaders

```jsx
// Card Skeleton
<div className="skeleton-card"></div>

// Text Skeleton
<div className="skeleton-text w-3/4"></div>

// Title Skeleton
<div className="skeleton-title"></div>

// Avatar Skeleton
<div className="skeleton-avatar"></div>
```

### 13. Animations

```jsx
// Fade In
<div className="animate-fade-in">Content</div>

// Slide In
<div className="animate-slide-in">Content</div>

// Slide Up
<div className="animate-slide-up">Content</div>

// Scale Up
<div className="animate-scale-up">Content</div>

// Shimmer (for loading)
<div className="animate-shimmer">Loading...</div>
```

### 14. Layout

```jsx
// Container
<div className="container-custom">Content</div>

// Section
<section className="section">Content</section>

// Responsive Grid
<div className="grid-responsive">
  <div className="card">Item 1</div>
  <div className="card">Item 2</div>
</div>
```

### 15. Utilities

```jsx
// Gradient Text
<h1 className="gradient-text">Gradient Title</h1>

// Glass Effect
<div className="glass-effect">Glass card</div>

// Divider
<div className="divider"></div>

// Vertical Divider
<div className="divider-vertical"></div>
```

## Color Palette Reference

### Primary (Blue)
- `primary-50` to `primary-950`
- Main: `primary-600` (#2563eb)

### Secondary (Emerald)
- `secondary-50` to `secondary-950`
- Main: `secondary-600` (#059669)

### Accent (Amber)
- `accent-50` to `accent-950`
- Main: `accent-600` (#d97706)

### Status Colors
- Success: `success-DEFAULT` (#10b981)
- Processing: `processing-DEFAULT` (#f59e0b)
- Error: `error-DEFAULT` (#ef4444)
- Info: `info-DEFAULT` (#3b82f6)
- Offline: `offline-DEFAULT` (#6b7280)
- Ready: `ready-DEFAULT` (#10b981)
- Pending: `pending-DEFAULT` (#f97316)

## Best Practices

1. **Always use design system classes** instead of custom CSS
2. **Follow the spacing scale** (p-2, p-4, p-6, p-8)
3. **Use semantic color names** (success, error, etc.)
4. **Maintain consistency** across all pages
5. **Test responsive behavior** on mobile, tablet, desktop
6. **Use animations sparingly** for better performance

## Dark Mode

Add `dark` class to parent element to enable dark mode:

```jsx
<div className="dark">
  <div className="card">Dark mode card</div>
</div>
```

