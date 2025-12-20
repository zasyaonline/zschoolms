# ZSchool Management System - Comprehensive Testing Plan
**Version:** 1.0  
**Date:** December 20, 2025  
**Target Coverage:** 80%

---

## Table of Contents
1. [Testing Infrastructure Setup](#1-testing-infrastructure-setup)
2. [Unit Testing Strategy](#2-unit-testing-strategy)
3. [Integration Testing](#3-integration-testing)
4. [E2E Testing](#4-e2e-testing)
5. [Accessibility Testing](#5-accessibility-testing)
6. [Performance Testing](#6-performance-testing)
7. [Security Testing](#7-security-testing)
8. [Test Execution Plan](#8-test-execution-plan)

---

## 1. Testing Infrastructure Setup

### Phase 1: Install Dependencies (30 minutes)

```bash
# Testing framework and tools
npm install -D vitest @vitest/ui jsdom @vitest/coverage-v8

# React testing utilities
npm install -D @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event

# E2E testing
npm install -D playwright @playwright/test

# Accessibility testing
npm install -D jest-axe axe-core

# Visual regression testing
npm install -D @chromatic-com/storybook

# Code quality
npm install -D eslint-plugin-testing-library \
  eslint-plugin-jest-dom
```

### Phase 2: Configuration Files (15 minutes)

**vitest.config.js**
```javascript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.config.js',
        '**/main.jsx'
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80
      }
    }
  }
})
```

**src/test/setup.js**
```javascript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
```

**playwright.config.js**
```javascript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
})
```

### Phase 3: Update package.json (5 minutes)

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:debug": "playwright test --debug",
    
    "test:all": "npm run lint && npm run test:coverage && npm run test:e2e"
  }
}
```

---

## 2. Unit Testing Strategy

### Test Priority Matrix
| Priority | Component Type | Coverage Target | Effort |
|----------|---------------|-----------------|--------|
| P0 | Utilities/Helpers | 100% | Low |
| P1 | Shared Components | 90% | Medium |
| P2 | Page Components | 80% | High |
| P3 | Layout Components | 70% | Low |

### 2.1 Utility Functions Testing

**src/utils/validation.test.js**
```javascript
import { describe, it, expect } from 'vitest'
import { 
  validateEmail, 
  validatePhone, 
  validateStudentId,
  sanitizeInput 
} from './validation'

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('user@example.com')).toBe(true)
      expect(validateEmail('test.user+tag@school.edu')).toBe(true)
    })

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false)
      expect(validateEmail('user@')).toBe(false)
      expect(validateEmail('@example.com')).toBe(false)
    })

    it('should handle edge cases', () => {
      expect(validateEmail('')).toBe(false)
      expect(validateEmail(null)).toBe(false)
      expect(validateEmail(undefined)).toBe(false)
    })
  })

  describe('sanitizeInput', () => {
    it('should remove XSS attempts', () => {
      const malicious = '<script>alert("xss")</script>'
      expect(sanitizeInput(malicious)).not.toContain('<script>')
    })

    it('should preserve safe HTML entities', () => {
      expect(sanitizeInput('Test &amp; more')).toBe('Test & more')
    })
  })
})
```

### 2.2 Component Testing - Shared Components

**src/components/common/ToggleSwitch.test.jsx**
```javascript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ToggleSwitch from './ToggleSwitch'

