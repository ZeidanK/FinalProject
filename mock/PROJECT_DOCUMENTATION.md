# Financial Reconciliation System - Mockup Application

## Project Overview
A complete, non-functional mockup application for a financial technology product that identifies and matches expense invoices to bank and credit card movements for financial reconciliation and taxation purposes.

**Target Users:** Business Owners and Accountants

## Technology Stack
- **Framework:** React 19.2.0
- **Build Tool:** Vite 7.2.4
- **Routing:** React Router DOM 7.9.6
- **Styling:** Tailwind CSS (with PostCSS & Autoprefixer)
- **Icons:** Lucide React 0.554.0

## Application Structure

### Authentication Pages (3 pages)
1. **Login** (`/login`) - Email/password authentication with role selection (Accountant/Business Owner)
2. **Register** (`/register`) - Multi-step registration with company details
3. **Forgot Password** (`/forgot-password`) - Password recovery flow

### Dashboard (1 page)
4. **Dashboard** (`/dashboard`) - Role-based landing page with statistics, quick actions, recent activity, and alerts

### Account Management Pages (2 pages)
5. **Manage Businesses** (`/accountant/businesses`) - Accountants can view and manage all business accounts they have access to
6. **Manage Accountants** (`/business/accountants`) - Business owners can search for and manage accountant access

### Core Workflow Pages (6 pages)
7. **Invoice Upload** (`/invoice-upload`) - Drag-and-drop interface with file processing simulation and data verification modal
8. **Bank Import** (`/bank-import`) - Manual file upload with transaction preview and confirmation workflow
9. **Processing Status** (`/processing-status`) - AI processing status tracking with confidence scores
10. **Invoice Detail** (`/invoice-detail/:id`) - Detailed invoice view with extracted data
11. **Matching & Reconciliation** (`/matching`) - Side-by-side matching interface with AI suggestions
12. **Consolidated Export** (`/export`) - Data export with multiple format options

### Reports & Compliance Pages (4 pages)
13. **Reports Dashboard** (`/reports`) - Overview of all report types
14. **VAT Report** (`/reports/vat`) - Detailed VAT breakdown by rate and category
15. **Anomaly Alerts** (`/anomalies`) - Real-time anomaly detection with severity filters
16. **Exception Detail** (`/anomalies/:id`) - Individual exception resolution

### Settings & Configuration Pages (2 pages)
17. **User Profile** (`/profile`) - Personal information, notifications, and security settings
18. **AI Settings** (`/ai-settings`) - AI provider configuration and fine-tuning

### Extra Features (2 pages)
19. **Help & Support** (`/help`) - FAQ, knowledge base, contact options, and video tutorials
20. **Tutorial** (`/tutorial`) - Interactive 6-step onboarding flow

## Key Features

### Role-Based Views
- **Accountant View:** Manage multiple business accounts, access compliance reports, and detailed reconciliation
- **Business Owner View:** Search and connect with accountants, view financial overview and operational insights

### Account Management Features
- **For Accountants:** View all connected businesses, accept/decline access requests, switch between business contexts
- **For Business Owners:** Search for accountants, send access requests, manage permissions (full-access vs view-only), revoke access

### AI Features (Mocked)
- Automatic invoice data extraction (amounts, dates, vendors, VAT) with confidence scores
- Manual verification and correction of extracted invoice data
- Smart transaction matching with confidence scores
- Automatic bank transaction categorization
- Duplicate transaction detection
- Name and context recognition
- Anomaly detection
- Continuous learning simulation

### Navigation
- Collapsible sidebar with grouped menu items
- Protected routes requiring authentication
- Direct navigation between related pages
- Breadcrumb trails in detail views

### Mock Data Patterns
All pages use realistic mock data to demonstrate:
- Invoice processing workflows
- Bank transaction matching
- VAT calculations and reporting
- User profile management
- Integration configurations

## Running the Application

