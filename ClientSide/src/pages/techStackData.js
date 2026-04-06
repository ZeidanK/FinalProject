export const techStackSections = [
  {
    title: 'Frontend',
    description: 'Libraries used in the React client to build UI, validation, routing, and data flow.',
    entries: [
      {
        name: '@mui/material',
        what: 'A production-ready React component library implementing Material Design primitives.',
        usedFor: 'Core UI components across pages, cards, forms, buttons, typography, and responsive layouts.',
        projectExample: 'Used heavily in AuthenticatedLayout and page-level cards for consistent UI primitives.',
        positives: [
          'Fast UI development with consistent, accessible components.',
          'Strong theming support for a unified design language.',
          'Reliable responsiveness and interaction states out of the box.',
        ],
        improvements: [
          'Reduced custom CSS and duplicated component logic.',
          'Made the UI more consistent across all pages.',
          'Accelerated feature delivery for new screens.',
        ],
      },
      {
        name: '@mui/icons-material',
        what: 'Material icon package tailored for MUI components.',
        usedFor: 'Navigation and action icons in layouts, headers, and contextual actions.',
        projectExample: 'Sidebar, page headers, and action buttons all use icon imports from this package.',
        positives: [
          'Large icon set with consistent visual style.',
          'Simple integration with MUI component props.',
        ],
        improvements: [
          'Improved scanability and visual hierarchy in the app.',
          'Reduced time spent creating or importing ad-hoc icon assets.',
        ],
      },
      {
        name: '@emotion/react + @emotion/styled',
        what: 'CSS-in-JS styling engine used by MUI.',
        usedFor: 'Runtime styling, theme-aware component styles, and style composition.',
        projectExample: 'Powers MUI theme-based styling across cards, stacks, and responsive component props.',
        positives: [
          'Tight MUI integration with theme tokens.',
          'Scoped styles with low risk of global CSS collisions.',
        ],
        improvements: [
          'Enabled cleaner component-level style ownership.',
          'Supported quick theme and visual adjustments.',
        ],
      },
      {
        name: 'react-router-dom',
        what: 'Client-side routing library for React.',
        usedFor: 'Public and authenticated routes, role-based route composition, and redirects.',
        projectExample: 'App route tree defines protected, role-based, and company-aware route access patterns.',
        positives: [
          'Declarative route definitions and navigation primitives.',
          'Good control over protected routes and redirect behavior.',
        ],
        improvements: [
          'Made access control flows clearer and easier to maintain.',
          'Improved user navigation continuity across modules.',
        ],
      },
      {
        name: '@tanstack/react-query',
        what: 'Server-state management and async data fetching library.',
        usedFor: 'Query client setup and cached API data lifecycles.',
        projectExample: 'QueryClient is configured in a dedicated query client module for shared server-state handling.',
        positives: [
          'Built-in caching and request lifecycle handling.',
          'Reduces repetitive loading and error-state boilerplate.',
        ],
        improvements: [
          'More predictable data synchronization with APIs.',
          'Cleaner component code around network state.',
        ],
      },
      {
        name: 'react-hook-form',
        what: 'Performant forms library for React.',
        usedFor: 'Authentication and profile-related form state and submission.',
        projectExample: 'Register and auth-related forms use hook-based field registration and validation flow.',
        positives: [
          'Low re-render overhead and ergonomic APIs.',
          'Works well with custom validation flows.',
        ],
        improvements: [
          'Simplified form logic and validation wiring.',
          'Made forms easier to scale and maintain.',
        ],
      },
      {
        name: 'zod',
        what: 'Type-safe schema validation library.',
        usedFor: 'Input schema validation and field-level constraints in forms.',
        projectExample: 'Validation schemas under src/schemas centralize auth and profile input constraints.',
        positives: [
          'Readable and reusable schema definitions.',
          'Clear validation errors and stricter data contracts.',
        ],
        improvements: [
          'Reduced invalid payloads before API calls.',
          'Centralized validation rules instead of scattered checks.',
        ],
      },
      {
        name: 'framer-motion',
        what: 'Animation and transitions library for React UIs.',
        usedFor: 'Page entrance animations, staggered content reveal, and motion wrappers.',
        projectExample: 'PageSectionLayout and key pages use motion variants for smooth staggered reveal behavior.',
        positives: [
          'Smooth declarative animations with minimal setup.',
          'Good control over variants and timing.',
        ],
        improvements: [
          'Improved perceived quality and clarity of page transitions.',
          'Made content hierarchy more readable during load.',
        ],
      },
      {
        name: 'papaparse',
        what: 'CSV parsing library for browser and Node.',
        usedFor: 'Client-side CSV ingestion/parsing in transactions workflows.',
        projectExample: 'Transactions page parses uploaded CSV content client-side before mapping into app flow.',
        positives: [
          'Mature parser with robust CSV handling.',
          'Simple API for parsing text data into structured rows.',
        ],
        improvements: [
          'Enabled direct CSV import without extra backend parsing steps.',
          'Reduced complexity for transaction upload flows.',
        ],
      },
    ],
  },
  {
    title: 'Backend',
    description: 'Packages used in the .NET API for auth, data access, extraction, and reporting.',
    entries: [
      {
        name: 'Microsoft.AspNetCore.Authentication.JwtBearer',
        what: 'ASP.NET Core JWT bearer authentication middleware package.',
        usedFor: 'Authentication pipeline setup and bearer token validation.',
        projectExample: 'Configured in Program.cs with AddAuthentication and AddJwtBearer pipeline wiring.',
        positives: [
          'Native framework integration for API auth.',
          'Clear middleware configuration model.',
        ],
        improvements: [
          'Established secure token-based API access.',
          'Simplified consistent auth handling across endpoints.',
        ],
      },
      {
        name: 'Microsoft.IdentityModel.Tokens + System.IdentityModel.Tokens.Jwt',
        what: 'Core token primitives and JWT handling libraries.',
        usedFor: 'Token generation, signing, and validation parameters.',
        projectExample: 'TokenValidationParameters, SymmetricSecurityKey, and JwtSecurityTokenHandler are used in auth flow.',
        positives: [
          'Battle-tested token infrastructure.',
          'Flexible issuer/audience/signing configuration.',
        ],
        improvements: [
          'Strengthened security and claim-based identity flow.',
          'Improved control over token lifetime and validation.',
        ],
      },
      {
        name: 'System.Data.SqlClient',
        what: 'SQL Server data provider for .NET.',
        usedFor: 'Direct SQL connections, commands, and stored procedure execution.',
        projectExample: 'DAL DBservices modules use SqlConnection and SqlCommand against stored procedures and queries.',
        positives: [
          'Stable and familiar ADO.NET data access stack.',
          'Fine-grained control over commands and transactions.',
        ],
        improvements: [
          'Allowed precise DAL behavior for reconciliation workflows.',
          'Supported incremental optimization of SQL queries/procedures.',
        ],
      },
      {
        name: 'ClosedXML',
        what: 'Excel manipulation and reading library over OpenXML.',
        usedFor: 'Reading and processing spreadsheet data during extraction workflows.',
        projectExample: 'ExcelExtractionService opens workbook streams and maps worksheet data to domain structures.',
        positives: [
          'Convenient, readable API for workbook/worksheet operations.',
          'No need for Excel interop dependencies.',
        ],
        improvements: [
          'Enabled efficient spreadsheet ingestion for business data.',
          'Reduced effort for Excel parsing logic.',
        ],
      },
      {
        name: 'itext7',
        what: 'PDF processing library.',
        usedFor: 'Text extraction from digital PDFs as primary extraction path.',
        projectExample: 'PdfExtractionService reads PDF pages and extracts text for invoice processing.',
        positives: [
          'Strong PDF parsing capabilities and ecosystem support.',
          'Useful primitives for page-level extraction workflows.',
        ],
        improvements: [
          'Improved reliability of invoice text extraction.',
          'Reduced manual handling of PDF formats.',
        ],
      },
      {
        name: 'Tesseract',
        what: 'OCR engine bindings for text recognition from images/scans.',
        usedFor: 'Fallback OCR when PDF text extraction is insufficient.',
        projectExample: 'PdfExtractionService uses Tesseract as OCR fallback for scanned and low-text files.',
        positives: [
          'Enables extraction from scanned or image-heavy documents.',
          'Complements digital-text extraction approaches.',
        ],
        improvements: [
          'Raised extraction coverage for low-quality or scanned files.',
          'Reduced failed processing cases in upload flows.',
        ],
      },
      {
        name: 'Mscc.GenerativeAI',
        what: 'Client SDK for integrating with Gemini generative models.',
        usedFor: 'Structured invoice data extraction and AI-assisted parsing.',
        projectExample: 'GeminiExtractionService calls model APIs to convert extracted text into structured invoice output.',
        positives: [
          'Accelerates transformation from raw text to structured fields.',
          'Allows prompt-based refinement of extraction behavior.',
        ],
        improvements: [
          'Improved automation and reduced manual review effort.',
          'Enabled faster iteration on extraction quality.',
        ],
      },
    ],
  },
  {
    title: 'Tooling',
    description: 'Utilities used to keep code quality and development workflow stable.',
    entries: [
      {
        name: 'jscpd',
        what: 'Copy/paste detector for codebases.',
        usedFor: 'Detecting duplicated code blocks across frontend and backend modules.',
        projectExample: 'Root package scripts run strict and scoped duplication reports for frontend and backend folders.',
        positives: [
          'Quantifies duplication hotspots quickly.',
          'Encourages extraction of shared logic and cleaner architecture.',
        ],
        improvements: [
          'Supports maintainability by reducing repeated code.',
          'Helps prevent divergence bugs across duplicated implementations.',
        ],
      },
    ],
  },
]

