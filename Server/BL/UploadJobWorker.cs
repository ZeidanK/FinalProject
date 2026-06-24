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

        public UploadJobWorker(
            IUploadJobService jobSvc,
            IFileStorageService fileSvc,
            IPdfExtractionService pdfSvc,
            IInvoiceService invoiceSvc,
            IExcelExtractionService excelSvc,
            ITransactionService transactionSvc,
            IAnomalyService anomalySvc)
        {
            _jobSvc = jobSvc;
            _fileSvc = fileSvc;
            _pdfSvc = pdfSvc;
            _invoiceSvc = invoiceSvc;
            _excelSvc = excelSvc;
            _transactionSvc = transactionSvc;
            _anomalySvc = anomalySvc;
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
                    return;
                }

                var extractOnlyResult = JsonSerializer.Serialize(new
                {
                    extractedData = extracted,
                    message = "Invoice PDF processed in background."
                }, _camelCase);

                _jobSvc.MarkCompleted(jobId, extractOnlyResult);
            }
            catch (Exception ex)
            {
                _jobSvc.MarkFailed(jobId, ex.Message);
            }
        }

        public async Task ProcessTransactionJobAsync(long jobId)
        {
            var job = _jobSvc.GetById(jobId);
            if (job == null)
                return;

            _jobSvc.MarkProcessing(jobId);
            _jobSvc.UpdateProgress(jobId, 10);

            try
            {
                var fullPath = _fileSvc.GetExcelFullPath(job.FilePath);
                var fileName = string.IsNullOrWhiteSpace(job.FileOriginalName)
                    ? Path.GetFileName(fullPath)
                    : job.FileOriginalName;

                var fileHash = ComputeFileSha256(fullPath);
                var duplicateResult = _anomalySvc.RegisterTransactionFileUpload(
                    job.CompanyId,
                    fileName,
                    job.FilePath,
                    new FileInfo(fullPath).Length,
                    job.UserId,
                    fileHash);

                if (!duplicateResult.Success)
                {
                    _jobSvc.MarkFailed(jobId, duplicateResult.Error);
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
                    return;
                }

                _jobSvc.UpdateProgress(jobId, 50);

                ExcelExtractionResult extraction;
                using (var stream = new FileStream(fullPath, FileMode.Open, FileAccess.Read, FileShare.Read))
                {
                    extraction = _excelSvc.Extract(stream, fileName);
                }

                if (extraction.TotalExtracted == 0)
                {
                    _jobSvc.MarkFailed(jobId, "No transactions could be extracted from the file.");
                    return;
                }

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
                    return;
                }

                _jobSvc.UpdateProgress(jobId, 90);

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
            }
            catch (Exception ex)
            {
                _jobSvc.MarkFailed(jobId, ex.Message);
            }

            await Task.CompletedTask;
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
