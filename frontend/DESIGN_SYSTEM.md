# Restaurant KOT System - Complete Design System

## 🎨 Global UI/UX Design System Documentation

This document provides a complete reference for the Restaurant KOT System design system built with Tailwind CSS.

---

## 📋 Table of Contents

1. [Color Palette](#1-color-palette)
2. [Typography](#2-typography)
3. [Card Design](#3-card-design)
4. [Button Design](#4-button-design)
5. [Form Elements](#5-form-elements)
6. [Layout System](#6-layout-system)
7. [Navigation System](#7-navigation-system)
8. [Table Design](#8-table-design)
9. [Modal System](#9-modal-system)
10. [Notification/Toast System](#10-notificationtoast-system)
11. [Status Badges](#11-status-badges)
12. [Chart Placeholders](#12-chart-placeholders)
13. [Animations](#13-animations)
14. [Dark Mode](#14-dark-mode)
15. [Usage Examples](#15-usage-examples)

---

## 1. Color Palette

### Primary Colors (Blue)
```jsx
bg-primary-50   // Lightest
bg-primary-100
bg-primary-200
bg-primary-300
bg-primary-400
bg-primary-500
bg-primary-600  // Main primary color
bg-primary-700
bg-primary-800
bg-primary-900
bg-primary-950  // Darkest
```

### Secondary Colors (Emerald)
```jsx
bg-secondary-50 to bg-secondary-950
bg-secondary-600  // Main secondary color
```

### Accent Colors (Amber)
```jsx
bg-accent-50 to bg-accent-950
bg-accent-600  // Main accent color
```

### Status Colors
```jsx
// Success (Green)
bg-success-light    // #d1fae5
bg-success-DEFAULT // #10b981
bg-success-dark     // #059669

// Processing (Yellow)
bg-processing-light    // #fef3c7
bg-processing-DEFAULT  // #f59e0b
bg-processing-dark     // #d97706

// Error (Red)
bg-error-light    // #fee2e2
bg-error-DEFAULT  // #ef4444
bg-error-dark     // #dc2626

// Info (Blue)
bg-info-light    // #dbeafe
bg-info-DEFAULT  // #3b82f6
bg-info-dark     // #2563eb

// Offline (Gray)
bg-offline-light    // #f3f4f6
bg-offline-DEFAULT  // #6b7280
bg-offline-dark     // #4b5563

// Ready/Completed (Emerald)
bg-ready-light    // #d1fae5
bg-ready-DEFAULT  // #10b981
bg-ready-dark     // #059669

// Pending (Orange)
bg-pending-light    // #fed7aa
bg-pending-DEFAULT  // #f97316
bg-pending-dark     // #ea580c
```

### Text Colors
```jsx
text-text-primary    // #1e293b
text-text-secondary  // #64748b
text-text-tertiary   // #94a3b8
text-text-inverse    // #ffffff
```

### Background Colors
```jsx
bg-background-light   // #ffffff
bg-background-DEFAULT // #f8fafc
bg-background-dark    // #0f172a
```

### Border Colors
```jsx
border-border-light  // #e2e8f0
border-border-DEFAULT // #cbd5e1
border-border-dark    // #475569
```

---

## 2. Typography

### Font Families
- **Sans**: Inter, Poppins, Outfit (system fallback)
- **Display**: Outfit, Inter
- **Body**: Inter

### Font Sizes
```jsx
text-xs    // 0.75rem
text-sm    // 0.875rem
text-base  // 1rem
text-lg    // 1.125rem
text-xl    // 1.25rem
text-2xl   // 1.5rem
text-3xl   // 1.875rem
text-4xl   // 2.25rem
text-5xl   // 3rem
```

### Font Weights
```jsx
font-normal    // 400
font-medium    // 500
font-semibold  // 600
font-bold      // 700
```

### Usage
```jsx
<h1 className="text-4xl font-bold text-text-primary">Heading 1</h1>
<h2 className="text-3xl font-bold text-text-primary">Heading 2</h2>
<p className="text-base text-text-secondary">Body text</p>
```

---

## 3. Card Design

### Base Card
```jsx
<div className="card">
  <h3>Card Title</h3>
  <p>Card content</p>
</div>
```

**Features:**
- Rounded corners (rounded-xl)
- Soft shadow
- Subtle border
- Smooth hover lift effect
- Fade-in animation on mount

### Card Variants
```jsx
// Elevated Card
<div className="card card-elevated">...</div>

// Interactive Card (clickable)
<div className="card card-interactive">...</div>

// Gradient Card
<div className="card card-gradient">...</div>
```

---

## 4. Button Design

### Button Types

#### Primary Button
```jsx
<button className="btn btn-primary">Primary</button>
```

#### Secondary Button
```jsx
<button className="btn btn-secondary">Secondary</button>
```

#### Ghost Button
```jsx
<button className="btn btn-ghost">Ghost</button>
```

#### Destructive Button
```jsx
<button className="btn btn-destructive">Delete</button>
```

### Button Sizes
```jsx
<button className="btn btn-primary btn-sm">Small</button>
<button className="btn btn-primary">Default</button>
<button className="btn btn-primary btn-lg">Large</button>
```

### Button with Icon
```jsx
<button className="btn btn-primary">
  <svg className="btn-icon">...</svg>
  Click Me
</button>
```

### Loading Button
```jsx
<button className="btn btn-primary btn-loading">Loading...</button>
```

### Button States
- **Hover**: Shadow increase, color darken
- **Active**: Scale down (scale-95)
- **Disabled**: Opacity 50%, no cursor, no transform

---

## 5. Form Elements

### Input Field
```jsx
<label className="label">Email Address</label>
<input type="email" className="input" placeholder="Enter email" />
```

### Input States
```jsx
// Error State
<input className="input input-error" />

// Success State
<input className="input input-success" />

// With Icon
<div className="relative">
  <svg className="absolute left-4 top-1/2 transform -translate-y-1/2">...</svg>
  <input className="input input-icon-left" />
</div>
```

### Select Dropdown
```jsx
<select className="select">
  <option>Choose option</option>
</select>
```

### Checkbox
```jsx
<input type="checkbox" className="checkbox" />
<label>Remember me</label>
```

### Radio Button
```jsx
<input type="radio" className="radio" name="option" />
<label>Option 1</label>
```

### Toggle Switch
```jsx
<label className="toggle">
  <input type="checkbox" />
  <span className="toggle-slider"></span>
</label>
```

### Validation Messages
```jsx
// Error Message
<div className="error-message">
  <svg>...</svg>
  This field is required
</div>

// Success Message
<div className="success-message">
  <svg>...</svg>
  Valid input
</div>
```

---

## 6. Layout System

### Container
```jsx
<div className="container-custom">
  Content here
</div>
```

### Section
```jsx
<section className="section">
  Section content
</section>
```

### Responsive Grid
```jsx
<div className="grid-responsive">
  <div className="card">Item 1</div>
  <div className="card">Item 2</div>
  <div className="card">Item 3</div>
</div>
```

### Spacing Scale
```jsx
spacing-xs  // p-2
spacing-sm  // p-4
spacing-md  // p-6
spacing-lg  // p-8
spacing-xl  // p-12
```

---

## 7. Navigation System

### Nav Link
```jsx
<a className="nav-link">Dashboard</a>
```

### Active Nav Link
```jsx
<a className="nav-link nav-link-active">Dashboard</a>
```

### Sidebar Nav Item
```jsx
<button className="sidebar-nav-item">
  <svg>...</svg>
  Menu
</button>
```

### Active Sidebar Item
```jsx
<button className="sidebar-nav-item sidebar-nav-item-active">
  <svg>...</svg>
  Menu
</button>
```

---

## 8. Table Design

### Basic Table
```jsx
<div className="table-wrapper">
  <table className="table">
    <thead>
      <tr>
        <th>Name</th>
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

### Sortable Column
```jsx
<th className="table-sortable">
  Name
  <span className="table-sort-icon">↑</span>
</th>
```

**Features:**
- Sticky header
- Zebra row pattern (alternating colors)
- Hover highlight
- Sortable column indicators

---

## 9. Modal System

### Basic Modal
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

**Features:**
- Centered modal
- Darkened backdrop with blur
- Smooth fade + scale animation
- Focus trap support

---

## 10. Notification/Toast System

### Toast Positions
```jsx
toast-top-right
toast-top-left
toast-bottom-right
toast-bottom-left
```

### Toast Types
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

**Features:**
- Slide-from-top animation
- Auto-close visual timer (implement in JS)
- Gradient backgrounds
- Backdrop blur

---

## 11. Status Badges

### Badge Types
```jsx
// Success
<span className="badge badge-success">
  <span className="badge-dot"></span>
  Success
</span>

// Pending
<span className="badge badge-pending">Pending</span>

// Processing
<span className="badge badge-processing">Processing</span>

// Ready
<span className="badge badge-ready">Ready</span>

// Error
<span className="badge badge-error">Error</span>

// Offline
<span className="badge badge-offline">Offline</span>

// Info
<span className="badge badge-info">Info</span>
```

**Features:**
- Rounded full shape
- Soft background colors
- Optional dot indicator
- Border for definition

---

## 12. Chart Placeholders

### Chart Container
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
    <div className="chart-legend-item">
      <span className="chart-legend-color bg-secondary-600"></span>
      Revenue
    </div>
  </div>
</div>
```

---

## 13. Animations

### Animation Classes
```jsx
// Fade In
<div className="animate-fade-in">Content</div>

// Slide In (from left)
<div className="animate-slide-in">Content</div>

// Slide Up (from bottom)
<div className="animate-slide-up">Content</div>

// Slide Down (from top)
<div className="animate-slide-down">Content</div>

// Scale Up
<div className="animate-scale-up">Content</div>

// Shimmer (for loading)
<div className="animate-shimmer">Loading...</div>

// Pulse Glow
<div className="animate-pulse-glow">Pulsing</div>
```

### Skeleton Loaders
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

---

## 14. Dark Mode

### Enable Dark Mode
```jsx
// Add 'dark' class to parent element
<div className="dark">
  <div className="card">Dark mode card</div>
  <button className="btn btn-primary">Dark mode button</button>
</div>
```

### Dark Mode Support
All components automatically adapt to dark mode:
- Cards: Dark background with light text
- Inputs: Dark background
- Tables: Dark theme
- Buttons: Adjusted colors

---

## 15. Usage Examples

### Complete Page Example
```jsx
import React from 'react';

const ExamplePage = () => {
  return (
    <div className="container-custom section">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold gradient-text">Page Title</h1>
        <p className="text-text-secondary mt-2">Page description</p>
      </div>

      {/* Cards Grid */}
      <div className="grid-responsive">
        <div className="card card-interactive">
          <h3 className="text-xl font-bold mb-2">Card 1</h3>
          <p className="text-text-secondary">Card content</p>
        </div>
        <div className="card card-interactive">
          <h3 className="text-xl font-bold mb-2">Card 2</h3>
          <p className="text-text-secondary">Card content</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 mt-8">
        <button className="btn btn-primary">Save</button>
        <button className="btn btn-secondary">Cancel</button>
      </div>
    </div>
  );
};

export default ExamplePage;
```

---

## 🚀 Quick Start

1. **Import global CSS** in your main file:
```jsx
import './styles/global.css';
```

2. **Use design system classes** in your components:
```jsx
<button className="btn btn-primary">Click Me</button>
```

3. **Follow the color palette**:
```jsx
<div className="bg-primary-600 text-white">Primary</div>
```

4. **Use responsive classes**:
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

---

## 📝 Notes

- All classes are production-ready
- Mobile-first responsive design
- Consistent spacing and sizing
- Smooth animations and transitions
- Dark mode compatible
- Accessible focus states
- High contrast for readability

---

**Last Updated**: 2024
**Version**: 1.0.0