describe('ToggleSwitch', () => {
  it('renders with label', () => {
    render(<ToggleSwitch label="Active Status" />)
    expect(screen.getByText('Active Status')).toBeInTheDocument()
  })

  it('calls onChange when clicked', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()
    
    render(
      <ToggleSwitch 
        label="Test" 
        checked={false} 
        onChange={handleChange} 
      />
    )

    const toggle = screen.getByRole('switch')
    await user.click(toggle)

    expect(handleChange).toHaveBeenCalledWith(true)
    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<ToggleSwitch label="Test" disabled={true} />)
    const toggle = screen.getByRole('switch')
    expect(toggle).toBeDisabled()
  })

  it('matches snapshot', () => {
    const { container } = render(
      <ToggleSwitch label="Test" checked={true} />
    )
    expect(container).toMatchSnapshot()
  })
})
```

### 2.3 Page Component Testing

**src/pages/UserManagement/UserList.test.jsx**
```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import UserList from './UserList'

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('UserList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders user list table', () => {
    renderWithRouter(<UserList />)
    expect(screen.getByText('User List')).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('filters users by search query', async () => {
    const user = userEvent.setup()
    renderWithRouter(<UserList />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    await user.type(searchInput, 'John')

    await waitFor(() => {
      const rows = screen.getAllByRole('row')
      expect(rows.length).toBeGreaterThan(0)
    })
  })

  it('opens add user modal on button click', async () => {
    const user = userEvent.setup()
    renderWithRouter(<UserList />)

    const addButton = screen.getByRole('button', { name: /add new user/i })
    await user.click(addButton)

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/add new user/i)).toBeInTheDocument()
  })

  it('exports CSV when export button clicked', async () => {
    const user = userEvent.setup()
    const downloadSpy = vi.spyOn(document, 'createElement')
    
    renderWithRouter(<UserList />)

    const exportButton = screen.getByRole('button', { name: /export csv/i })
    await user.click(exportButton)

    expect(downloadSpy).toHaveBeenCalledWith('a')
  })
})
```

### 2.4 Hook Testing

**src/hooks/useForm.test.js**
```javascript
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useForm } from './useForm'

describe('useForm', () => {
  const initialValues = {
    email: '',
    password: ''
  }

  const validationRules = {
    email: (value) => !value ? 'Email required' : null,
    password: (value) => value.length < 6 ? 'Min 6 chars' : null
  }

  it('initializes with default values', () => {
    const { result } = renderHook(() => useForm(initialValues))
    expect(result.current.values).toEqual(initialValues)
    expect(result.current.errors).toEqual({})
  })

  it('updates field values', () => {
    const { result } = renderHook(() => useForm(initialValues))

    act(() => {
      result.current.handleChange('email', 'test@example.com')
    })

    expect(result.current.values.email).toBe('test@example.com')
  })

  it('validates fields on submit', async () => {
    const { result } = renderHook(() => 
      useForm(initialValues, validationRules)
    )

    await act(async () => {
      await result.current.handleSubmit()
    })

    expect(result.current.errors.email).toBe('Email required')
    expect(result.current.errors.password).toBe('Min 6 chars')
  })
})
```

---

## 3. Integration Testing

### 3.1 Form Submission Flow

**src/pages/SystemConfiguration/StudentList.integration.test.jsx**
```javascript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import StudentList from './StudentList'

describe('Student Management Integration', () => {
  it('completes full student creation flow', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <StudentList />
      </BrowserRouter>
    )

    // 1. Open add modal
    await user.click(screen.getByRole('button', { name: /add new student/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    // 2. Fill form
    await user.type(screen.getByLabelText(/full name/i), 'John Doe')
    await user.type(screen.getByLabelText(/student id/i), 'STU001')
    await user.type(screen.getByLabelText(/date of birth/i), '2010-01-01')
    await user.type(screen.getByLabelText(/grade/i), '10A')

    // 3. Submit form
    await user.click(screen.getByRole('button', { name: /save/i }))

    // 4. Verify success
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })
  })

  it('handles validation errors', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <StudentList />
      </BrowserRouter>
    )

    await user.click(screen.getByRole('button', { name: /add new student/i }))
    await user.click(screen.getByRole('button', { name: /save/i }))

    await waitFor(() => {
      expect(screen.getByText(/full name is required/i)).toBeInTheDocument()
    })
  })
})
```

### 3.2 Navigation Testing

**src/navigation.integration.test.jsx**
```javascript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import App from './App'

describe('Navigation Integration', () => {
  it('navigates through sidebar menu', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <App />
      </BrowserRouter>
    )

    // Click Students menu
    const studentsMenu = screen.getByText('Students')
    await user.click(studentsMenu)

    // Click Student List
    const studentList = screen.getByText('Student List')
    await user.click(studentList)

    // Verify navigation
    await waitFor(() => {
      expect(screen.getByText(/student list/i)).toBeInTheDocument()
    })
  })
})
```

---

## 4. E2E Testing

### 4.1 Critical User Journeys

**e2e/student-management.spec.js**
```javascript
import { test, expect } from '@playwright/test'

