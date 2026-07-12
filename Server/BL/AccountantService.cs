using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    /// <summary>
    /// Business logic for the accountant visibility and work-request system.
    /// </summary>
    public class AccountantService : IAccountantService
    {
        private readonly IDBservices _db;

        public AccountantService(IDBservices db)
        {
            _db = db;
        }

        public List<AccountantInfo> GetPublicAccountants(long? requestingCompanyId) =>
            _db.GetPublicAccountants(requestingCompanyId);

        public PagedAccountantsResponse GetPublicAccountantsPaginated(long? companyId, int page, int limit, string? search, string? sortBy, string? sortDirection) =>
            _db.GetPublicAccountantsPaginated(companyId, page, limit, search, sortBy, sortDirection);

        public (bool Success, string Error) SendRequest(long accountantId, long companyId, long requestedByUserId) =>
            _db.CreatePendingAccessRequest(accountantId, companyId, requestedByUserId);

        public List<AccessRequestRow> GetPendingRequests(long accountantId) =>
            _db.GetPendingRequestsByAccountant(accountantId);

        public List<CompanyRow> GetActiveCompanies(long accountantId) =>
            _db.GetActiveCompaniesByAccountant(accountantId);

        public bool RespondToRequest(long requestId, long accountantUserId, bool accept) =>
            _db.RespondToAccessRequest(requestId, accountantUserId, accept);

        public bool DisconnectAccountant(long accountantId, long companyId, long requestedByUserId) =>
            _db.DisconnectAccountantFromCompany(accountantId, companyId, requestedByUserId);

        public List<string> GetSpecialties(long userId) =>
            _db.GetAccountantSpecialties(userId);

        public bool AddSpecialty(long userId, string specialty) =>
            _db.AddAccountantSpecialty(userId, specialty);

        public bool RemoveSpecialty(long userId, string specialty) =>
            _db.RemoveAccountantSpecialty(userId, specialty);

        public List<string> GetCertifications(long userId) =>
            _db.GetAccountantCertifications(userId);

        public bool AddCertification(long userId, string certification) =>
            _db.AddAccountantCertification(userId, certification);

        public bool RemoveCertification(long userId, string certification) =>
            _db.RemoveAccountantCertification(userId, certification);

        public bool SubmitReview(long accountantUserId, long companyId, byte rating, string? review, long createdByUserId) =>
            _db.UpsertAccountantReview(accountantUserId, companyId, rating, review, createdByUserId);
    }
}
