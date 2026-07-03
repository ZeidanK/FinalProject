using System.Security.Cryptography;
using System.Text.Json;
using System.Text.Json.Serialization;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.UploadProcessing
{
    public class TransactionJobProcessor
    {
        private readonly IUploadJobService _jobSvc;
        private readonly IFileStorageService _fileSvc;
        private readonly IExcelExtractionService _excelSvc;
        private readonly ITransactionService _transactionSvc;
        private readonly IAnomalyService _anomalySvc;
        private readonly IRealtimeNotificationService _realtime;
        private readonly UploadJobNotificationService _notification;

        private static readonly JsonSerializerOptions _camelCase = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        public TransactionJobProcessor(
            IUploadJobService jobSvc,
            IFileStorageService fileSvc,
            IExcelExtractionService excelSvc,
            ITransactionService transactionSvc,
            IAnomalyService anomalySvc,
            IRealtimeNotificationService realtime,
            UploadJobNotificationService notification)
        {
            _jobSvc = jobSvc;
            _fileSvc = fileSvc;
            _excelSvc = excelSvc;
            _transactionSvc = transactionSvc;
            _anomalySvc = anomalySvc;
            _realtime = realtime;
            _notification = notification;
        }

        public async Task ProcessAsync(long jobId)
        {
            var job = _jobSvc.GetById(jobId);
            if (job == null)
                return;

            _jobSvc.MarkProcessing(jobId);
            _jobSvc.UpdateProgress(jobId, 10);
            await _notification.NotifyUploadJobUpdatedAsync(_jobSvc, jobId);

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
                    _notification.LogUploadJobFailure(job, "Transaction upload job failed", "No transactions could be extracted from the file.");
                    await _notification.NotifyUploadJobUpdatedAsync(_jobSvc, jobId);
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
                    _notification.LogUploadJobFailure(job, "Transaction duplicate check failed", duplicateResult.Error);
                    await _notification.NotifyUploadJobUpdatedAsync(_jobSvc, jobId);
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
                    await _notification.NotifyUploadJobUpdatedAsync(_jobSvc, jobId);
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
                await _notification.NotifyUploadJobUpdatedAsync(_jobSvc, jobId);

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
                    _notification.LogUploadJobFailure(job, "Transaction import job failed", error);
                    await _notification.NotifyUploadJobUpdatedAsync(_jobSvc, jobId);
                    return;
                }

                _jobSvc.UpdateProgress(jobId, 90);
                await _notification.NotifyUploadJobUpdatedAsync(_jobSvc, jobId);

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
                await _notification.NotifyUploadJobUpdatedAsync(_jobSvc, jobId);
            }
            catch (Exception ex)
            {
                _jobSvc.MarkFailed(jobId, ex.Message);
                _notification.LogUploadJobFailure(job, "Transaction upload job crashed", ex.Message, "ERROR");
                await _notification.NotifyUploadJobUpdatedAsync(_jobSvc, jobId);
            }
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
