using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.DAL
{
    public interface IDBservices
    {
        User? GetUserByEmail(string email);
        bool CreateUser(User user);
        void UpdateLastLogin(long userId);

        User? GetUserById(long id);
        List<User> GetAllUsers();
        bool UpdateUser(long id, string? name, string? phone, string? profilePicture, string? bio = null, int? yearsOfExperience = null, decimal? hourlyRate = null, string? location = null, string? website = null);
        string? GetPasswordHash(long id);
        bool ChangePassword(long id, string newPasswordHash);
        bool UpdateUserVisibility(long userId, bool isPublic);
        List<AccountantInfo> GetPublicAccountants(long? requestingCompanyId);
        PagedAccountantsResponse GetPublicAccountantsPaginated(long? companyId, int page, int limit, string? search, string? sortBy, string? sortDirection);
        bool DeleteUserAccount(long userId);
        bool ReactivateUserAccount(long userId);

        List<CompanyRow> GetAllCompanies();
        CompanyRow? GetCompanyById(long id);
        List<CompanyRow> GetCompaniesByUserId(long userId);
        bool UserHasActiveCompanyAccess(long userId, long companyId);
        bool EnsureUserHasFullCompanyAccess(long userId, long companyId);
        long CreateCompany(string name, long createdByUserId, string? registrationNumber, string? street, string? city, string? state, string? postalCode, string country, string? email, string? phone, string? website, string? taxId, string? vatNumber, DateTime? fiscalYearStart, string currency);
        bool UpdateCompany(long id, string? name, string? street, string? city, string? state, string? postalCode, string? country, string? email, string? phone, string? website, string? taxId, string? vatNumber, bool? isActive);
        (bool Success, string Error) CreatePendingAccessRequest(long accountantUserId, long companyId, long requestedByUserId);
        List<AccessRequestRow> GetPendingRequestsByAccountant(long accountantId);
        List<CompanyRow> GetActiveCompaniesByAccountant(long accountantId);
        bool RespondToAccessRequest(long requestId, long accountantUserId, bool accept);
        bool DisconnectAccountantFromCompany(long accountantUserId, long companyId, long requestedByUserId);

        bool AddAccountantSpecialty(long userId, string specialty);
        bool RemoveAccountantSpecialty(long userId, string specialty);
        bool AddAccountantCertification(long userId, string certification);
        bool RemoveAccountantCertification(long userId, string certification);
        bool UpsertAccountantReview(long accountantUserId, long companyId, byte rating, string? review, long createdByUserId);
        List<ReviewRow> GetAccountantReviews(long accountantUserId);
        List<string> GetAccountantSpecialties(long userId);
        List<string> GetAccountantCertifications(long userId);

        List<BankAccountRow> GetBankAccountsByCompany(long companyId);
        BankAccountRow? GetBankAccountById(long id);
        long CreateBankAccount(long companyId, string bankName, string accountType, long? createdByUserId, string? accountName, string? accountNumberMasked, string currency, decimal balance);
        bool UpdateBankAccount(long id, string? bankName, string? accountName, string? accountNumberMasked, string? accountType, string? currency, bool? isActive, decimal? balance, DateTime? lastSyncAt);
        bool SoftDeleteBankAccount(long id);

        PagedResponse<TransactionRow> GetTransactionsByCompany(long companyId, TransactionFilterRequest filter);
        TransactionRow? GetTransactionById(long id);
        long CreateTransaction(long companyId, long? createdByUserId, TransactionInsertData data);
        List<long> BulkCreateTransactions(long companyId, long? createdByUserId, IEnumerable<TransactionInsertData> rows, long? fileUploadId = null);
        bool DeleteTransaction(long id);
        (List<long> DeletedIds, List<long> NotFoundIds) BulkDeleteTransactions(IEnumerable<long> ids);
        int CountTransactionsByFileUploadId(long fileUploadId);
        List<TransactionRow> GetTransactionsByFileUploadIds(List<long> fileUploadIds);
        bool SetTransactionRequiresInvoice(long id, bool requiresInvoice);

        List<InvoiceRow> GetInvoicesByCompany(long companyId, string? status, DateTime? startDate, DateTime? endDate, bool? isMatched);
        InvoiceRow? GetInvoiceById(long id);
        long CreateInvoice(long companyId, string invoiceNumber, string vendorName, DateTime invoiceDate, decimal totalAmount, long? uploadedByUserId, string? vendorTaxId, DateTime? dueDate, DateTime? paymentDate, decimal subtotal, decimal? vatRate, decimal? vatAmount, string currency, string? fileOriginalName, string? filePath, string? fileType, long? fileSize, decimal? aiConfidence, string? lastFourDigitsCard, int? itemCount = null, int? paymentPlanTotalInstallments = null, decimal? paymentPlanInstallmentAmount = null, string? paymentPlanFrequency = null, string? paymentPlanDescription = null, int? paymentPlanCurrentInstallment = null, bool isDuplicate = false);
        long? GetInvoiceIdByNumber(long companyId, string invoiceNumber);
        long CreateLineItem(long invoiceId, string description, decimal unitPrice, decimal totalAmount, int? lineNumber, string? category, decimal quantity, decimal? vatRate, decimal? aiConfidenceScore);
        bool UpdateInvoiceStatus(long id, string status);
        bool MarkInvoiceVerified(long id, long verifiedByUserId);
        bool UpdateInvoiceFileInfo(long id, string? fileOriginalName, string? filePath, string? fileType, long? fileSize, decimal? aiConfidence);
        bool UpdateInvoice(long id, long companyId, string invoiceNumber, string vendorName, DateTime invoiceDate, decimal totalAmount, string? vendorTaxId, DateTime? dueDate, DateTime? paymentDate, decimal subtotal, decimal? vatRate, decimal? vatAmount, string currency, string? fileOriginalName, string? filePath, string? fileType, long? fileSize, decimal? aiConfidence, string? lastFourDigitsCard, int? itemCount, int? paymentPlanTotalInstallments, decimal? paymentPlanInstallmentAmount, string? paymentPlanFrequency, string? paymentPlanDescription, int? paymentPlanCurrentInstallment, long? verifiedByUserId, List<CreateLineItemRequest> lineItems);
        List<InvoiceRow> GetUnmatchedInvoicesByCompany(long companyId);
        bool DeleteInvoice(long id);
        (List<long> DeletedIds, List<long> NotFoundIds) BulkDeleteInvoices(IEnumerable<long> ids);

        List<AnomalyRow> GetAnomaliesByCompany(long companyId, string? status, string? severity, string? type);
        AnomalyRow? GetAnomalyById(long id);
        long CreateAnomaly(long companyId, string anomalyType, string title, string description, string severity, string? suggestedAction, long? relatedInvoiceId, long? relatedTransactionId, long? relatedMatchId, decimal? amount, string detectionMethod, decimal? detectionConfidence);
        bool ResolveAnomaly(long id, long resolvedByUserId, string? resolutionNotes, string status);
        bool ResolveAnomalies(IEnumerable<long> ids, long resolvedByUserId, string? resolutionNotes, string status);
        bool ApplyDuplicateInvoiceDecision(IEnumerable<long> anomalyIds, IEnumerable<long> invoiceIds, long keepInvoiceId, long resolvedByUserId, string? resolutionNotes);
        bool RestoreDuplicateInvoices(IEnumerable<long> invoiceIds);
        long? GetOpenDuplicateInvoiceAnomalyId(long companyId, string invoiceNumber, decimal totalAmount, DateTime invoiceDate);
        List<AnomalyRow> GetDuplicateInvoiceAnomaliesBySignature(long companyId, string invoiceNumber, decimal totalAmount, DateTime invoiceDate, string? status);
        List<InvoiceRow> GetDuplicateInvoicesBySignature(long companyId, string invoiceNumber, decimal totalAmount, DateTime invoiceDate, bool includeDeleted = true, DateTime? createdBefore = null);
        void EnsureTransactionFileUploadsTable();
        long CreateTransactionFileUpload(long companyId, string fileHashSha256, string? fileOriginalName, string? filePath, long? fileSize, long? uploadedByUserId);
        int CountTransactionFileUploadsByHash(long companyId, string fileHashSha256);
        long? GetOpenDuplicateFileAnomalyId(long companyId, string fileHashSha256);
        bool AssignTransactionFileUploadAnomaly(long uploadId, long anomalyId);
        List<TransactionFileUploadRow> GetTransactionFileUploadsByAnomalyId(long anomalyId);
        List<TransactionFileUploadRow> GetTransactionFileUploadsByHash(long companyId, string fileHashSha256, DateTime? createdBefore = null);
        string? GetClosestTransactionFileHash(long companyId, DateTime anomalyCreatedAt);
        bool AssignTransactionFileUploadsByHashAnomaly(long companyId, string fileHashSha256, long anomalyId);
        TransactionFileUploadRow? GetTransactionFileUploadById(long uploadId);
        bool DeleteTransactionFileUpload(long uploadId);
        List<AnomalyRow> GetDuplicateFileAnomaliesByHash(long companyId, string fileHashSha256, string? status);
        AnomalyStatsRow GetAnomalyStats(long companyId);

        List<MatchRow> GetMatchesByCompany(long companyId);
        MatchRow? GetMatchById(long id);
        long CreateMatch(long invoiceId, long transactionId, decimal matchedAmount, string matchMethod, long? matchedByUserId, string matchType, decimal? matchConfidence, string? matchReason, int? installmentNumber = null, string? installmentNote = null);
        bool DeleteMatch(long id);
        List<MatchRow> GetMatchesByInvoice(long invoiceId);
        List<TransactionCandidate> GetCandidateTransactions(long companyId);
        List<VendorAlias> GetVendorAliases(long companyId);
        void RecordVendorAlias(long companyId, string vendorName, string transactionDescription);
        void RejectVendorAlias(long companyId, string vendorName, string transactionDescription);

        long CreateNotification(CreateNotificationRequest req);
        List<NotificationRow> CreateCompanyNotifications(long companyId, Guid eventId, NotificationMessage message, long? excludeUserId = null, long? excludeUserId2 = null);
        NotificationRow? GetNotificationById(long id, long userId);
        NotificationInboxDbResult GetNotificationInbox(long userId, string view, long? companyId, DateTime? cursorCreatedAt, long? cursorId, int take);
        bool MarkNotificationRead(long id, long userId);
        int MarkAllNotificationsRead(long userId, string view, long? companyId);
        NotificationUnreadCounts GetNotificationUnreadCounts(long userId, long? companyId, string view);
        List<long> GetActiveUserIdsByCompany(long companyId);
        bool IsUserActive(long userId);
        int DeleteExpiredNotifications(int readRetentionDays, int unreadRetentionDays);
        bool IsCompanyCreator(long userId, long companyId);

        long CreateUploadJob(CreateUploadJobRequest request);
        bool SetUploadJobHangfireId(long jobId, string? hangfireJobId);
        bool MarkUploadJobProcessing(long jobId);
        bool MarkUploadJobCompleted(long jobId, string? resultJson);
        bool TryBeginUploadJobVerification(long jobId);
        bool MarkUploadJobVerified(long jobId, string? resultJson = null);
        bool RestoreUploadJobCompleted(long jobId, string? resultJson, string? errorMessage = null);
        bool MarkUploadJobFailed(long jobId, string errorMessage);
        bool UpdateUploadJobProgress(long jobId, int progressPercent, string? resultJson = null);
        UploadJobRow? GetUploadJobById(long jobId);
        List<UploadJobRow> GetUploadJobsByUser(long userId, long? companyId = null, string? status = null, int take = 50);
        bool DeleteUploadJob(long jobId);

        DashboardStatsRow GetDashboardStats(long companyId);
        ReconciliationReport GetReconciliationReport(long companyId, DateTime? startDate, DateTime? endDate);
        PayablesAgingReport GetPayablesAgingReport(long companyId, DateTime asOfDate);

        void InsertSystemLog(CreateSystemLogRequest log);
        void InsertAuditLog(CreateAuditLogRequest log);

        AdminStatsRow GetAdminStats();
        PagedResult<AdminUserRow> GetAdminUsers(int page, int limit, string? role, string? search);
        (long Id, bool IsBanned) ToggleUserBan(long id);
        PagedResult<SystemLogRow> GetSystemLogs(int page, int limit, string? level, string? category);
        PagedResult<AuditLogRow> GetAuditLogs(int page, int limit, long? companyId);

        int ClearSystemLogs();
        int ClearAuditLogs();
        bool DeleteSystemLog(long id);
        bool DeleteAuditLog(long id);
    }
}
