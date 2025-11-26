# UML Documentation - Accountant User Flow

This directory contains PlantUML diagrams for the Financial Reconciliation System, specifically focused on the Accountant user profile.

## Files

### 1. `accountant_navigation_map.puml`
Complete navigation map showing:
- All screens accessible to accountants
- Navigation paths between screens
- Use case references for each screen
- Actions available on each screen
- Screen groupings (Auth, Dashboard, Workflow, Reports, Settings, Help)

**Color Legend:**
- 🟠 Authentication Screens
- 🟢 Main Dashboard
- 🟡 Account Management
- 🟣 Core Workflow
- 🟤 Reports & Compliance
- 🔵 Settings
- 🔴 Help & Support

### 2. `accountant_screen_layouts.puml`
Detailed mockup layouts for key screens:
- Login Screen
- Dashboard
- Manage Businesses
- Invoice Upload
- Data Verification Modal
- Matching & Reconciliation
- VAT Report
- AI Settings

Each layout includes:
- Screen structure and components
- Use case reference
- Available actions
- Data display formats

## How to Use

### View/Edit Online
1. Go to [PlantUML Online Editor](http://www.plantuml.com/plantuml/uml/)
2. Copy the content of any `.puml` file
3. Paste into the editor to view/edit

### Generate Images Locally
```bash
# Install PlantUML
sudo apt-get install plantuml

# Generate PNG
plantuml accountant_navigation_map.puml
plantuml accountant_screen_layouts.puml

# Generate SVG (better quality)
plantuml -tsvg accountant_navigation_map.puml
plantuml -tsvg accountant_screen_layouts.puml
```

### VS Code Extension
Install "PlantUML" extension by jebbs:
1. Install extension
2. Open any `.puml` file
3. Press `Alt+D` to preview

## Assignment Requirements Covered

### 7.3 UI Layer Requirements ✓

#### Navigation Map (מפת ניווט)
- ✓ Complete hierarchy of system screens
- ✓ Navigation arrows between screens
- ✓ Separate map for Accountant profile
- ✓ Readable layout with clear groupings

#### Screen Layouts (תארו באופן סכמטי)
- ✓ Schematic representation using mockup format
- ✓ Use case reference for each screen
- ✓ Collection of actions available on each screen
- ✓ Layout structure showing components

## Screen Categories

### Authentication (3 screens)
- Login
- Register
- Forgot Password

### Account Management (1 screen)
- Manage Businesses

### Core Workflow (6 screens)
- Invoice Upload (+ Verification Modal)
- Bank Import
- Processing Status
- Invoice Detail
- Matching & Reconciliation
- Consolidated Export

### Reports & Compliance (4 screens)
- Reports Dashboard
- VAT Report
- Anomaly Alerts
- Exception Detail

### Settings (2 screens)
- User Profile
- AI Settings

### Help (2 screens)
- Help & Support
- Tutorial

## Use Cases Referenced

Each screen maps to specific use cases:
- **UC: User Authentication** - Login flow
- **UC: View Overview** - Dashboard
- **UC: Manage Business Accounts** - Manage Businesses
- **UC: Upload Invoices** - Invoice Upload
- **UC: Verify Extracted Data** - Verification Modal
- **UC: Import Bank Data** - Bank Import
- **UC: Track Processing** - Processing Status
- **UC: View Invoice Details** - Invoice Detail
- **UC: Match Transactions** - Matching & Reconciliation
- **UC: Export Data** - Consolidated Export
- **UC: Generate VAT Report** - VAT Report
- **UC: Review Anomalies** - Anomaly Alerts
- **UC: Resolve Exception** - Exception Detail
- **UC: Configure AI** - AI Settings
- **UC: Manage Profile** - User Profile
- **UC: Get Help** - Help & Support
- **UC: Learn System** - Tutorial

## Notes

- All screens are implemented in the React mockup application
- Navigation flows match the actual routing in `App.jsx`
- Layouts reflect the actual component structure
- This documentation focuses on the Accountant user profile only
- Business Owner and Admin profiles can be added in separate files if needed
