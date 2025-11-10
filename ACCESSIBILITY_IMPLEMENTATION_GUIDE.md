# ♿ ACCESSIBILITY IMPLEMENTATION GUIDE

This guide explains accessibility improvements implemented and how to use them throughout the application.

---

## 📊 ACCESSIBILITY GOALS

- ✅ WCAG 2.1 Level AA Compliance
- ✅ Full keyboard navigation
- ✅ Screen reader support
- ✅ Reduced motion support
- ✅ High contrast mode support
- ✅ 200% zoom support

---

## 🎹 KEYBOARD SHORTCUTS

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Focus search |
| `N` | Add new job |
| `L` | Open activity logs |
| `A` | Open AI summary |
| `T` | Toggle theme |
| `?` | Show keyboard shortcuts help |
| `Esc` | Close modal/dialog |
| `Ctrl/Cmd + Enter` | Submit form (in modals) |

### Navigation

| Shortcut | Action |
|----------|--------|
| `Tab` | Next interactive element |
| `Shift + Tab` | Previous interactive element |
| `Enter` | Activate button/link |
| `Space` | Toggle checkbox/button |
| `Arrow Keys` | Navigate dropdown menus |

---

## 🛠️ IMPLEMENTATION EXAMPLES

### 1. Dashboard with Keyboard Shortcuts

```jsx
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

function Dashboard({ onLogout }) {
  const [showJobForm, setShowJobForm] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showAISummary, setShowAISummary] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const searchInputRef = useRef(null);

  // Define keyboard shortcuts
  useKeyboardShortcuts({
    'n': () => setShowJobForm(true),
    'l': () => setShowLogs(true),
    'a': () => setShowAISummary(true),
    't': () => toggleTheme(),
    '?': () => setShowHelp(true),
    'escape': () => {
      setShowJobForm(false);
      setShowLogs(false);
      setShowAISummary(false);
      setShowHelp(false);
    },
    'ctrl+k': () => searchInputRef.current?.focus()
  });

  return (
    <div className="dashboard">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-blue-600 focus:text-white"
      >
        Skip to main content
      </a>

      <header role="banner">
        {/* Header content with ARIA labels */}
        <button
          onClick={() => setShowJobForm(true)}
          aria-label="Add new job application (Keyboard shortcut: N)"
          aria-describedby="add-job-help"
        >
          <Plus aria-hidden="true" />
          Add Job
        </button>
        <span id="add-job-help" className="sr-only">
          Opens a form to create a new job application entry
        </span>
      </header>

      <main id="main-content" role="main" aria-label="Job applications">
        {/* Main content */}
      </main>

      {showHelp && <KeyboardShortcutsHelp onClose={() => setShowHelp(false)} />}
    </div>
  );
}
```

### 2. Accessible Modal with Focus Trap

```jsx
import { useFocusTrap } from '../hooks/useKeyboardShortcuts';
import { useRef, useEffect } from 'react';

function JobFormModal({ onClose, onSave }) {
  const modalRef = useRef(null);

  // Trap focus within modal
  useFocusTrap(modalRef, true);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="job-form-title"
      aria-describedby="job-form-description"
      ref={modalRef}
      className="modal-overlay"
      onClick={(e) => {
        // Only close if clicking overlay, not content
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="modal-content">
        <h2 id="job-form-title">Add New Job Application</h2>
        <p id="job-form-description" className="sr-only">
          Fill out the form below to add a new job application to your tracker
        </p>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="company-name">
              Company Name <span aria-label="required">*</span>
            </label>
            <input
              id="company-name"
              type="text"
              required
              aria-required="true"
              aria-invalid={errors.company ? 'true' : 'false'}
              aria-describedby={errors.company ? 'company-error' : undefined}
            />
            {errors.company && (
              <div id="company-error" role="alert" className="error">
                {errors.company}
              </div>
            )}
          </div>

          <div className="button-group" role="group" aria-label="Form actions">
            <button type="submit" aria-label="Save job application">
              Save
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cancel and close form"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 3. Status Pills with ARIA Labels

```jsx
function StatusPill({ value, onChange }) {
  const mood = getStatusMood(value);
  const statusId = `status-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="status-pill-container">
      <span
        id={statusId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={`status-pill status-${mood}`}
      >
        {renderStatusIcon(value)}
        <span>{value}</span>
      </span>

      <label htmlFor={`${statusId}-select`} className="sr-only">
        Change status from {value}
      </label>
      <select
        id={`${statusId}-select`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-labelledby={statusId}
        aria-describedby={`${statusId}-help`}
      >
        {statusOptions.map(option => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <span id={`${statusId}-help`} className="sr-only">
        Select a new status from the dropdown menu
      </span>
    </div>
  );
}
```

### 4. Reduced Motion Implementation

```jsx
import { useMotionConfig, useReducedMotion } from '../hooks/useReducedMotion';
import { motion } from 'framer-motion';

function JobCard({ job }) {
  const prefersReducedMotion = useReducedMotion();

  // Simplified animation for reduced motion
  const cardAnimation = useMotionConfig(
    {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, scale: 0.9 },
      transition: { duration: 0.3 }
    },
    {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.1 }
    }
  );

  return (
    <motion.div
      {...cardAnimation}
      className="job-card"
    >
      {/* Card content */}
    </motion.div>
  );
}
```

### 5. Keyboard Shortcuts Help Modal

```jsx
function KeyboardShortcutsHelp({ onClose }) {
  const modalRef = useRef(null);
  useFocusTrap(modalRef, true);

  const shortcuts = [
    { key: 'N', description: 'Add new job application' },
    { key: 'L', description: 'View activity logs' },
    { key: 'A', description: 'Open AI summary' },
    { key: 'T', description: 'Toggle dark/light theme' },
    { key: 'Ctrl/Cmd + K', description: 'Focus search box' },
    { key: 'Esc', description: 'Close modal or dialog' },
    { key: '?', description: 'Show this help menu' }
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      ref={modalRef}
      className="modal-overlay"
    >
      <div className="modal-content">
        <header>
          <h2 id="shortcuts-title">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            aria-label="Close keyboard shortcuts help"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <table role="table" aria-label="Keyboard shortcuts reference">
          <thead>
            <tr>
              <th scope="col">Shortcut</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {shortcuts.map((shortcut, index) => (
              <tr key={index}>
                <td>
                  <kbd className="keyboard-key">{shortcut.key}</kbd>
                </td>
                <td>{shortcut.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

---

## 🎨 CSS FOR ACCESSIBILITY

Add these utility classes to your CSS:

```css
/* Screen reader only - visually hidden but accessible */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Show on focus (for skip links) */
.sr-only:focus,
.sr-only:active {
  position: static;
  width: auto;
  height: auto;
  overflow: visible;
  clip: auto;
  white-space: normal;
}

/* Focus indicators */
*:focus-visible {
  outline: 2px solid #4f46e5; /* Purple-600 */
  outline-offset: 2px;
  border-radius: 4px;
}

/* High contrast keyboard keys */
kbd {
  background: #1f2937;
  color: #f9fafb;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-family: monospace;
  font-size: 0.875rem;
  border: 1px solid #374151;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  :root {
    --border-width: 2px;
    --outline-width: 3px;
  }

  button,
  a,
  input,
  select,
  textarea {
    border-width: var(--border-width);
  }
}

