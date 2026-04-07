using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    /// <summary>
    /// Business logic for invoice management.
    /// </summary>
    public class InvoiceService : IInvoiceService
    {
        private readonly DBservices _db;
        private readonly IMatchService? _matchService;

        // Constructor for DI (optional IMatchService to avoid circular dependency issues)
        public InvoiceService(DBservices db, IMatchService? matchService = null)
        {
            _db = db;
            _matchService = matchService;
        }

        public List<InvoiceRow> GetByCompany(
            long companyId, string? status = null,
            DateTime? startDate = null, DateTime? endDate = null,
            bool? isMatched = null) =>
            _db.GetInvoicesByCompany(companyId, status, startDate, endDate, isMatched);

        public InvoiceRow? GetById(long id) => _db.GetInvoiceById(id);

        public (bool Success, long Id, string Error) Create(
            CreateInvoiceRequest req, long uploadedByUserId)
            => Create(req, uploadedByUserId, null, null, null, null, null);

        public (bool Success, long Id, string Error) Create(
            CreateInvoiceRequest req, long uploadedByUserId,
            string? fileOriginalName, string? filePath, string? fileType,
            long? fileSize, decimal? aiConfidence)
        {
            if (!_db.UserHasActiveCompanyAccess(uploadedByUserId, req.CompanyId))
                return (false, 0, "You do not have access to the selected company.");

            if (string.IsNullOrWhiteSpace(req.InvoiceNumber))
                return (false, 0, "Invoice number is required.");
            if (string.IsNullOrWhiteSpace(req.VendorName))
                return (false, 0, "Vendor name is required.");

            var invoiceId = _db.CreateInvoice(
                req.CompanyId, req.InvoiceNumber.Trim(), req.VendorName.Trim(),
                req.InvoiceDate, req.TotalAmount, uploadedByUserId,
                req.VendorTaxId, req.DueDate, req.PaymentDate,
                req.Subtotal == 0 ? req.TotalAmount : req.Subtotal,
                req.VatRate, req.VatAmount,
                string.IsNullOrEmpty(req.Currency) ? "USD" : req.Currency,
                fileOriginalName, filePath, fileType, fileSize, aiConfidence,
                req.LastFourDigitsCard,
                req.ItemCount,
                req.PaymentPlanTotalInstallments,
                req.PaymentPlanInstallmentAmount,
                req.PaymentPlanFrequency,
                req.PaymentPlanDescription);

            if (invoiceId <= 0)
                return (false, 0, "Failed to create invoice.");

            // Insert line items if provided
            if (req.LineItems != null)
                foreach (var li in req.LineItems)
                    _db.CreateLineItem(
                        invoiceId, li.Description, li.UnitPrice, li.TotalAmount,
                        li.LineNumber, li.Category, li.Quantity,
                        li.VatRate, li.AiConfidenceScore);

            return (true, invoiceId, string.Empty);
        }

        public (bool Success, string Error, bool NotFound) Update(
            long id, CreateInvoiceRequest req, long verifiedByUserId)
        {
            var existing = _db.GetInvoiceById(id);
            if (existing is null)
                return (false, "Invoice not found.", true);

            if (string.IsNullOrWhiteSpace(req.InvoiceNumber))
                return (false, "Invoice number is required.", false);
            if (string.IsNullOrWhiteSpace(req.VendorName))
                return (false, "Vendor name is required.", false);

            var ok = _db.UpdateInvoice(
                id,
                req.CompanyId,
                req.InvoiceNumber.Trim(),
                req.VendorName.Trim(),
                req.InvoiceDate,
                req.TotalAmount,
                req.VendorTaxId,
                req.DueDate,
                req.PaymentDate,
                req.Subtotal == 0 ? req.TotalAmount : req.Subtotal,
                req.VatRate,
                req.VatAmount,
                string.IsNullOrEmpty(req.Currency) ? "USD" : req.Currency,
                req.FileOriginalName,
                req.FilePath,
                req.FileType,
                req.FileSize,
                req.AiExtractionConfidence,
                req.LastFourDigitsCard,
                req.ItemCount,
                req.PaymentPlanTotalInstallments,
                req.PaymentPlanInstallmentAmount,
                req.PaymentPlanFrequency,
                req.PaymentPlanDescription,
                verifiedByUserId,
                req.LineItems ?? new List<CreateLineItemRequest>());

            if (!ok)
                return (false, "Failed to update invoice.", false);

            return (true, string.Empty, false);
        }

        public bool UpdateStatus(long id, string status)
        {
            var validStatuses = new HashSet<string>
                { "uploaded", "processing", "extracted", "verified", "matched", "rejected" };

            if (!validStatuses.Contains(status))
                return false;

            return _db.UpdateInvoiceStatus(id, status);
        }

        public bool Delete(long id)
        {
            if (id <= 0)
                return false;

            return _db.DeleteInvoice(id);
        }

        public (List<long> DeletedIds, List<long> NotFoundIds) BulkDelete(List<long> ids)
        {
            if (ids == null || ids.Count == 0)
                return (new List<long>(), new List<long>());

            var normalizedIds = ids.Where(i => i > 0).Distinct().ToList();
            if (normalizedIds.Count == 0)
                return (new List<long>(), new List<long>());

            return _db.BulkDeleteInvoices(normalizedIds);
        }

        public bool UpdateFileInfo(long id, string? fileOriginalName, string? filePath,
            string? fileType, long? fileSize, decimal? aiConfidence)
        {
            return _db.UpdateInvoiceFileInfo(id, fileOriginalName, filePath,
                fileType, fileSize, aiConfidence);
        }

        /// <summary>
        /// Attempts to automatically match a newly created invoice with transactions.
        /// Returns match result with count of matches found.
        /// </summary>
        public async Task<(bool Success, long? MatchId, string Message, decimal? MatchScore)> AutoMatchAfterCreateAsync(
            long invoiceId, long userId, decimal minConfidenceThreshold = 70m)
        {
            if (_matchService == null)
                return (false, null, "Match service not available.", null);

            return await _matchService.AutoMatchAsync(invoiceId, userId, minConfidenceThreshold);
        }
    }
}