### Development Server
```bash
npm run dev
```
Access at: http://localhost:5173 (or next available port)

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## File Structure
```
src/
├── App.jsx                          # Main routing configuration
├── main.jsx                         # Application entry point
├── index.css                        # Global styles with Tailwind
├── components/
│   └── Layout.jsx                   # Sidebar navigation layout
├── pages/
│   ├── auth/
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── ForgotPassword.jsx
│   ├── Dashboard.jsx
│   ├── accountant/
│   │   └── ManageBusinesses.jsx     # Accountant business account management
│   ├── business/
│   │   └── ManageAccountants.jsx    # Business owner accountant management
│   ├── workflow/
│   │   ├── InvoiceUpload.jsx        # With data verification modal
│   │   ├── BankImport.jsx           # With transaction preview table
│   │   ├── ProcessingStatus.jsx
│   │   ├── InvoiceDetail.jsx
│   │   ├── MatchingReconciliation.jsx
│   │   └── ConsolidatedExport.jsx
│   ├── reports/
│   │   ├── ReportsDashboard.jsx
│   │   ├── VATReport.jsx
│   │   ├── AnomalyAlerts.jsx
│   │   └── ExceptionDetail.jsx
│   ├── settings/
│   │   ├── UserProfile.jsx
│   │   └── AISettings.jsx
│   └── extra/
│       ├── HelpSupport.jsx
│       └── Tutorial.jsx
└── assets/
```

## Design Principles

### UI/UX
- Clean, professional interface with consistent styling
- Responsive design using Tailwind utility classes
- Color-coded sections for easy navigation
- Visual feedback for user interactions
- Loading states and progress indicators

### Mock Implementation
- No backend API calls
- All data stored in component state
- Simulated processing delays
- Alert/toast notifications without persistence
- Form validations without server-side logic

### Accessibility
- Semantic HTML elements
- Clear visual hierarchy
- Keyboard navigation support
- Color contrast compliance
- Descriptive button and link text

## Key Components

### Layout Component
- Collapsible sidebar navigation
- User role badge display
- Logout functionality
- Responsive mobile menu

### Protected Routes
- Authentication check before accessing app pages
- Redirect to login for unauthenticated users
- Role-based content rendering

### Form Components
- Input validation feedback
- File upload with drag-and-drop
- Multi-select and dropdown menus
- Toggle switches and checkboxes

## Mock Workflows

### 1. Invoice Processing with Verification
Login → Upload Invoice → Process File → **Verify Extracted Data** → Confirm & Save → Match with Transaction

### 2. Bank Transaction Import with Review
Login → Upload Bank Statement → **Review Transaction Table** → Edit/Select Transactions → Confirm Import → Auto-Match → Export Report

### 3. Accountant-Business Relationship
**Accountant:** Login → My Businesses → View Business Dashboard → Manage Business Data
**Business Owner:** Login → My Accountants → Search Accountants → Send Access Request → Set Permissions

### 4. Compliance Reporting
Login → Reports Dashboard → Generate VAT Report → Review Anomalies → Export for Filing

### 5. Configuration
Login → Settings → Configure AI → Set User Preferences

## Important Notes

⚠️ **This is a non-functional mockup:**
- No actual database connections
- No real API integrations
- No backend processing
- No data persistence
- No actual AI/ML functionality
- No real bank connections (bank connection features intentionally removed)
- No accounting software integrations (integration features intentionally removed)

✅ **What it demonstrates:**
- Complete user flow and navigation
- UI/UX for all features including new account management system
- Invoice data extraction verification workflow
- Bank transaction review and confirmation process
- Visual design and layout
- Component structure and organization
- Role-based view differences (accountant vs business owner)
- Multi-account management for accountants
- Accountant search and permission management for business owners
- Form interactions and validations with confidence scores
- Duplicate detection and data verification workflows

## Future Enhancements (Not Implemented)

If this were a production application, you would need:
- Backend API with authentication
- Database for data persistence
- Real AI/ML models for extraction and matching
- Secure bank API integrations
- File storage system
- Email/notification service
- Production-grade error handling
- Comprehensive testing suite
- Security audits and compliance certifications

## Credits

Built with React, Vite, Tailwind CSS, and Lucide Icons.
Created as a comprehensive UI/UX mockup for financial reconciliation workflows.

---
**Version:** 1.0.0  
**Last Updated:** 2024  
**Status:** Development Mockup
