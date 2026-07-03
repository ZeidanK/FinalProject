using System.Security.Cryptography;
using System.Text;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.AnomalyDetection
{
    public class DuplicateInvoiceService
    {
        private readonly DBservices _db;
        private readonly AnomalyCrudService _anomalyCrud;

        public DuplicateInvoiceService(DBservices db, AnomalyCrudService anomalyCrud)
        {
            _db = db;
            _anomalyCrud = anomalyCrud;
        }

        public (bool Success, long AnomalyId, string Error) EnsureDuplicateInvoiceAnomaly(
            long companyId,
            long duplicateInvoiceId,
            string invoiceNumber,
            string vendorName,
            decimal totalAmount,
            DateTime invoiceDate,
            string currency)
        {
            var existingId = _db.GetOpenDuplicateInvoiceAnomalyId(
                companyId,
                invoiceNumber,
                totalAmount,
                invoiceDate);

            if (existingId.HasValue)
                return (true, existingId.Value, string.Empty);

            var createResult = _anomalyCrud.Create(new CreateAnomalyRequest
            {
                CompanyId = companyId,
                AnomalyType = "duplicate",
                Title = $"Duplicate invoice group: {invoiceNumber}",
                Description =
                    $"Duplicate invoice detected for invoice number '{invoiceNumber}', amount {totalAmount} {currency}, invoice date {invoiceDate:yyyy-MM-dd}. " +
                    $"Vendor: {vendorName}.",
                Severity = "high",
                SuggestedAction = "Review all duplicate receipts/invoices in this group and keep only the valid one(s).",
                RelatedInvoiceId = duplicateInvoiceId,
                Amount = totalAmount,
                DetectionMethod = "manual",
                DetectionConfidence = 1m,
            });

            return createResult.Success
                ? (true, createResult.Id, string.Empty)
                : (false, 0, createResult.Error);
        }

        public (bool Success, string Error) KeepDuplicateInvoice(
            long id, long resolvedByUserId,
            KeepDuplicateInvoiceRequest req)
        {
            if (req.KeepInvoiceId <= 0)
                return (false, "Invoice to keep is required.");

            var anomaly = _db.GetAnomalyById(id);
            if (anomaly is null)
                return (false, "Anomaly not found.");

            if (!_db.UserHasActiveCompanyAccess(resolvedByUserId, anomaly.CompanyId))
                return (false, "You do not have access to this company.");

            if (!string.Equals(anomaly.AnomalyType, "duplicate", StringComparison.OrdinalIgnoreCase)
                || !anomaly.RelatedInvoiceId.HasValue)
                return (false, "This anomaly is not a duplicate invoice group.");

            var signature = TryGetInvoiceSignature(anomaly.RelatedInvoiceId.Value);
            if (signature is null)
                return (false, "Could not identify the duplicate invoice group.");

            var groupRows = _db.GetDuplicateInvoiceAnomaliesBySignature(
                anomaly.CompanyId,
                signature.InvoiceNumber,
                signature.TotalAmount,
                signature.InvoiceDate,
                status: anomaly.Status);

            var anomalyIds = groupRows
                .Select(x => x.Id)
                .Distinct()
                .ToList();
            if (anomalyIds.Count == 0)
            {
                anomalyIds.Add(anomaly.Id);
            }

            var invoiceIds = _db.GetDuplicateInvoicesBySignature(
                anomaly.CompanyId,
                signature.InvoiceNumber,
                signature.TotalAmount,
                signature.InvoiceDate,
                includeDeleted: false)
                .Select(x => x.Id)
                .Distinct()
                .ToList();

            if (invoiceIds.Count <= 1)
                return (false, "There are no duplicate invoices to resolve.");

            if (!invoiceIds.Contains(req.KeepInvoiceId))
                return (false, "The selected invoice is not part of this duplicate group.");

            var deletedInvoiceIds = invoiceIds
                .Where(invoiceId => invoiceId != req.KeepInvoiceId)
                .OrderBy(invoiceId => invoiceId)
                .ToList();

            var notes = string.IsNullOrWhiteSpace(req.ResolutionNotes)
                ? $"Kept invoice ID {req.KeepInvoiceId}; soft deleted duplicate invoice IDs: {string.Join(", ", deletedInvoiceIds)}."
                : req.ResolutionNotes.Trim();

            var ok = _db.ApplyDuplicateInvoiceDecision(
                anomalyIds,
                invoiceIds,
                req.KeepInvoiceId,
                resolvedByUserId,
                notes);

            return ok ? (true, string.Empty) : (false, "Failed to apply duplicate invoice decision.");
        }

        public InvoiceSignature? TryGetInvoiceSignature(long invoiceId)
        {
            var invoice = _db.GetInvoiceById(invoiceId);
            if (invoice is null || string.IsNullOrWhiteSpace(invoice.InvoiceNumber))
                return null;

            return new InvoiceSignature
            {
                InvoiceNumber = invoice.InvoiceNumber.Trim(),
                TotalAmount = invoice.TotalAmount,
                InvoiceDate = invoice.InvoiceDate.Date,
            };
        }

        public string BuildInvoiceGroupKey(
            long companyId,
            string invoiceNumber,
            decimal totalAmount,
            DateTime invoiceDate)
        {
            var raw = $"invoice|{companyId}|{invoiceNumber.Trim().ToLowerInvariant()}|{totalAmount:0.####}|{invoiceDate:yyyy-MM-dd}";
            return $"inv:{ComputeStableHash(raw)}";
        }

        private static string ComputeStableHash(string value)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        public sealed class InvoiceSignature
        {
            public string InvoiceNumber { get; set; } = string.Empty;
            public decimal TotalAmount { get; set; }
            public DateTime InvoiceDate { get; set; }
        }
    }
}
