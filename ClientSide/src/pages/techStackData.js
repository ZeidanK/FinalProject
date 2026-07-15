export const techStackSections = [
  {
    title: 'Frontend',
    description: 'Libraries used in the React client to build UI, validation, routing, realtime state, and data-heavy workflows.',
    entries: [
      {
        name: 'React 19 + Vite',
        what: 'Modern React runtime paired with Vite for fast local development and optimized production builds.',
        usedFor: 'The full client application, routed pages, shared providers, and component-driven workflows.',
        projectExample: 'main.jsx mounts the React app through shared auth, company, notification, realtime, theme, and query providers.',
        positives: [
          'Fast feedback loop during development.',
          'Component model fits a modular financial workspace.',
          'Modern build pipeline without heavy configuration.',
        ],
        improvements: [
          'Keeps page and component development quick.',
          'Makes feature modules easier to test and evolve.',
          'Supports a clean split between frontend services and backend APIs.',
        ],
      },
      {
        name: '@mui/material 7 + @mui/icons-material',
        what: 'Material UI component and icon libraries for React.',
        usedFor: 'Core page layout, navigation, tables, forms, dialogs, cards, chips, and action icons.',
        projectExample: 'AuthenticatedLayout, page workspaces, modals, filters, and dashboard cards use MUI primitives consistently.',
        positives: [
          'Accessible, responsive components out of the box.',
          'Large icon set with a consistent visual language.',
          'Theme-aware styling through the MUI system.',
        ],
        improvements: [
          'Gives the app a cohesive, production-like interface.',
          'Reduces duplicated custom CSS and interaction logic.',
          'Speeds up delivery of complex admin and reconciliation screens.',
        ],
      },
      {
        name: '@emotion/react + @emotion/styled',
        what: 'CSS-in-JS styling engine used by MUI.',
        usedFor: 'Theme-aware component styling and responsive sx prop composition.',
        projectExample: 'Cards, stacks, chips, modals, and workspace sections use scoped MUI styles backed by Emotion.',
        positives: [
          'Tight integration with MUI theme tokens.',
          'Scoped styles reduce global CSS collisions.',
          'Responsive styles stay close to the component they affect.',
        ],
        improvements: [
          'Keeps visual refinements localized.',
          'Makes dark theme styling easier to maintain.',
          'Supports consistent spacing, borders, and state colors.',
        ],
      },
      {
        name: 'react-router-dom',
        what: 'Client-side routing library for React.',
        usedFor: 'Public routes, authenticated routes, role guards, company guards, and redirects.',
        projectExample: 'App.jsx defines route protection for dashboard, invoices, transactions, matches, anomalies, reports, admin, and accountant workspaces.',
        positives: [
          'Declarative routing and navigation primitives.',
          'Clear composition for protected and role-specific screens.',
          'Predictable redirects for missing auth or company context.',
        ],
        improvements: [
          'Makes access-control flow visible in one route tree.',
          'Improves navigation continuity across modules.',
          'Keeps public project reference pages available without login.',
        ],
      },
      {
        name: '@tanstack/react-query',
        what: 'Server-state management and async data fetching library.',
        usedFor: 'Cached API queries, mutations, invalidation, and optimistic UI patterns.',
        projectExample: 'Query hooks under src/hooks/queries coordinate invoices, transactions, matches, anomalies, users, reports, and notifications.',
        positives: [
          'Built-in caching and request lifecycle handling.',
          'Central place for invalidation after mutations.',
          'Reduces repetitive loading and error boilerplate.',
        ],
        improvements: [
          'Keeps API state synchronized after imports and edits.',
          'Makes data-heavy pages more predictable.',
          'Improves perceived responsiveness across the app.',
        ],
      },
      {
        name: '@microsoft/signalr',
        what: 'JavaScript client for ASP.NET Core SignalR realtime connections.',
        usedFor: 'Live notification events for upload jobs, access requests, anomaly events, and background processing updates.',
        projectExample: 'RealtimeProvider connects to /api/realtime/notifications and shares subscription helpers across invoices, transactions, accountant workflows, and notification UI.',
        positives: [
          'Persistent connection for live server events.',
          'Works naturally with the ASP.NET Core backend hub.',
          'Supports targeted user and company notifications.',
        ],
        improvements: [
          'Users see long-running job progress without manual refresh.',
          'Notification state stays current across active sessions.',
          'Background processing feels integrated into the workspace.',
        ],
      },
      {
        name: 'react-hook-form + zod',
        what: 'Form state library paired with schema validation.',
        usedFor: 'Authentication, registration, profile, anomaly resolution, and other validated form workflows.',
        projectExample: 'Validation schemas under src/schemas centralize auth, profile, and anomaly input constraints.',
        positives: [
          'Low re-render form state management.',
          'Readable and reusable validation contracts.',
          'Cleaner user feedback for invalid input.',
        ],
        improvements: [
          'Reduces invalid payloads before API calls.',
          'Keeps form logic easier to scale.',
          'Moves validation rules out of one-off component checks.',
        ],
      },
      {
        name: 'recharts',
        what: 'Charting library for React dashboards.',
        usedFor: 'Dashboard and report visualizations for reconciliation and financial summaries.',
        projectExample: 'DashboardChart and Reports page visualizations present company stats, aging data, and reconciliation information.',
        positives: [
          'Composable chart primitives for React.',
          'Works well with responsive dashboard layouts.',
          'Supports readable financial data visualization.',
        ],
        improvements: [
          'Turns raw report data into quick visual summaries.',
          'Makes trends and status distribution easier to scan.',
          'Improves usefulness of dashboard and reporting pages.',
        ],
      },
      {
        name: 'react-pdf + pdfjs-dist',
        what: 'PDF rendering libraries for browser previews.',
        usedFor: 'Inline invoice PDF viewing during verification and matching workflows.',
        projectExample: 'InvoicePdfPreview renders uploaded invoice files inside invoice and match review modals.',
        positives: [
          'Users can inspect source documents without leaving the app.',
          'Text and annotation layers improve review fidelity.',
          'Pairs well with manual verification flows.',
        ],
        improvements: [
          'Reduces context switching while checking extracted fields.',
          'Makes AI extraction review more trustworthy.',
          'Supports side-by-side document and data validation.',
        ],
      },
      {
        name: '@dnd-kit',
        what: 'Accessible drag-and-drop toolkit for React.',
        usedFor: 'Interactive matching and workspace flows that need draggable, sortable UI behavior.',
        projectExample: 'The client includes dnd-kit dependencies for rich reconciliation interactions such as kanban-style match organization.',
        positives: [
          'Accessible drag sensors and sortable primitives.',
          'Flexible enough for custom financial workflow UI.',
          'Avoids browser-native drag limitations.',
        ],
        improvements: [
          'Supports richer match review interactions.',
          'Keeps drag behavior reusable across workspace components.',
          'Improves ergonomics for multi-step reconciliation tasks.',
        ],
      },
      {
        name: 'react-window',
        what: 'List virtualization library for rendering large datasets efficiently.',
        usedFor: 'Performance support for large transaction, invoice, match, and anomaly lists.',
        projectExample: 'Included in the client stack to keep data-heavy financial tables responsive as row counts grow.',
        positives: [
          'Renders only visible list rows.',
          'Reduces DOM weight on dense screens.',
          'Fits large import and review workflows.',
        ],
        improvements: [
          'Protects UI responsiveness on large company datasets.',
          'Makes high-volume reconciliation reviews more practical.',
          'Reduces rendering overhead in repeated table workflows.',
        ],
      },
      {
        name: 'PapaParse',
        what: 'CSV parsing library for browser and Node.',
        usedFor: 'Client-side CSV ingestion and preview support for transaction workflows.',
        projectExample: 'Transaction upload helpers parse CSV content before mapping imported rows into the app flow.',
        positives: [
          'Mature parser with robust CSV handling.',
          'Simple API for turning text data into structured rows.',
          'Useful before backend import confirmation.',
        ],
        improvements: [
          'Enables fast client-side import previews.',
          'Reduces backend round trips for simple CSV checks.',
          'Makes transaction upload errors easier to surface early.',
        ],
      },
      {
        name: 'framer-motion',
        what: 'Animation and transition library for React UIs.',
        usedFor: 'Page entrance animations, staggered content reveal, and motion wrappers.',
        projectExample: 'PageSectionLayout and key page sections use shared motion variants for smooth reveal behavior.',
        positives: [
          'Declarative animation model.',
          'Reusable variants for consistent page motion.',
          'Good control over timing and staggered content.',
        ],
        improvements: [
          'Improves perceived quality of page transitions.',
          'Makes dense pages feel more readable on load.',
          'Keeps animation behavior centralized and testable.',
        ],
      },
    ],
  },
  {
    title: 'Backend',
    description: 'Frameworks and packages used in the .NET API for auth, data, jobs, realtime, extraction, and reconciliation.',
    entries: [
      {
        name: 'ASP.NET Core Web API (.NET 6)',
        what: 'C# backend framework for HTTP APIs, middleware, dependency injection, static files, and hosting.',
        usedFor: 'Controllers, service registration, middleware pipeline, Swagger in development, and API hosting.',
        projectExample: 'Program.cs wires controllers, DI services, CORS, JWT auth, middleware, Hangfire, SignalR, and recurring notification cleanup.',
        positives: [
          'Structured controller and service architecture.',
          'Built-in dependency injection and middleware pipeline.',
          'Strong fit for authenticated business APIs.',
        ],
        improvements: [
          'Keeps backend concerns clearly layered.',
          'Makes services easy to test through interfaces.',
          'Supports production-ready API concerns in one host.',
        ],
      },
      {
        name: 'JWT bearer authentication',
        what: 'Token-based API authentication using ASP.NET Core JWT middleware and identity model packages.',
        usedFor: 'Login sessions, protected API calls, SignalR token validation, and role-aware frontend route access.',
        projectExample: 'AuthController issues tokens and Program.cs validates issuer, audience, lifetime, signing key, active user status, and SignalR token delivery.',
        positives: [
          'Stateless API authentication.',
          'Works for HTTP and realtime hub connections.',
          'Supports role and user claims in the app.',
        ],
        improvements: [
          'Secures user, company, admin, and accounting endpoints.',
          'Allows consistent auth behavior across controllers.',
          'Blocks inactive users during token validation.',
        ],
      },
      {
        name: 'SQL Server + stored procedures',
        what: 'Relational database layer backed by SQL Server procedures and ADO.NET access.',
        usedFor: 'Companies, users, invoices, transactions, matches, anomalies, notifications, reports, jobs, and audit data.',
        projectExample: 'DBservices modules execute FP26 stored procedures through System.Data.SqlClient for each domain area.',
        positives: [
          'Explicit database contracts for complex business workflows.',
          'Fine-grained control over queries and transactions.',
          'Clear separation between BL services and persistence.',
        ],
        improvements: [
          'Keeps reconciliation behavior auditable and tunable.',
          'Supports multi-entity workflows without ORM magic.',
          'Makes database deployment artifacts visible in the repo.',
        ],
      },
      {
        name: 'Hangfire',
        what: 'Background job processing framework with SQL Server storage.',
        usedFor: 'Asynchronous invoice and transaction upload processing plus recurring cleanup jobs.',
        projectExample: 'Program.cs registers Hangfire queues for uploads/default and maps the Hangfire dashboard; upload processors update job state and notifications.',
        positives: [
          'Durable job queue backed by SQL Server.',
          'Separates long-running imports from request/response flow.',
          'Provides dashboard visibility for background work.',
        ],
        improvements: [
          'Large uploads do not block the UI request.',
          'Job status can be tracked and reported to users.',
          'Recurring notification retention runs automatically.',
        ],
      },
      {
        name: 'ASP.NET Core SignalR',
        what: 'Realtime server framework for WebSocket-style client updates.',
        usedFor: 'Notification hub, user/company groups, admin broadcasts, upload job progress, anomaly events, and access-request events.',
        projectExample: 'NotificationHub joins users to personal, admin, company, owner, and accountant groups under /api/realtime/notifications.',
        positives: [
          'First-class integration with ASP.NET Core auth.',
          'Supports targeted group messaging.',
          'Works cleanly with the React SignalR client.',
        ],
        improvements: [
          'Keeps users informed while jobs run in the background.',
          'Reduces the need for polling-heavy UI updates.',
          'Makes collaboration and access events visible quickly.',
        ],
      },
      {
        name: 'ClosedXML',
        what: 'Excel workbook reading and manipulation library.',
        usedFor: 'Importing and previewing bank transaction spreadsheets.',
        projectExample: 'ExcelExtractionService opens workbook streams and maps worksheet rows into transaction import models.',
        positives: [
          'Readable API over Excel files.',
          'No Excel desktop dependency.',
          'Good fit for bank export ingestion.',
        ],
        improvements: [
          'Enables reliable Excel transaction imports.',
          'Supports preview-before-commit workflows.',
          'Reduces custom spreadsheet parsing code.',
        ],
      },
      {
        name: 'iText 7 + Tesseract',
        what: 'PDF text extraction library paired with OCR fallback for scanned documents.',
        usedFor: 'Extracting raw invoice text before structured AI parsing.',
        projectExample: 'PdfExtractionService uses digital PDF extraction first and OCR fallback when text is missing or weak.',
        positives: [
          'Covers both digital PDFs and scanned invoices.',
          'Improves resilience against varied invoice formats.',
          'Keeps document processing inside the backend pipeline.',
        ],
        improvements: [
          'Raises extraction success rate across real invoice files.',
          'Reduces manual typing from PDF uploads.',
          'Feeds cleaner source text into AI structuring.',
        ],
      },
      {
        name: 'Gemini, Ollama, and local model extraction',
        what: 'Configurable AI extraction providers for transforming invoice text into structured fields.',
        usedFor: 'Structured invoice extraction, provider switching, local inference, and Gemini fallback behavior.',
        projectExample: 'Program.cs registers Gemini, Ollama, and local model services; Invoices page can submit a selected extraction provider.',
        positives: [
          'Supports cloud and local AI paths.',
          'Allows provider selection for accuracy, privacy, or availability.',
          'Keeps extraction behind a shared service interface.',
        ],
        improvements: [
          'Makes invoice processing more automated.',
          'Allows experimentation with local and remote models.',
          'Reduces manual review effort while keeping verification available.',
        ],
      },
      {
        name: 'Fine-tuned XLM-RoBERTa local model',
        what: 'A local multilingual token-classification model fine-tuned for invoice named-entity recognition.',
        usedFor: 'Private/local invoice extraction that tags vendor, invoice number, dates, totals, VAT, currency, card digits, payment-plan fields, and line-item spans.',
        projectExample: 'Server/LocalModel trains xlm-roberta-base from real PDF text, Gemini/database results, verified hybrid audit records, augmented variants, and synthetic Hebrew/English invoices, then serves predictions through FastAPI /extract.',
        positives: [
          'Runs invoice extraction locally without depending only on a cloud LLM.',
          'XLM-RoBERTa handles multilingual invoice text, including Hebrew and English examples.',
          'BIO tagging keeps every extracted value grounded in the original invoice text.',
        ],
        improvements: [
          'Creates a repeatable fine-tuning loop from real invoices and verified corrections.',
          'Improves coverage for local/private extraction scenarios.',
          'Works with deterministic post-processing for payment plans and line items.',
        ],
      },
      {
        name: 'Swashbuckle.AspNetCore',
        what: 'Swagger/OpenAPI generation for ASP.NET Core APIs.',
        usedFor: 'Development-time API documentation and endpoint discovery.',
        projectExample: 'Program.cs enables Swagger UI in development environments.',
        positives: [
          'Quick endpoint inspection during development.',
          'Helps validate controller contracts.',
          'Useful for manual API testing.',
        ],
        improvements: [
          'Shortens debugging loops for frontend/backend integration.',
          'Makes controller coverage easier to review.',
          'Improves onboarding for API workflows.',
        ],
      },
    ],
  },
  {
    title: 'Tooling',
    description: 'Testing, quality, and maintenance tools used to keep the project reliable as it grows.',
    entries: [
      {
        name: 'xUnit + Moq',
        what: 'Backend unit testing framework and mocking library for .NET.',
        usedFor: 'Controller, service, matching engine, middleware, realtime, upload job, extraction, and anomaly tests.',
        projectExample: 'Tests/FinalProjectAuthAPI.Tests contains focused suites for controllers, BL services, matching rules, PDF extraction, notifications, and middleware.',
        positives: [
          'Fast feedback for backend business behavior.',
          'Mocks isolate services from database dependencies.',
          'Good coverage for reconciliation edge cases.',
        ],
        improvements: [
          'Protects matching and upload workflows from regressions.',
          'Documents expected controller and service behavior.',
          'Makes complex backend rules safer to change.',
        ],
      },
      {
        name: 'Vitest + Testing Library + MSW',
        what: 'Frontend test runner, component testing tools, and request mocking utilities.',
        usedFor: 'Page, component, hook, service, context, and schema tests in the React client.',
        projectExample: 'ClientSide/src/test includes tests for tech stack, invoices, matches, notifications, realtime, services, and shared UI components.',
        positives: [
          'Runs quickly in the Vite ecosystem.',
          'Encourages user-visible assertions.',
          'Mocks API behavior without a live backend.',
        ],
        improvements: [
          'Catches UI regressions before manual testing.',
          'Keeps service modules aligned with API expectations.',
          'Makes provider and realtime behavior easier to verify.',
        ],
      },
      {
        name: 'ESLint',
        what: 'JavaScript linting tool for code quality and consistency.',
        usedFor: 'Frontend static checks for React hooks, refresh boundaries, globals, and common JavaScript issues.',
        projectExample: 'ClientSide package scripts run eslint across the React source.',
        positives: [
          'Catches common mistakes early.',
          'Keeps code style more consistent.',
          'Supports React-specific lint rules.',
        ],
        improvements: [
          'Reduces avoidable frontend defects.',
          'Keeps hooks usage healthier.',
          'Improves maintainability across many page modules.',
        ],
      },
      {
        name: 'jscpd',
        what: 'Copy/paste detector for codebases.',
        usedFor: 'Detecting duplicated code blocks across frontend and backend modules.',
        projectExample: 'Root package scripts run strict and scoped duplication reports for ClientSide/src, Server/BL, Server/Controllers, and Server/DAL.',
        positives: [
          'Quantifies duplication hotspots quickly.',
          'Encourages extraction of shared logic.',
          'Works across JavaScript, JSX, and C#.',
        ],
        improvements: [
          'Supports maintainability by reducing repeated code.',
          'Helps prevent divergence bugs across duplicated implementations.',
          'Gives the team measurable quality reports.',
        ],
      },
    ],
  },
]