test.describe('Student Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Add login steps when auth is implemented
  })

  test('admin can add new student', async ({ page }) => {
    // Navigate to Students
    await page.click('text=Students')
    await page.click('text=Student List')

    // Open add modal
    await page.click('button:has-text("Add New Student")')
    await expect(page.locator('role=dialog')).toBeVisible()

    // Fill form
    await page.fill('input[name="fullName"]', 'Jane Smith')
    await page.fill('input[name="studentId"]', 'STU002')
    await page.fill('input[name="dateOfBirth"]', '2010-05-15')
    await page.selectOption('select[name="grade"]', '9A')
    await page.fill('input[name="guardianName"]', 'Robert Smith')
    await page.fill('textarea[name="address"]', '123 Main St')
    await page.fill('input[name="contact"]', '+1234567890')

    // Submit
    await page.click('button:has-text("Save")')

    // Verify success
    await expect(page.locator('text=Jane Smith')).toBeVisible()
  })

  test('teacher can enter marks', async ({ page }) => {
    await page.click('text=Teacher Portal')
    await page.click('text=Marks Entry')

    await page.selectOption('select[name="grade"]', '9A')
    await page.selectOption('select[name="subject"]', 'Mathematics')

    // Enter marks for first student
    const firstMarkInput = page.locator('input[type="number"]').first()
    await firstMarkInput.fill('85')

    // Submit
    await page.click('button:has-text("Submit Marks")')

    // Verify success message
    await expect(page.locator('text=Marks submitted successfully')).toBeVisible()
  })

  test('student can view profile', async ({ page }) => {
    await page.click('text=Students')
    await page.click('text=Basic Profile')

    // Verify tabs
    await expect(page.locator('text=Basic Info')).toBeVisible()
    await expect(page.locator('text=Attendance Summary')).toBeVisible()
    await expect(page.locator('text=Marks History')).toBeVisible()

    // Switch tabs
    await page.click('text=Attendance Summary')
    await expect(page.locator('.student-profile__calendar')).toBeVisible()

    await page.click('text=Marks History')
    await expect(page.locator('.student-profile__marks-table')).toBeVisible()
  })
})
```

### 4.2 Cross-Browser Testing

**e2e/cross-browser.spec.js**
```javascript
import { test, expect, devices } from '@playwright/test'

const testDevices = [
  { name: 'Desktop Chrome', device: devices['Desktop Chrome'] },
  { name: 'Desktop Firefox', device: devices['Desktop Firefox'] },
  { name: 'Desktop Safari', device: devices['Desktop Safari'] },
  { name: 'Mobile Chrome', device: devices['Pixel 5'] },
  { name: 'Mobile Safari', device: devices['iPhone 12'] },
]

testDevices.forEach(({ name, device }) => {
  test.use(device)

  test(`renders correctly on ${name}`, async ({ page }) => {
    await page.goto('/')
    
    // Verify layout
    await expect(page.locator('.layout__sidebar')).toBeVisible()
    await expect(page.locator('.header')).toBeVisible()
    
    // Check responsiveness
    const viewport = page.viewportSize()
    if (viewport.width < 768) {
      // Mobile: sidebar should be hidden initially
      await expect(page.locator('.layout__sidebar')).toHaveCSS('transform', 'translateX(-100%)')
    }
  })
})
```

---

## 5. Accessibility Testing

### 5.1 Automated Accessibility Tests

**src/test/accessibility.test.jsx**
```javascript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { BrowserRouter } from 'react-router-dom'
import UserList from './pages/UserManagement/UserList'
import StudentProfile from './pages/TeacherFlow/StudentProfile'

expect.extend(toHaveNoViolations)

