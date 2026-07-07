using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    /// <summary>
    /// Business logic for bank account management.
    /// </summary>
    public class BankAccountService : IBankAccountService
    {
        private readonly IDBservices _db;

        public BankAccountService(IDBservices db)
        {
            _db = db;
        }

        public List<BankAccountRow> GetByCompany(long companyId) =>
            _db.GetBankAccountsByCompany(companyId);

        public BankAccountRow? GetById(long id) => _db.GetBankAccountById(id);

        public (bool Success, long Id, string Error) Create(
            long companyId, string bankName, string accountType,
            long? createdByUserId,
            string? accountName = null,
            string? accountNumberMasked = null,
            string currency = "USD",
            decimal balance = 0)
        {
            if (string.IsNullOrWhiteSpace(bankName))
                return (false, 0, "Bank name is required.");
            if (string.IsNullOrWhiteSpace(accountType))
                return (false, 0, "Account type is required.");

            var id = _db.CreateBankAccount(
                companyId, bankName.Trim(), accountType.Trim(),
                createdByUserId, accountName, accountNumberMasked,
                currency, balance);

            return id > 0
                ? (true, id, string.Empty)
                : (false, 0, "Failed to create bank account.");
        }

        public bool Update(
            long id, string? bankName, string? accountName,
            string? accountNumberMasked, string? accountType,
            string? currency, bool? isActive, decimal? balance,
            DateTime? lastSyncAt) =>
            _db.UpdateBankAccount(id, bankName, accountName,
                accountNumberMasked, accountType, currency,
                isActive, balance, lastSyncAt);

        public bool Delete(long id) => _db.SoftDeleteBankAccount(id);
    }
}