export const systemCapabilities = [
  {
    title: 'AI invoice extraction and verification',
    audienceBenefit: 'Users can upload invoice PDFs, review extracted fields, correct them, and verify the invoice before it becomes trusted financial data.',
    implementationProof: 'Invoice upload flows combine PDF text extraction, OCR fallback, Gemini/Ollama providers, and a fine-tuned XLM-RoBERTa local model trained from real PDFs, verified corrections, augmented variants, and synthetic Hebrew/English invoices.',
    evidence: ['PDF upload', 'OCR fallback', 'Fine-tuned NER', 'Manual verification'],
  },
  {
    title: 'Transaction import and duplicate-file detection',
    audienceBenefit: 'Teams can bring in bank transactions from Excel or CSV, preview import results, and avoid accidentally loading the same statement twice.',
    implementationProof: 'Transaction upload services use ClosedXML/PapaParse-supported import flows, Hangfire job processing, SHA-256 file tracking, and duplicate transaction-file anomalies.',
    evidence: ['Excel/CSV import', 'Preview before commit', 'Duplicate hash tracking', 'Import jobs'],
  },
  {
    title: 'Smart reconciliation and installment matching',
    audienceBenefit: 'Invoices can be matched to one or more transactions using confidence-based suggestions instead of manual ledger comparison.',
    implementationProof: 'The matching engine includes layered rules, vendor normalization, fuzzy matching, FX handling, combination evaluation, auto-match endpoints, and installment suggestion groups.',
    evidence: ['Rule pipeline', 'Auto-match', 'Installments', 'Fuzzy vendor matching'],
  },
  {
    title: 'Anomaly detection and resolution',
    audienceBenefit: 'Suspicious duplicate invoices and duplicate transaction files are surfaced for review with clear resolution actions.',
    implementationProof: 'Anomaly services group duplicate invoices by signature, link duplicate file uploads, expose stats/details endpoints, and support bulk or targeted resolution.',
    evidence: ['Duplicate invoices', 'Duplicate files', 'Grouped details', 'Resolution workflow'],
  },
  {
    title: 'Real-time notifications and background jobs',
    audienceBenefit: 'Users can start long-running work and keep moving while the system reports completion, failures, access events, and anomaly alerts live.',
    implementationProof: 'Hangfire handles upload queues while SignalR broadcasts notification events through user, admin, company, owner, and accountant groups.',
    evidence: ['Hangfire queues', 'SignalR hub', 'Live inbox', 'Job status updates'],
  },
  {
    title: 'Multi-tenant role and company access',
    audienceBenefit: 'Business owners, accountants, and admins see the workflows appropriate to their role and company relationships.',
    implementationProof: 'React route guards, JWT roles, company context, accountant access requests, company ownership checks, and admin-only APIs enforce scoped access.',
    evidence: ['Admin role', 'Accountant role', 'Owner role', 'Company context'],
  },
  {
    title: 'Reports, dashboards, and charts',
    audienceBenefit: 'Companies get a quick operational view of reconciliation status, payable aging, and financial activity.',
    implementationProof: 'Report endpoints return dashboard stats, reconciliation reports, and aging reports rendered through MUI workspaces and Recharts visualizations.',
    evidence: ['Dashboard stats', 'Aging report', 'Reconciliation report', 'Charts'],
  },
  {
    title: 'Admin, audit logging, and security middleware',
    audienceBenefit: 'Admins can monitor users and logs while the platform records activity and applies consistent error/security handling.',
    implementationProof: 'Admin controllers expose user/log management, ActivityLoggingMiddleware records API activity, and security/exception middleware wraps the request pipeline.',
    evidence: ['Admin portal', 'Audit logs', 'Security headers', 'Error handling'],
  },
]

export const stackRationale = [
  'React, Vite, MUI, and Emotion keep the financial workspace fast to build while preserving a consistent, responsive interface.',
  'React Router, JWT, role guards, and company context make access rules explicit across public, protected, admin, accountant, and owner workflows.',
  'React Query, SignalR, Hangfire, and notification services keep long-running imports and realtime status updates coordinated without manual refresh.',
  'ClosedXML, iText, Tesseract, Gemini, Ollama, and the fine-tuned XLM-RoBERTa local model create a layered extraction pipeline for spreadsheets, digital PDFs, scanned PDFs, and structured invoice data.',
  'SQL Server stored procedures, DAL services, and a dedicated matching engine keep reconciliation behavior transparent, auditable, and tunable.',
  'xUnit, Vitest, Testing Library, MSW, ESLint, and jscpd provide regression coverage and maintainability checks across frontend and backend work.',
]