export const requirementCoverage = [
  {
    requirement: 'At least 7 pages',
    status: 'Covered',
    proof: 'Client app route tree includes more than seven page routes such as dashboard, invoices, transactions, matches, anomalies, reports, profile, and admin.',
  },
  {
    requirement: 'Web API with SQL DB',
    status: 'Covered',
    proof: 'Server project contains API controllers plus DAL modules using SQL Server data access.',
  },
  {
    requirement: 'At least 3 interesting plugins/libraries',
    status: 'Covered',
    proof: 'Project uses MUI, React Query, Zod, Framer Motion, React Hook Form, PapaParse, and backend libraries for PDF/OCR/AI.',
  },
  {
    requirement: 'Appropriate design with design libraries',
    status: 'Covered',
    proof: 'MUI theming and component patterns are used consistently across layouts and pages.',
  },
  {
    requirement: 'Deployment/submission readiness',
    status: 'In progress',
    proof: 'Final deployment and submission logistics remain the main non-code tasks before hand-in.',
  },
]

export const stackRationale = [
  'MUI was chosen to ship a polished, consistent UI quickly while preserving flexibility through theme customization.',
  'React Router + route guards provide clean, explainable access-control boundaries for roles and company context.',
  'React Query, React Hook Form, and Zod reduce boilerplate and make state and validation behavior predictable.',
  'iText7 + Tesseract + Gemini create a layered extraction pipeline: digital text first, OCR fallback, then AI structuring.',
  'System.Data.SqlClient with explicit DAL services keeps SQL behavior transparent and easy to tune for reconciliation workflows.',
]
