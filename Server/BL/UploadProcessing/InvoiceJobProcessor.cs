using System.IO;
using System.Text.Json;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.BL.InvoiceVerification;
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
        private readonly IUploadJobNotificationService _notification;
        private readonly InvoiceJobPayloadSerializer _resultSerializer;
        private readonly IWebHostEnvironment _env;

        public InvoiceJobProcessor(
            IUploadJobService jobSvc,
            IFileStorageService fileSvc,
            IPdfExtractionService pdfSvc,
            IInvoiceService invoiceSvc,
            IAnomalyService anomalySvc,
            IUploadJobNotificationService notification,
            IWebHostEnvironment env)
        {
            _jobSvc = jobSvc;
            _fileSvc = fileSvc;
            _pdfSvc = pdfSvc;
            _invoiceSvc = invoiceSvc;
            _anomalySvc = anomalySvc;
            _notification = notification;
            _resultSerializer = new InvoiceJobPayloadSerializer();
            _env = env;
        }

        public virtual async Task ProcessAsync(
            long jobId,
            string? filePath = null,
            string? fileOriginalName = null,
            string? fileType = null,
            long? fileSize = null,
            long? companyId = null,
            long? userId = null,
            string? jobType = null)
        {
            var job = _jobSvc.GetById(jobId);
            if (job == null)
                return;

            var effectiveFilePath = string.IsNullOrWhiteSpace(filePath) ? job.FilePath : filePath;
            var effectiveFileOriginalName = string.IsNullOrWhiteSpace(fileOriginalName) ? job.FileOriginalName : fileOriginalName;
            var effectiveFileType = string.IsNullOrWhiteSpace(fileType) ? job.FileType : fileType;
            var effectiveFileSize = fileSize ?? job.FileSize;
            var effectiveCompanyId = companyId ?? job.CompanyId;
            var effectiveUserId = userId ?? job.UserId;
            var effectiveJobType = string.IsNullOrWhiteSpace(jobType) ? job.JobType : jobType;
            var extractionProvider = GetExtractionProvider(job.PayloadJson);

            _jobSvc.MarkProcessing(jobId);
            _jobSvc.UpdateProgress(jobId, 10);
            await _notification.NotifyUploadJobUpdatedAsync(_jobSvc, jobId);

            try
            {
                var fullPath = await ResolveFilePathAsync(effectiveFilePath);
                var fileName = string.IsNullOrWhiteSpace(effectiveFileOriginalName)
                    ? Path.GetFileName(fullPath)
                    : effectiveFileOriginalName;

                PdfExtractionOutcome outcome;
                using (var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read))
                {
                    outcome = string.IsNullOrWhiteSpace(extractionProvider)
                        ? await _pdfSvc.ExtractAsync(stream, fileName)
                        : await _pdfSvc.ExtractAsync(stream, fileName, extractionProvider);
                }
                var extracted = outcome.ExtractedData;

                _jobSvc.UpdateProgress(jobId, 60);
                await _notification.NotifyUploadJobUpdatedAsync(_jobSvc, jobId);

                if (string.Equals(effectiveJobType, UploadJobTypes.InvoiceUploadAndCreate, StringComparison.OrdinalIgnoreCase))
                {
                    var request = BuildInvoiceRequest(effectiveCompanyId, extracted);
                    var (success, invoiceId, error, isDuplicate) = _invoiceSvc.Create(
                        request,
                        effectiveUserId,
                        fileName,
                        effectiveFilePath,
                        string.IsNullOrWhiteSpace(effectiveFileType) ? "application/pdf" : effectiveFileType,
                        effectiveFileSize,
                        extracted.ExtractionConfidence);

                    if (!success)
                    {
                        _jobSvc.MarkFailed(jobId, error);
                        _notification.LogUploadJobFailure(job, "Invoice upload job failed", error);
                        await _notification.NotifyUploadJobUpdatedAsync(_jobSvc, jobId);
                        return;
                    }

                    _invoiceSvc.UpdateStatus(invoiceId, "extracted");

                    var result = _resultSerializer.BuildResultJson(
                        extracted,
                        invoiceId,
                        isDuplicate,
                        null,
                        "Invoice created from PDF in background.",
                        outcome.HybridAudit,
                        usedRegexFallback: outcome.UsedRegexFallback);

                    _jobSvc.MarkCompleted(jobId, result);
                    await _notification.NotifyUploadJobUpdatedAsync(_jobSvc, jobId);

                    if (isDuplicate)
                        await _notification.NotifyDuplicateInvoiceAnomalyAsync(_anomalySvc, effectiveCompanyId, invoiceId);
                    return;
                }

                var extractOnlyResult = _resultSerializer.BuildResultJson(
                    extracted,
                    null,
                    false,
                    null,
                    "Invoice PDF processed in background.",
                    outcome.HybridAudit,
                    usedRegexFallback: outcome.UsedRegexFallback);

                _jobSvc.MarkCompleted(jobId, extractOnlyResult);
                await _notification.NotifyUploadJobUpdatedAsync(_jobSvc, jobId);
            }
            catch (FileNotFoundException ex)
            {
                var detail = $"Invoice file not found. Path: {ex.FileName}. Job file path: {effectiveFilePath}";
                Console.WriteLine($"[PROCESSOR] {detail}");
                _jobSvc.MarkFailed(jobId, detail);
                _notification.LogUploadJobFailure(job, "Invoice upload job crashed", detail, "ERROR");
                await _notification.NotifyUploadJobUpdatedAsync(_jobSvc, jobId);
            }
            catch (Exception ex)
            {
                _jobSvc.MarkFailed(jobId, ex.Message);
                _notification.LogUploadJobFailure(job, "Invoice upload job crashed", ex.Message, "ERROR");
                await _notification.NotifyUploadJobUpdatedAsync(_jobSvc, jobId);
            }
        }

        private static string? GetExtractionProvider(string? payloadJson)
        {
            if (string.IsNullOrWhiteSpace(payloadJson))
                return null;

            try
            {
                using var document = JsonDocument.Parse(payloadJson);
                if (document.RootElement.ValueKind != JsonValueKind.Object)
                    return null;

                foreach (var property in document.RootElement.EnumerateObject())
                {
                    if (!property.Name.Equals("extractionProvider", StringComparison.OrdinalIgnoreCase)
                        || property.Value.ValueKind != JsonValueKind.String)
                        continue;

                    return InvoiceExtractionProviders.NormalizeOrNull(property.Value.GetString());
                }
            }
            catch
            {
                return null;
            }

            return null;
        }

        private async Task<string> ResolveFilePathAsync(string relativePath)
        {
            // Compute the full path the same way FileStorageService.SaveAsync does
            var normalized = relativePath.Replace("\\", "/").TrimStart('/');
            var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var localRelative = normalized.Replace("/", Path.DirectorySeparatorChar.ToString());
            var directPath = Path.GetFullPath(Path.Combine(webRoot, localRelative));

            if (File.Exists(directPath))
                return directPath;

            // File not found at the direct path — try a short delay in case of antivirus or FS latency
            Console.WriteLine($"[PROCESSOR] Direct path not found: {directPath} | Retrying once after 1s...");
            await Task.Delay(1000);

            if (File.Exists(directPath))
                return directPath;

            // Final fallback: use FileStorageService's candidate path search
            return _fileSvc.GetInvoiceFullPath(relativePath);
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
