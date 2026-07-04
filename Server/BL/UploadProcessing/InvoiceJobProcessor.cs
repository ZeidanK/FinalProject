using System.Text.Json;
using System.Text.Json.Serialization;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.UploadProcessing
{
    public class InvoiceJobProcessor
    {
        private readonly IUploadJobService _jobSvc;
        private readonly IFileStorageService _fileSvc;
        private readonly IPdfExtractionService _pdfSvc;
        private readonly IInvoiceService _invoiceSvc;
        private readonly IAnomalyService _anomalySvc;
        private readonly UploadJobNotificationService _notification;

        private static readonly JsonSerializerOptions _camelCase = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        public InvoiceJobProcessor(
            IUploadJobService jobSvc,
            IFileStorageService fileSvc,
            IPdfExtractionService pdfSvc,
            IInvoiceService invoiceSvc,
            IAnomalyService anomalySvc,
            UploadJobNotificationService notification)
        {
            _jobSvc = jobSvc;
            _fileSvc = fileSvc;
            _pdfSvc = pdfSvc;
            _invoiceSvc = invoiceSvc;
            _anomalySvc = anomalySvc;
            _notification = notification;
        }

        public virtual async Task ProcessAsync(long jobId)
        {
            var job = _jobSvc.GetById(jobId);
            if (job == null)
                return;

            _jobSvc.MarkProcessing(jobId);
            _jobSvc.UpdateProgress(jobId, 10);
            await _notification.NotifyUploadJobUpdatedAsync(_jobSvc, jobId);

            try
            {
                var fullPath = _fileSvc.GetInvoiceFullPath(job.FilePath);
                var fileName = string.IsNullOrWhiteSpace(job.FileOriginalName)
                    ? Path.GetFileName(fullPath)
                    : job.FileOriginalName;

                PdfExtractionResult extracted;
                using (var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read))
                {
                    extracted = await _pdfSvc.ExtractAsync(stream, fileName);
                }

                _jobSvc.UpdateProgress(jobId, 60);
                await _notification.NotifyUploadJobUpdatedAsync(_jobSvc, jobId);

                if (string.Equals(job.JobType, UploadJobTypes.InvoiceUploadAndCreate, StringComparison.OrdinalIgnoreCase))
                {
                    var request = BuildInvoiceRequest(job.CompanyId, extracted);
                    var (success, invoiceId, error, isDuplicate) = _invoiceSvc.Create(
                        request,
                        job.UserId,
                        fileName,
                        job.FilePath,
                        string.IsNullOrWhiteSpace(job.FileType) ? "application/pdf" : job.FileType,
                        job.FileSize,
                        extracted.ExtractionConfidence);

                    if (!success)
                    {
                        _jobSvc.MarkFailed(jobId, error);
                        _notification.LogUploadJobFailure(job, "Invoice upload job failed", error);
                        await _notification.NotifyUploadJobUpdatedAsync(_jobSvc, jobId);
                        return;
                    }

                    _invoiceSvc.UpdateStatus(invoiceId, "extracted");

                    var result = JsonSerializer.Serialize(new
                    {
                        invoiceId,
                        isDuplicate,
                        extractedData = extracted,
                        message = "Invoice created from PDF in background."
                    }, _camelCase);

                    _jobSvc.MarkCompleted(jobId, result);
                    await _notification.NotifyUploadJobUpdatedAsync(_jobSvc, jobId);

                    if (isDuplicate)
                        await _notification.NotifyDuplicateInvoiceAnomalyAsync(_anomalySvc, job.CompanyId, invoiceId);
                    return;
                }

                var extractOnlyResult = JsonSerializer.Serialize(new
                {
                    extractedData = extracted,
                    message = "Invoice PDF processed in background."
                }, _camelCase);

                _jobSvc.MarkCompleted(jobId, extractOnlyResult);
                await _notification.NotifyUploadJobUpdatedAsync(_jobSvc, jobId);
            }
            catch (Exception ex)
            {
                _jobSvc.MarkFailed(jobId, ex.Message);
                _notification.LogUploadJobFailure(job, "Invoice upload job crashed", ex.Message, "ERROR");
                await _notification.NotifyUploadJobUpdatedAsync(_jobSvc, jobId);
            }
        }

        private static CreateInvoiceRequest BuildInvoiceRequest(long companyId, PdfExtractionResult extracted)
        {
            return new CreateInvoiceRequest
            {
                CompanyId = companyId,
                InvoiceNumber = extracted.InvoiceNumber ?? $"PDF-{DateTime.UtcNow:yyyyMMddHHmmss}",
                VendorName = extracted.VendorName ?? "Unknown Vendor",
                InvoiceDate = extracted.InvoiceDate ?? DateTime.UtcNow,
                TotalAmount = extracted.TotalAmount ?? 0,
                Subtotal = extracted.Subtotal ?? 0,
                VatRate = extracted.VatRate,
                VatAmount = extracted.VatAmount,
                Currency = extracted.Currency ?? "USD",
                VendorTaxId = extracted.VendorTaxId,
                LastFourDigitsCard = extracted.LastFourDigitsCard,
                ItemCount = extracted.ItemCount,
                PaymentPlanTotalInstallments = extracted.PaymentPlan?.TotalInstallments,
                PaymentPlanInstallmentAmount = extracted.PaymentPlan?.InstallmentAmount,
                PaymentPlanFrequency = extracted.PaymentPlan?.Frequency,
                PaymentPlanDescription = extracted.PaymentPlan?.Description,
                PaymentPlanCurrentInstallment = extracted.PaymentPlan?.CurrentInstallment,
                LineItems = extracted.LineItems.Select((li, idx) => new CreateLineItemRequest
                {
                    Description = li.Description,
                    Quantity = li.Quantity,
                    UnitPrice = li.UnitPrice,
                    TotalAmount = li.TotalAmount,
                    VatRate = li.VatRate,
                    Category = li.Category,
                    LineNumber = idx + 1,
                    AiConfidenceScore = li.AiConfidenceScore
                }).ToList()
            };
        }
    }
}
