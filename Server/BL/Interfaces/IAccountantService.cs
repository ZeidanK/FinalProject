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

        List<string> GetSpecialties(long userId);
        bool AddSpecialty(long userId, string specialty);
        bool RemoveSpecialty(long userId, string specialty);
        List<string> GetCertifications(long userId);
        bool AddCertification(long userId, string certification);
        bool RemoveCertification(long userId, string certification);
        bool SubmitReview(long accountantUserId, long companyId, byte rating, string? review, long createdByUserId);
    }
}
