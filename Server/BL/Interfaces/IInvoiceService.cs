using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IInvoiceService
    {
        List<InvoiceRow> GetByCompany(long companyId, string? status = null, DateTime? startDate = null, DateTime? endDate = null, bool? isMatched = null);
        InvoiceRow? GetById(long id);
        (bool Success, long Id, string Error) Create(CreateInvoiceRequest req, long uploadedByUserId);
        (bool Success, long Id, string Error) Create(CreateInvoiceRequest req, long uploadedByUserId,
            string? fileOriginalName, string? filePath, string? fileType, long? fileSize, decimal? aiConfidence);
        bool UpdateStatus(long id, string status);
        bool UpdateFileInfo(long id, string? fileOriginalName, string? filePath, string? fileType,
            long? fileSize, decimal? aiConfidence);
    }
}
