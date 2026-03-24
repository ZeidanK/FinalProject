using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    /// <summary>
    /// Business logic for invoice management.
    /// </summary>
    public class InvoiceService
    {
        private readonly DBservices _db = new();

        public List<InvoiceRow> GetByCompany(
            long companyId, string? status = null,
            DateTime? startDate = null, DateTime? endDate = null,
            bool? isMatched = null) =>
            _db.GetInvoicesByCompany(companyId, status, startDate, endDate, isMatched);

        public InvoiceRow? GetById(long id) => _db.GetInvoiceById(id);

        public (bool Success, long Id, string Error) Create(
            CreateInvoiceRequest req, long uploadedByUserId)
        {
            if (string.IsNullOrWhiteSpace(req.InvoiceNumber))
                return (false, 0, "Invoice number is required.");
            if (string.IsNullOrWhiteSpace(req.VendorName))
                return (false, 0, "Vendor name is required.");
            if (req.TotalAmount <= 0)
                return (false, 0, "Total amount must be greater than zero.");

            var invoiceId = _db.CreateInvoice(
                req.CompanyId, req.InvoiceNumber.Trim(), req.VendorName.Trim(),
                req.InvoiceDate, req.TotalAmount, uploadedByUserId,
                req.VendorTaxId, req.DueDate, req.PaymentDate,
                req.Subtotal ?? req.TotalAmount, req.VatRate, req.VatAmount,
                req.Currency ?? "USD", req.FileOriginalName, req.FilePath,
                req.FileType, req.FileSize, req.AiExtractionConfidence,
                req.LastFourDigitsCard);

            if (invoiceId <= 0)
                return (false, 0, "Failed to create invoice.");

            // Insert line items if provided
            if (req.LineItems != null)
                foreach (var li in req.LineItems)
                    _db.CreateLineItem(
                        invoiceId, li.Description, li.UnitPrice, li.TotalAmount,
                        li.LineNumber, li.Category, li.Quantity ?? 1,
                        li.VatRate, li.AiConfidenceScore);

            return (true, invoiceId, string.Empty);
        }

        public bool UpdateStatus(long id, string status)
        {
            var validStatuses = new HashSet<string>
                { "uploaded", "processing", "extracted", "verified", "matched", "rejected" };

            if (!validStatuses.Contains(status))
                return false;

            return _db.UpdateInvoiceStatus(id, status);
        }
    }
}
