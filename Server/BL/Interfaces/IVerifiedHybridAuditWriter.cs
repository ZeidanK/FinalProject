using FinalProjectAuthAPI.BL.InvoiceVerification;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IVerifiedHybridAuditWriter
    {
        Task AppendVerifiedAsync(
            UploadJobRow job,
            StoredInvoiceJobResult storedPayload,
            PdfExtractionResult verifiedResult,
            string verificationSource);
    }
}
