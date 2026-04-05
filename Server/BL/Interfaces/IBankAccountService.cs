using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IBankAccountService
    {
        List<BankAccountRow> GetByCompany(long companyId);
        BankAccountRow? GetById(long id);
        (bool Success, long Id, string Error) Create(
            long companyId, string bankName, string accountType,
            long? createdByUserId,
            string? accountName = null,
            string? accountNumberMasked = null,
            string currency = "USD",
            decimal balance = 0);
        bool Update(
            long id, string? bankName, string? accountName,
            string? accountNumberMasked, string? accountType,
            string? currency, bool? isActive, decimal? balance,
            DateTime? lastSyncAt);
        bool Delete(long id);
    }
}
