# Figma to React Implementation Guide

## Overview
Successfully fetched 6 complete page designs from Figma. All designs use Tailwind CSS and must be converted to custom CSS using the existing variables.css design tokens.

## Fetched Designs (6/29 pages)

### ✅ User Management (2/4 pages)
1. **User List** (node 1163:9737) - Main table with 8 users, toggles, actions
2. **Add New User Modal** (node 1163:10316) - Form with 4 fields + status toggle

### ✅ System Configuration (4/10 pages)
3. **Student List** (node 1163:15057) - Table without status column, 8 students
4. **View Student Details** (node 1163:16910) - Read-only modal with student/guardian/sponsor info
5. **Edit Student** (node 1163:17234) - Editable form with 8 fields
6. **Sponsor-Student Mapping** (node 1163:15308) - Dual-panel interface with multi-select

### ❌ Not Accessible
- Edit User (1163:10608) - Figma API error
- Bulk Upload (1163:9983) - Figma API error
- Add Student (1163:16640) - Figma API error
- Remaining System Config pages (5 pages) - Tool disabled
- All Academic Records (6 pages) - Tool disabled
- All Teacher Flow (6 pages) - Tool disabled
- All Student Flow (3 pages) - Tool disabled

## Asset Management

### Total Assets: ~120 images across 6 designs

**Common Assets (reused across pages):**
- `/public/assets/logos/logoipsum-325.png` - School logo
- `/public/assets/icons/dashboard.svg` - Sidebar icons (Dashboard, Analytics, etc.)
- `/public/assets/icons/settings.svg`
- `/public/assets/icons/logout.svg`
- `/public/assets/icons/search.svg`
- `/public/assets/icons/filter.svg`
- `/public/assets/icons/edit.svg`
- `/public/assets/icons/view.svg`
- `/public/assets/icons/delete.svg`
- `/public/assets/icons/calendar.svg`
- `/public/assets/icons/arrow-down.svg`
- `/public/assets/icons/close.svg`
- `/public/assets/common/divider-line.svg`

**User-specific:**
- `/public/assets/users/avatar-jackson.png` - Header avatar
- `/public/assets/users/avatar-*.png` - User avatars

**Browser Chrome (optional):**
- Window controls, URL bar, navigation icons (can be omitted for actual implementation)

### Asset Download Strategy
All Figma URLs expire in 7 days. Download immediately using:
```bash
cd /Users/zasyaonline/Projects/zschoolms/public/assets
curl -o logos/logoipsum-325.png "https://www.figma.com/api/mcp/asset/..."
# Repeat for all ~120 assets
```

## Tailwind → Custom CSS Conversion Pattern

### Design Tokens Mapping (from variables.css)

**Colors:**
- `bg-[#1f55a6]` → `background: var(--primary-color);`
- `text-white` → `color: var(--black-b0);`
- `bg-[#fafcff]` → `background: var(--bg-light);`
- `border-[#707070]` → `border-color: var(--black-b200);`
- `bg-gradient-to-r from-[#d9e8ff] to-[#ffffff]` → `background: var(--bg-gradient);`

**Typography:**
- `font-['Poppins:Bold',sans-serif] text-[31px]` → `font-family: var(--font-primary); font-size: var(--font-3xl); font-weight: 700;`
- `leading-[1.4]` → `line-height: 1.4;`

**Spacing:**
- `gap-[12px]` → `gap: 12px;`
- `p-[16px]` → `padding: 16px;`
- `rounded-[12px]` → `border-radius: var(--radius-12);`

**Layout:**
- `flex items-center justify-between` → `display: flex; align-items: center; justify-content: space-between;`
- `flex-[1_0_0]` → `flex: 1 0 0;`

### Component Structure Pattern

**Every Component Follows:**
1. React functional component with hooks
2. Separate CSS file with BEM-like naming
3. SVG icons as inline components or separate files
4. Props for data injection
5. Event handlers for interactions

## Implementation Examples

### 1. User List Component

**File Structure:**
```
/src/pages/UserManagement/
  UserList.jsx (main component)
  UserList.css (styles)
  components/
    ToggleSwitch.jsx (subcomponent)
    ToggleSwitch.css
```

**UserList.jsx Key Features:**
- Table with 8 columns: Name (200px), Email (250px), Role (140px), Last Login (160px), Actions (92px), Status (138px)
- 8 sample users with toggle switches
- Search input + Filter button
- 3 action buttons: Bulk Upload, Export CSV, Add New User
- Edit, View, Delete icons for each row

**Conversion Highlights:**
```jsx
// Tailwind (from Figma)
<div className="bg-[#1f55a6] p-[10px] rounded-[20px]">

// Custom CSS
<div className="sidebar">
/* UserList.css */
.sidebar {
  background: var(--primary-color);
  padding: 10px;
  border-radius: var(--radius-20);
}
```

### 2. Add New User Modal

**Modal Overlay Pattern:**
```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(51, 51, 51, 0.3);
  backdrop-filter: blur(7px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  background: var(--black-b0);
  width: 500px;
  padding: 24px;
  border-radius: var(--radius-20);
  box-shadow: var(--shadow-card);
}
```

**Form Fields:**
- Name (pre-filled, blue border - focused state)
- Email (placeholder, gray border)
- Mobile (placeholder)
- Role (dropdown with arrow-down icon)
- Status toggle + label
- Save (primary button) + Cancel (secondary button)

### 3. Student List Differences

