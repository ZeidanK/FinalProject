using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IAnomalyService
    {
        List<AnomalyRow> GetByCompany(long companyId, string? status = null, string? severity = null, string? type = null);
        AnomalyRow? GetById(long id);
        AnomalyStatsRow GetStats(long companyId);
        (bool Success, long Id, string Error) Create(CreateAnomalyRequest req);
        (bool Success, string Error) Resolve(long id, long resolvedByUserId, ResolveAnomalyRequest req);
        (bool Success, string Error) KeepDuplicateInvoice(long id, long resolvedByUserId, KeepDuplicateInvoiceRequest req);
        (bool Success, long AnomalyId, string Error) EnsureDuplicateInvoiceAnomaly(
            long companyId,
            long duplicateInvoiceId,
            string invoiceNumber,
            string vendorName,
            decimal totalAmount,
            DateTime invoiceDate,
            string currency);
        (bool Success, long? AnomalyId, bool IsDuplicate, string Error) RegisterTransactionFileUpload(
            long companyId,
            string fileOriginalName,
            string filePath,
            long fileSize,
            long uploadedByUserId,
            string fileHashSha256,
            DateTime? firstTransactionDate,
            DateTime? lastTransactionDate);
    }
}
