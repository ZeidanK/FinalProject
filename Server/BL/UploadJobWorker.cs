using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Serialization;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    public class UploadJobWorker : IUploadJobWorker
    {
        private readonly IUploadJobService _jobSvc;
        private readonly IFileStorageService _fileSvc;
        private readonly IPdfExtractionService _pdfSvc;
        private readonly IInvoiceService _invoiceSvc;
        private readonly IExcelExtractionService _excelSvc;
        private readonly ITransactionService _transactionSvc;
        private readonly IAnomalyService _anomalySvc;
        private readonly IRealtimeNotificationService _realtime;
        private readonly IActivityLogService _activityLog;

        public UploadJobWorker(
            IUploadJobService jobSvc,
            IFileStorageService fileSvc,
            IPdfExtractionService pdfSvc,
            IInvoiceService invoiceSvc,
            IExcelExtractionService excelSvc,
            ITransactionService transactionSvc,
            IAnomalyService anomalySvc,
            IRealtimeNotificationService realtime,
            IActivityLogService activityLog)
        {
            _jobSvc = jobSvc;
            _fileSvc = fileSvc;
            _pdfSvc = pdfSvc;
            _invoiceSvc = invoiceSvc;
            _excelSvc = excelSvc;
            _transactionSvc = transactionSvc;
            _anomalySvc = anomalySvc;
            _realtime = realtime;
            _activityLog = activityLog;
        }

        private static readonly JsonSerializerOptions _camelCase = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        public async Task ProcessInvoiceJobAsync(long jobId)
        {
            var job = _jobSvc.GetById(jobId);
            if (job == null)
                return;

            _jobSvc.MarkProcessing(jobId);
            _jobSvc.UpdateProgress(jobId, 10);
            await NotifyUploadJobUpdatedAsync(jobId);

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
                await NotifyUploadJobUpdatedAsync(jobId);

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
                        LogUploadJobFailure(job, "Invoice upload job failed", error);
                        await NotifyUploadJobUpdatedAsync(jobId);
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
                    await NotifyUploadJobUpdatedAsync(jobId);

                    if (isDuplicate)
                        await NotifyDuplicateInvoiceAnomalyAsync(job.CompanyId, invoiceId);
                    return;
                }

                var extractOnlyResult = JsonSerializer.Serialize(new
                {
                    extractedData = extracted,
                    message = "Invoice PDF processed in background."
                }, _camelCase);

                _jobSvc.MarkCompleted(jobId, extractOnlyResult);
                await NotifyUploadJobUpdatedAsync(jobId);
            }
            catch (Exception ex)
            {
                _jobSvc.MarkFailed(jobId, ex.Message);
                LogUploadJobFailure(job, "Invoice upload job crashed", ex.Message, "ERROR");
                await NotifyUploadJobUpdatedAsync(jobId);
            }
        }

        public async Task ProcessTransactionJobAsync(long jobId)
        {
            var job = _jobSvc.GetById(jobId);
            if (job == null)
                return;

            _jobSvc.MarkProcessing(jobId);
            _jobSvc.UpdateProgress(jobId, 10);
            await NotifyUploadJobUpdatedAsync(jobId);

            try
            {
                var fullPath = _fileSvc.GetExcelFullPath(job.FilePath);
                var fileName = string.IsNullOrWhiteSpace(job.FileOriginalName)
                    ? Path.GetFileName(fullPath)
                    : job.FileOriginalName;

                ExcelExtractionResult extraction;
                using (var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read))
                {
                    extraction = _excelSvc.Extract(stream, fileName);
                }

                if (extraction.TotalExtracted == 0)
                {
                    _jobSvc.MarkFailed(jobId, "No transactions could be extracted from the file.");
                    LogUploadJobFailure(job, "Transaction upload job failed", "No transactions could be extracted from the file.");
                    await NotifyUploadJobUpdatedAsync(jobId);
                    return;
                }

                var firstTransactionDate = extraction.Transactions.Min(t => t.TransactionDate);
                var lastTransactionDate = extraction.Transactions.Max(t => t.TransactionDate);

                var fileHash = ComputeFileSha256(fullPath);
                var duplicateResult = _anomalySvc.RegisterTransactionFileUpload(
                    job.CompanyId,
                    fileName,
                    job.FilePath,
                    new FileInfo(fullPath).Length,
                    job.UserId,
                    fileHash,
                    firstTransactionDate,
                    lastTransactionDate);

                if (!duplicateResult.Success)
                {
                    _jobSvc.MarkFailed(jobId, duplicateResult.Error);
                    LogUploadJobFailure(job, "Transaction duplicate check failed", duplicateResult.Error);
                    await NotifyUploadJobUpdatedAsync(jobId);
                    return;
                }

                if (duplicateResult.IsDuplicate)
                {
                    var duplicatePayload = JsonSerializer.Serialize(new
                    {
                        isDuplicate = true,
                        duplicateResult.AnomalyId,
                        fileHash,
                        message = "Duplicate Excel file detected. Import skipped."
                    }, _camelCase);

                    _jobSvc.MarkCompleted(jobId, duplicatePayload);
                    await NotifyUploadJobUpdatedAsync(jobId);
                    if (duplicateResult.AnomalyId.HasValue)
                    {
                        await _realtime.CreateCompanyNotificationAsync(job.CompanyId, new NotificationMessage
                        {
                            EventType = NotificationEventTypes.AnomalyCreated,
                            Title = "Duplicate transaction file detected",
                            Body = "A duplicate transaction upload was detected and skipped.",
                            Severity = "warning",
                            TargetType = NotificationTargetTypes.Anomaly,
                            TargetId = duplicateResult.AnomalyId.Value.ToString(),
                            DedupeKey = $"anomaly:{duplicateResult.AnomalyId.Value}:created",
                        }, new { anomalyId = duplicateResult.AnomalyId.Value, job.CompanyId });
                    }
                    return;
                }

                _jobSvc.UpdateProgress(jobId, 50);
                await NotifyUploadJobUpdatedAsync(jobId);

                var request = new BulkCreateTransactionsRequest
                {
                    CompanyId = job.CompanyId,
                    CreatedByUserId = job.UserId,
                    Transactions = extraction.Transactions.Select(t => new CreateTransactionRequest
                    {
                        CompanyId = job.CompanyId,
                        TransactionDate = t.TransactionDate,
                        PostedDate = t.PostedDate,
                        Description = t.Description,
                        Amount = t.Amount,
                        BalanceAfter = t.BalanceAfter,
                        TransactionType = t.TransactionType,
                        Category = t.Category,
                        ReferenceNumber = t.ReferenceNumber,
                        VendorName = t.VendorName,
                        CardLast4 = t.CardLast4,
                        ChargeAmount = t.ChargeAmount,
                        ChargeCurrency = t.ChargeCurrency,
                        OriginalCurrency = t.OriginalCurrency,
                        ExchangeRate = t.ExchangeRate,
                        BankAccountId = job.BankAccountId,
                        CreatedByUserId = job.UserId
                    }).ToList()
                };

                var (success, ids, error) = _transactionSvc.BulkCreate(request, job.UserId);
                if (!success)
                {
                    _jobSvc.MarkFailed(jobId, error);
                    LogUploadJobFailure(job, "Transaction import job failed", error);
                    await NotifyUploadJobUpdatedAsync(jobId);
                    return;
                }

                _jobSvc.UpdateProgress(jobId, 90);
                await NotifyUploadJobUpdatedAsync(jobId);

                var result = JsonSerializer.Serialize(new
                {
                    count = ids.Count,
                    ids,
                    extractionSummary = new
                    {
                        extraction.FileName,
                        extraction.TotalExtracted,
                        extraction.TotalSkipped
                    },
                    message = $"Successfully imported {ids.Count} transaction(s)."
                }, _camelCase);

                _jobSvc.MarkCompleted(jobId, result);
                await NotifyUploadJobUpdatedAsync(jobId);
            }
            catch (Exception ex)
            {
                _jobSvc.MarkFailed(jobId, ex.Message);
                LogUploadJobFailure(job, "Transaction upload job crashed", ex.Message, "ERROR");
                await NotifyUploadJobUpdatedAsync(jobId);
            }
        }

        private void LogUploadJobFailure(UploadJobRow job, string message, string? error, string level = "WARN")
        {
            _activityLog.LogSystem(new CreateSystemLogRequest
            {
                Level = level,
                Category = "jobs",
                Message = message,
                Details = JsonSerializer.Serialize(new
                {
                    job.Id,
                    job.JobType,
                    job.CompanyId,
                    job.UserId,
                    job.FileOriginalName,
                    error
                }, _camelCase),
                UserId = job.UserId
            });
        }

        private async Task NotifyUploadJobUpdatedAsync(long jobId)
        {
            var updated = _jobSvc.GetById(jobId);
            if (updated == null)
                return;

            await _realtime.NotifyUploadJobUpdatedAsync(updated);

            var status = updated.Status?.ToLowerInvariant();
            if (status == UploadJobStatuses.Completed || status == UploadJobStatuses.Failed)
            {
                var isCompleted = status == UploadJobStatuses.Completed;
                var fileName = updated.FileOriginalName ?? "file";
                var isInvoiceJob = updated.JobType == UploadJobTypes.InvoiceUploadPdf
                    || updated.JobType == UploadJobTypes.InvoiceUploadAndCreate;
                var invoiceId = isInvoiceJob ? TryGetInvoiceId(updated.ResultJson) : null;
                await _realtime.CreateUserNotificationAsync(updated.UserId, new NotificationMessage
                {
                    EventType = isCompleted ? NotificationEventTypes.UploadCompleted : NotificationEventTypes.UploadFailed,
                    Title = isCompleted ? "Upload complete" : "Upload failed",
                    Body = isCompleted
                        ? $"'{fileName}' was processed successfully."
                        : $"'{fileName}' could not be processed. Please review the upload and try again.",
                    Severity = isCompleted ? "success" : "error",
                    TargetType = invoiceId.HasValue
                        ? NotificationTargetTypes.Invoice
                        : isInvoiceJob
                            ? NotificationTargetTypes.InvoiceUploadJob
                            : NotificationTargetTypes.TransactionUploadJob,
                    TargetId = invoiceId?.ToString() ?? updated.Id.ToString(),
                    DedupeKey = $"upload-job:{updated.Id}:{status}",
                }, new { updated.Id, updated.Status }, updated.CompanyId);
            }
        }

        private async Task NotifyDuplicateInvoiceAnomalyAsync(long companyId, long invoiceId)
        {
            var anomaly = _anomalySvc
                .GetByCompany(companyId, status: "open", severity: null, type: "duplicate")
                .FirstOrDefault(row => row.RelatedInvoiceId == invoiceId
                    || row.RelatedItems.Any(item => item.EntityId == invoiceId));
            if (anomaly == null)
                return;

            await _realtime.CreateCompanyNotificationAsync(companyId, new NotificationMessage
            {
                EventType = NotificationEventTypes.AnomalyCreated,
                Title = "Duplicate invoice detected",
                Body = anomaly.Description ?? "A duplicate invoice requires review.",
                Severity = "warning",
                TargetType = NotificationTargetTypes.Anomaly,
                TargetId = anomaly.Id.ToString(),
                DedupeKey = $"anomaly:{anomaly.Id}:created",
            }, new { anomalyId = anomaly.Id, companyId, invoiceId });
        }

        private static long? TryGetInvoiceId(string? resultJson)
        {
            if (string.IsNullOrWhiteSpace(resultJson))
                return null;
            try
            {
                using var document = JsonDocument.Parse(resultJson);
                if (document.RootElement.TryGetProperty("invoiceId", out var value)
                    && value.TryGetInt64(out var invoiceId))
                    return invoiceId;
            }
            catch
            {
                // Malformed legacy job results fall back to the upload-job destination.
            }
            return null;
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

        private static string ComputeFileSha256(string fullPath)
        {
            using var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read);
            using var sha = SHA256.Create();
            var hash = sha.ComputeHash(stream);
            return Convert.ToHexString(hash).ToLowerInvariant();
        }
    }
}
                