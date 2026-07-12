using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IAccountantService
    {
        List<AccountantInfo> GetPublicAccountants(long? requestingCompanyId);
        PagedAccountantsResponse GetPublicAccountantsPaginated(long? companyId, int page, int limit, string? search, string? sortBy, string? sortDirection);
        (bool Success, string Error) SendRequest(long accountantId, long companyId, long requestedByUserId);
        List<AccessRequestRow> GetPendingRequests(long accountantId);
        List<CompanyRow> GetActiveCompanies(long accountantId);
        bool RespondToRequest(long requestId, long accountantUserId, bool accept);
        bool DisconnectAccountant(long accountantId, long companyId, long requestedByUserId);
    }
}
