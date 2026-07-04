## Goal
- Implement full comprehensive unit tests for both frontend (React/Vite) and backend (ASP.NET Core 6.0) of the ReconFlow financial reconciliation application.

## Constraints & Preferences
- xUnit test project + Moq for backend
- Test project uses `Microsoft.NET.Sdk.Web` SDK (needed for `IWebHostEnvironment`/ASP.NET Core types)
- Frontend uses Vitest + React Testing Library + jsdom + MSW

## Progress
### Done
- **All 8 remaining controller test files** written and passing (Anomalies 6, Users 10, Admin 11, Accountants 14, Notifications 11, UploadJobs 17, Transactions 20, Invoices 22) — **175 controller tests total**
- **538 total backend tests, 0 failing** (up from 411)
- **19 frontend component test files** written (62 tests, up from 30): EmptyState (5), LogoMark (2), ErrorBoundary (2), SnackbarAlert (3), PageHeaderCard (5), ModalShell (4), PageSectionLayout (1), ConfidenceFieldRow (4), AuthShellLayout (2), FeatureWorkspacePage (5), GlobalNotifications (3), RecentActivityTimeline (5), ConfirmContext (4), NotificationBell (7), AuthenticatedLayout (5), InvoicePdfPreview (3), InvoiceVerificationModal (6), InstallmentMatchGroups (4), TransactionDetailsModal (5)
- **267 frontend tests, 0 failing** across 42 test files (up from 221/30)
- `IBackgroundJobClient.Enqueue` (extension method) workaround — mock `Create(Job, EnqueuedState)` instead
- All frontend context + services + utils + schemas tests remain green

### In Progress
- 15 frontend page components without tests
- 12 custom React hooks without tests

### Blocked
- (none)

## Key Decisions
- Hangfire `Enqueue<T>` is an extension method on `IBackgroundJobClient` — cannot be mocked with Moq; all Hangfire-dependent controller tests use `mockHangfire.Setup(x => x.Create(It.IsAny<Job>(), It.IsAny<EnqueuedState>()))`
- Download tests that return `PhysicalFileResult` create real temp file structures on disk using `Path.GetTempFileName()` / temp directories so the file existence check passes
- `ImportExcel_Deny_DeletesFile_ReturnsOk` test creates a real temp file so `System.IO.File.Delete()` doesn't throw `DirectoryNotFoundException`
- `GlobalNotifications` tests use a shared mutable `mockQueue` array (mutation pattern) to test both non-empty and empty states — avoids `vi.mocked` not being a function issues
- NotificationBell requires mocking 4 context hooks + 3 query/mutation hooks; uses shared mutable `let` variables for query state (isLoading, isError, etc.)
- `InvoicePdfPreview` requires mocking `react-pdf` to avoid `DOMMatrix is not defined` error from `pdfjs-dist`
- Loading state in `InvoicePdfPreview` is never visible in tests because `setLoading(true)` and `finally { setLoading(false) }` are batched by React 18

## Next Steps
1. Write tests for 15 frontend page components (Dashboard, Invoices, Transactions, Matches, Anomalies, Reports, Admin, Profile, etc.)
2. Write tests for 12 custom React hooks

## Critical Context
- .NET SDK **10.0.201** — subdirectory test projects still get compiled into main project; test project moved to `Tests\` solves this
- `DBservices` is a `partial class` across 14 files; many methods now `virtual` for Moq mocking
- Frontend test environment is jsdom with `globals: true` (no imports needed for `describe`/`it`/`expect`/`vi`)
- `vi.mock` hoists to top of file — `useNotification` variable from mock factory is not directly accessible in test scope; use shared mutable variables instead
- `react-pdf` `Document`/`Page` components require PDF worker setup — mock `react-pdf` in tests to avoid `DOMMatrix is not defined`
- `framer-motion` components render inside jsdom but animation properties are stripped
- NotificationBell uses `let` variables at module level for mock state; values captured by closure in factory functions
- InvoicePdfPreview always renders JSX — `open` prop only controls effects, not conditional rendering

## Relevant Files
- `Tests/FinalProjectAuthAPI.Tests/Controllers/` — 8 controller test files (175 total tests)
- `ClientSide/src/test/components/NotificationBell.test.jsx` — 7 tests, mocks 4 contexts + 3 query hooks using mutable `let` variables
- `ClientSide/src/test/components/AuthenticatedLayout.test.jsx` — 5 tests, mocks `NotificationBell` sub-component and contexts
- `ClientSide/src/test/components/InvoicePdfPreview.test.jsx` — 3 tests, mocks `react-pdf` to avoid `DOMMatrix` error
- `ClientSide/src/test/components/TransactionDetailsModal.test.jsx` — 5 tests for open/close/loading/error/data states
- `ClientSide/src/test/components/InstallmentMatchGroups.test.jsx` — 4 tests for loading/empty/groups/waiting states
- `ClientSide/src/test/components/InvoiceVerificationModal.test.jsx` — 6 tests for titles/actions/data/extraction
