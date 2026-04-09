using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface ICompanyService
    {
        List<CompanyRow> GetAll();
        CompanyRow? GetById(long id);
        List<CompanyRow> GetByUserId(long userId);
        (bool Success, long Id, string Error) Create(
            string name, long createdByUserId,
            string? registrationNumber = null,
            string? street = null, string? city = null,
            string? state = null, string? postalCode = null,
            string country = "USA",
            string? email = null, string? phone = null,
            string? website = null, string? taxId = null,
            string? vatNumber = null, DateTime? fiscalYearStart = null,
            string currency = "USD");
        bool Update(
            long id, string? name, string? street, string? city,
            string? state, string? postalCode, string? country,
            string? email, string? phone, string? website,
            string? taxId, string? vatNumber, bool? isActive);
        bool Delete(long id);
        bool EnsureUserHasFullCompanyAccess(long userId, long companyId);
    }
}