describe('Accessibility Tests', () => {
  it('UserList has no accessibility violations', async () => {
    const { container } = render(
      <BrowserRouter>
        <UserList />
      </BrowserRouter>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('StudentProfile has no accessibility violations', async () => {
    const { container } = render(
      <BrowserRouter>
        <StudentProfile />
      </BrowserRouter>
    )
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

### 5.2 Keyboard Navigation Tests

**e2e/keyboard-navigation.spec.js**
```javascript
import { test, expect } from '@playwright/test'

test.describe('Keyboard Navigation', () => {
  test('can navigate entire app with keyboard', async ({ page }) => {
    await page.goto('/')

    // Tab through navigation
    await page.keyboard.press('Tab')
    let focused = await page.locator(':focus')
    await expect(focused).toHaveAttribute('role', 'link')

    // Open menu with Enter
    await page.keyboard.press('Enter')

    // Navigate dropdown with arrow keys
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    // Verify navigation occurred
    await expect(page).toHaveURL(/\/students/)
  })

  test('modal traps focus', async ({ page }) => {
    await page.goto('/students')
    await page.click('button:has-text("Add New Student")')

    // Focus should be in modal
    await page.keyboard.press('Tab')
    const focused = await page.locator(':focus')
    const modal = await page.locator('role=dialog')
    
    const isInModal = await focused.evaluate((el, modalEl) => {
      return modalEl.contains(el)
    }, await modal.elementHandle())

    expect(isInModal).toBe(true)

    // Escape closes modal
    await page.keyboard.press('Escape')
    await expect(modal).not.toBeVisible()
  })
})
```

---

## 6. Performance Testing

### 6.1 Bundle Size Monitoring

**scripts/check-bundle-size.js**
```javascript
import { readFileSync } from 'fs'
import { gzipSync } from 'zlib'

const MAX_BUNDLE_SIZE = 250 * 1024 // 250KB
const MAX_CSS_SIZE = 50 * 1024 // 50KB

const checkSize = (file, maxSize, type) => {
  const content = readFileSync(file)
  const gzipped = gzipSync(content)
  const size = gzipped.length

  console.log(`${type}: ${(size / 1024).toFixed(2)} KB (gzipped)`)

  if (size > maxSize) {
    console.error(`❌ ${type} exceeds maximum size of ${maxSize / 1024}KB`)
    process.exit(1)
  } else {
    console.log(`✅ ${type} size OK`)
  }
}

// Run checks
checkSize('dist/assets/index-*.js', MAX_BUNDLE_SIZE, 'JavaScript')
checkSize('dist/assets/index-*.css', MAX_CSS_SIZE, 'CSS')
```

### 6.2 Lighthouse CI

**.lighthouserc.json**
```json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run preview",
      "url": [
        "http://localhost:4173/",
        "http://localhost:4173/students",
        "http://localhost:4173/teacher/student-profile"
      ],
      "numberOfRuns": 3
    },
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

---

## 7. Security Testing

### 7.1 OWASP Security Checklist

**security-tests/xss.spec.js**
```javascript
import { test, expect } from '@playwright/test'

test.describe('XSS Protection', () => {
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert("xss")>',
    'javascript:alert("xss")',
    '<svg onload=alert("xss")>',
  ]

  xssPayloads.forEach((payload) => {
    test(`blocks XSS attempt: ${payload}`, async ({ page }) => {
      await page.goto('/students')
      await page.click('button:has-text("Add New Student")')

      await page.fill('input[name="fullName"]', payload)
      await page.click('button:has-text("Save")')

      // Verify script did not execute
      const alerts = []
      page.on('dialog', dialog => {
        alerts.push(dialog.message())
        dialog.dismiss()
      })

      await page.waitForTimeout(1000)
      expect(alerts).toHaveLength(0)

      // Verify payload is sanitized
      const displayedName = await page.textContent('text=' + payload)
      expect(displayedName).not.toContain('<script')
    })
  })
})
```

### 7.2 Input Validation Tests

**src/utils/validation.test.js**
```javascript
import { describe, it, expect } from 'vitest'
import { sanitizeInput, validateStudentId } from './validation'

describe('Security - Input Validation', () => {
  describe('SQL Injection Prevention', () => {
    it('escapes SQL injection attempts', () => {
      const malicious = "'; DROP TABLE students;--"
      const sanitized = sanitizeInput(malicious)
      expect(sanitized).not.toContain('DROP TABLE')
      expect(sanitized).not.toContain(';--')
    })
  })

  describe('Path Traversal Prevention', () => {
    it('blocks directory traversal', () => {
      const malicious = '../../../etc/passwd'
      expect(validateStudentId(malicious)).toBe(false)
    })
  })

  describe('Command Injection Prevention', () => {
    it('blocks command injection', () => {
      const malicious = 'test; rm -rf /'
      const sanitized = sanitizeInput(malicious)
      expect(sanitized).not.toContain('rm -rf')
    })
  })
})
```

---

## 8. Test Execution Plan

### Week 1: Foundation (40 hours)

#### Day 1-2: Setup (16h)
- ✅ Install all testing dependencies
- ✅ Configure Vitest, Playwright, ESLint
- ✅ Create test utilities and helpers
- ✅ Write example tests for reference

#### Day 3-4: Unit Tests - Utilities (16h)
- ✅ Test validation functions (100% coverage)
- ✅ Test formatting functions
- ✅ Test date utilities
- ✅ Test calculation helpers

#### Day 5: Unit Tests - Hooks (8h)
- ✅ Test useForm hook
- ✅ Test usePagination hook
- ✅ Test useDebounce hook

### Week 2: Component Testing (40 hours)

#### Day 1-2: Shared Components (16h)
- ✅ ToggleSwitch (full coverage)
- ✅ Modal components
- ✅ Form inputs
- ✅ Buttons

#### Day 3-5: Page Components (24h)
- ✅ UserList (80% coverage)
- ✅ StudentList (80% coverage)
- ✅ StudentProfile (80% coverage)
- ✅ MarksEntry (80% coverage)
- ✅ AttendanceEntry (80% coverage)

### Week 3: Integration & E2E (40 hours)

#### Day 1-2: Integration Tests (16h)
- ✅ Form submission flows
- ✅ Navigation flows
- ✅ Data loading/updating
- ✅ Error handling

#### Day 3-5: E2E Tests (24h)
- ✅ Critical user journeys (10 tests)
- ✅ Cross-browser testing
- ✅ Mobile testing
- ✅ Performance tests

### Week 4: Specialized Testing (40 hours)

#### Day 1-2: Accessibility (16h)
- ✅ Automated axe tests (all pages)
- ✅ Keyboard navigation tests
- ✅ Screen reader testing
- ✅ Color contrast validation

#### Day 3: Performance (8h)
- ✅ Bundle size checks
- ✅ Lighthouse CI setup
- ✅ Load time testing
- ✅ Memory leak detection

#### Day 4: Security (8h)
- ✅ XSS protection tests
- ✅ CSRF protection tests
- ✅ Input validation tests
- ✅ Authentication tests

#### Day 5: CI/CD Integration (8h)
- ✅ GitHub Actions setup
- ✅ Pre-commit hooks
- ✅ Coverage reporting
- ✅ Test result dashboards

---

## Test Execution Commands

```bash
# Development
npm run test              # Run all unit tests
npm run test:watch        # Watch mode
npm run test:ui           # Interactive UI

# Coverage
npm run test:coverage     # Generate coverage report

# E2E
npm run test:e2e          # Run all E2E tests
npm run test:e2e:ui       # E2E with UI
npm run test:e2e:debug    # Debug mode

# Full Suite
npm run test:all          # Lint + Unit + E2E

# Specific Tests
npm test UserList         # Run specific test file
npm test -- --grep "navigation" # Run tests matching pattern

# CI Mode
npm run test:ci           # Non-interactive, fail fast
```

---

## Success Metrics

### Coverage Targets
- **Unit Tests**: 80% line coverage
- **Integration Tests**: All critical flows covered
- **E2E Tests**: Top 20 user journeys automated
- **Accessibility**: 0 violations on all pages
- **Performance**: Lighthouse score >90 on all metrics

### Quality Gates
Before merging any PR:
- ✅ All tests pass
- ✅ Coverage meets threshold (80%)
- ✅ No ESLint errors
- ✅ No accessibility violations
- ✅ Bundle size within limits

### Timeline Summary
- **Week 1**: Foundation + Unit tests (Utilities/Hooks)
- **Week 2**: Component tests (Shared + Pages)
- **Week 3**: Integration + E2E tests
- **Week 4**: Specialized testing + CI/CD

**Total Effort**: 160 hours (4 weeks × 40 hours)  
**Team Size**: 2 developers (80 hours each)

---

## Next Steps

1. **Review and approve** this testing plan
2. **Assign resources** (2 developers for 4 weeks)
3. **Start with Week 1** - Setup and utility testing
4. **Daily standups** to track progress
5. **Weekly demos** to stakeholders

**Questions?** Contact the development team.