**vs User List:**
- NO Status column
- Columns: Student Name (250px), ID (160px), Grade (flex-1), Sponsor (flex-1), Contact Details (flex-1), Actions (92px)
- Button text: "+ Add New Student" instead of "+ Add New User"
- Smaller search bar: 300px width, 8px border-radius, 12px font-size

### 4. Sponsor-Student Mapping (Most Complex)

**Layout:**
- Left panel (400px): Sponsor dropdown + multi-select student list with checkboxes
- Right panel (636px): Mapping list table with removable student tags
- CheckBox component with blue checkmark
- Tag component with X button for removal

**Student Multi-Select:**
```css
.student-item {
  background: rgba(31, 85, 166, 0.05);
  padding: 6px 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.student-item-selected {
  /* Checkbox icon visible */
}
```

## Shared Layout Components

### Sidebar (Blue, 260px width)
- Logo + "Administrator" text
- Navigation items:
  * Dashboard
  * Apps Analytics
  * Manage App
  * Reports (active state: rgba(255,255,255,0.1) bg, rounded-12px)
  * Settings
  * Log out
- Divider lines (Line6.svg)
- Active state detection via React Router

### Header (Gradient background)
- Breadcrumb: "Dashboard / User Management"
- Date: "Tuesday, 13 Nov"
- Notification + Settings icons
- Avatar dropdown: "Jackson Doe / Administrator"
- Divider line (vertical)

### Footer
- "Need Help?" + "Contact Support" links
- Poppins Medium 13px, underlined

## Implementation Priority

### Phase 1: Core Components (Completed Designs)
1. ✅ UserList - Establish pattern
2. ✅ AddUserModal - Modal pattern
3. ✅ StudentList - Variation example
4. ✅ ViewStudentDetails - Read-only modal
5. ✅ EditStudent - Edit form
6. ✅ SponsorMapping - Complex UI

### Phase 2: Shared Layouts
7. Sidebar component
8. Header component
9. MainLayout wrapper
10. Common subcomponents (ToggleSwitch, Checkbox, SearchInput, etc.)

### Phase 3: Missing Pages (Manual Creation)
11. Edit User - Similar to Add User
12. Bulk Upload - File upload UI
13. Add Student - Similar to Edit Student
14. Remaining System Config (5 pages) - Manually design based on similar patterns

### Phase 4: Other Sections (Design Required)
15. Academic Records (6 pages) - Needs Figma access or manual design
16. Teacher Flow (6 pages) - Needs Figma access
17. Student Flow (3 pages) - Needs Figma access

## CSS Architecture

### File Organization
```
/src/styles/
  variables.css (existing - DO NOT MODIFY)
  global.css (global resets and utilities)

/src/components/Layout/
  Sidebar.css
  Header.css
  MainLayout.css

/src/pages/UserManagement/
  UserList.css
  AddUser.css
  EditUser.css
  BulkUpload.css

/src/pages/SystemConfiguration/
  StudentList.css
  ViewStudent.css
  EditStudent.css
  SponsorMapping.css
  ...
```

### BEM-like Naming Convention
```css
/* Block */
.user-list { }

/* Element */
.user-list__header { }
.user-list__table { }
.user-list__row { }

/* Modifier */
.user-list__row--active { }
.user-list__button--primary { }
```

### Reusable Classes (in global.css)
```css
.btn-primary {
  background: var(--primary-color);
  color: var(--black-b0);
  padding: 8px 16px;
  border-radius: var(--radius-10);
  font-family: var(--font-primary);
  font-size: var(--font-base);
  font-weight: 500;
  border: none;
  cursor: pointer;
}

.btn-secondary {
  background: var(--black-b0);
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
  /* ... rest same as primary */
}

.input-field {
  border: 1px solid var(--black-b200);
  border-radius: var(--radius-12);
  padding: 12px 16px;
  font-family: var(--font-primary);
  font-size: var(--font-base);
  height: 48px;
}

.input-field:focus {
  border-color: var(--primary-color);
  outline: none;
}
```

## Testing Checklist

For each component:
- [ ] Visual fidelity matches Figma screenshot
- [ ] All colors use CSS variables
- [ ] Typography matches design system
- [ ] Spacing is pixel-perfect
- [ ] Hover states work
- [ ] Focus states work
- [ ] Responsive (if applicable)
- [ ] Accessibility (ARIA labels)
- [ ] Router navigation works
- [ ] No console errors

## Next Steps

1. **Download Assets** - Run download script for all 120 URLs
2. **Create UserList** - Full implementation as reference pattern
3. **Extract Layouts** - Sidebar, Header, MainLayout from UserList
4. **Implement Remaining 5** - Follow UserList pattern
5. **Create Missing Pages** - Design Edit User, Bulk Upload, Add Student manually
6. **Test All Routes** - Verify navigation works
7. **Polish** - Animations, transitions, loading states

## Notes

- All Figma code is React + Tailwind - must convert 100%
- Asset URLs expire in 7 days - download immediately
- 23 pages still need Figma access or manual design
- Focus on 6 fetched designs first to establish quality baseline
- Can demo to user after completing these 6 to get feedback

## Success Criteria

✅ 6 pages match Figma designs exactly
✅ All components use custom CSS variables
✅ No Tailwind dependencies
✅ Code follows project conventions
✅ Navigation works between pages
✅ Modals open/close correctly
✅ Forms submit data
✅ Tables display all sample data
