using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using System.Data.SqlClient;

namespace FinalProjectAuthAPI.BL
{
    /// <summary>
    /// Business logic for company management.
    /// </summary>
    public class CompanyService : ICompanyService
    {
        private readonly DBservices _db;

        public CompanyService(DBservices db)
        {
            _db = db;
        }

        public List<CompanyRow> GetAll() => _db.GetAllCompanies();

        public CompanyRow? GetById(long id) => _db.GetCompanyById(id);

        public List<CompanyRow> GetByUserId(long userId) => _db.GetCompaniesByUserId(userId);

        public (bool Success, long Id, string Error) Create(
            string name, long createdByUserId,
            string? registrationNumber = null,
            string? street = null, string? city = null,
            string? state = null, string? postalCode = null,
            string country = "USA",
            string? email = null, string? phone = null,
            string? website = null, string? taxId = null,
            string? vatNumber = null, DateTime? fiscalYearStart = null,
            string currency = "USD")
        {
            if (string.IsNullOrWhiteSpace(name))
                return (false, 0, "Company name is required.");

            var normalizedRegistrationNumber = string.IsNullOrWhiteSpace(registrationNumber)
                ? null
                : registrationNumber.Trim();

            try
            {
                var id = _db.CreateCompany(
                    name.Trim(), createdByUserId, normalizedRegistrationNumber,
                    street, city, state, postalCode, country,
                    email, phone, website, taxId, vatNumber,
                    fiscalYearStart, currency);

                return id > 0
                    ? (true, id, string.Empty)
                    : (false, 0, "Failed to create company.");
            }
            catch (SqlException ex) when (ex.Number is 2601 or 2627)
            {
                return (false, 0, "Company registration number must be unique.");
            }
            catch
            {
                return (false, 0, "Failed to create company.");
            }
        }

        public bool Update(
            long id, string? name, string? street, string? city,
            string? state, string? postalCode, string? country,
            string? email, string? phone, string? website,
            string? taxId, string? vatNumber, bool? isActive) =>
            _db.UpdateCompany(id, name, street, city, state,
                postalCode, country, email, phone, website,
                taxId, vatNumber, isActive);

        public bool Delete(long id) =>
            _db.UpdateCompany(id,
                name: null,
                street: null,
                city: null,
                state: null,
                postalCode: null,
                country: null,
                email: null,
                phone: null,
                website: null,
                taxId: null,
                vatNumber: null,
                isActive: false);
    }
}
