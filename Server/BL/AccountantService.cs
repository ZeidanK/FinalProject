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
        private readonly DBservices _db;

        public AccountantService(DBservices db)
        {
            _db = db;
        }

        public List<AccountantInfo> GetPublicAccountants(long? requestingCompanyId) =>
            _db.GetPublicAccountants(requestingCompanyId);

        public (bool Success, string Error) SendRequest(long accountantId, long companyId, long requestedByUserId) =>
            _db.CreatePendingAccessRequest(accountantId, companyId, requestedByUserId);

        public List<AccessRequestRow> GetPendingRequests(long accountantId) =>
            _db.GetPendingRequestsByAccountant(accountantId);

        public List<CompanyRow> GetActiveCompanies(long accountantId) =>
            _db.GetActiveCompaniesByAccountant(accountantId);

        public bool RespondToRequest(long requestId, long accountantUserId, bool accept) =>
            _db.RespondToAccessRequest(requestId, accountantUserId, accept);
    }
}