/* Focus ring for dark mode */
.dark *:focus-visible {
  outline-color: #818cf8; /* Purple-400 */
}
```

---

## ✅ ACCESSIBILITY CHECKLIST

### ARIA Implementation:
- ✅ All interactive elements have accessible names
- ✅ Form inputs have associated labels
- ✅ Error messages use `role="alert"`
- ✅ Modals use `role="dialog"` and `aria-modal="true"`
- ✅ Live regions for dynamic content (`aria-live`)
- ✅ Hidden decorative icons (`aria-hidden="true"`)
- ✅ Descriptive IDs linked with `aria-describedby`
- ✅ Required fields marked with `aria-required`
- ✅ Invalid fields marked with `aria-invalid`

### Keyboard Navigation:
- ✅ All functionality accessible via keyboard
- ✅ Logical tab order
- ✅ Focus trap in modals
- ✅ Escape key closes modals
- ✅ Enter/Space activate buttons
- ✅ Arrow keys navigate dropdowns
- ✅ Skip links for main content
- ✅ Visible focus indicators

### Visual Accessibility:
- ✅ Color contrast ratio ≥ 4.5:1 (WCAG AA)
- ✅ Focus indicators visible
- ✅ Text readable at 200% zoom
- ✅ No information conveyed by color alone
- ✅ Sufficient touch target sizes (44x44px minimum)

### Motion & Animation:
- ✅ Respects `prefers-reduced-motion`
- ✅ No auto-playing videos
- ✅ No flashing content (seizure risk)
- ✅ Animations can be disabled

### Screen Reader Support:
- ✅ Semantic HTML (header, main, nav, footer)
- ✅ Headings in logical order (h1 → h2 → h3)
- ✅ Alt text for images
- ✅ Form labels properly associated
- ✅ Error messages announced
- ✅ Status changes announced

---

## 🧪 TESTING TOOLS

### Automated Testing:
- **aXe DevTools** (Chrome extension)
- **Lighthouse** (Chrome DevTools)
- **WAVE** (Browser extension)
- **Pa11y** (Command line)

### Manual Testing:
- **Keyboard only navigation**
- **Screen reader testing** (NVDA, JAWS, VoiceOver)
- **Zoom testing** (200%, 400%)
- **Color blindness simulation** (Chrome DevTools)

### Test Commands:
```bash
# Install pa11y
npm install -g pa11y

# Run accessibility audit
pa11y http://localhost:5173

# Run Lighthouse
lighthouse http://localhost:5173 --view
```

---

## 📝 WCAG 2.1 AA COMPLIANCE

### Level A (Must Have):
- ✅ 1.1.1 Non-text Content
- ✅ 1.3.1 Info and Relationships
- ✅ 2.1.1 Keyboard
- ✅ 2.1.2 No Keyboard Trap
- ✅ 2.4.1 Bypass Blocks (Skip links)
- ✅ 2.4.2 Page Titled
- ✅ 3.1.1 Language of Page
- ✅ 3.2.1 On Focus
- ✅ 3.2.2 On Input
- ✅ 3.3.1 Error Identification
- ✅ 4.1.1 Parsing
- ✅ 4.1.2 Name, Role, Value

### Level AA (Should Have):
- ✅ 1.4.3 Contrast (Minimum)
- ✅ 1.4.5 Images of Text
- ✅ 2.4.6 Headings and Labels
- ✅ 2.4.7 Focus Visible
- ✅ 3.1.2 Language of Parts
- ✅ 3.2.3 Consistent Navigation
- ✅ 3.2.4 Consistent Identification
- ✅ 3.3.3 Error Suggestion
- ✅ 3.3.4 Error Prevention

---

## 🎓 RESOURCES

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

---

**Last Updated:** 2025-11-09
**Version:** 2.0.0
