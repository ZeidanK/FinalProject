using System.Text.Json;
using System.Text.Json.Serialization;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    public class InvoiceVerificationService : IInvoiceVerificationService
    {
        public const decimal AutoVerifyConfidenceThreshold = 0.90m;

        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = true,
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        private readonly IInvoiceService _invoiceSvc;
        private readonly IUploadJobService _jobSvc;
        private readonly IAnomalyService _anomalySvc;
        private readonly IRealtimeNotificationService _realtime;
        private readonly DBservices _db;

        public InvoiceVerificationService(
            IInvoiceService invoiceSvc,
            IUploadJobService jobSvc,
            IAnomalyService anomalySvc,
            IRealtimeNotificationService realtime,
            DBservices db)
        {
            _invoiceSvc = invoiceSvc;
            _jobSvc = jobSvc;
            _anomalySvc = anomalySvc;
            _realtime = realtime;
            _db = db;
        }

        public async Task<BulkInvoiceJobVerificationResponse> VerifyJobsAsync(
            IReadOnlyCollection<long> jobIds,
            long verifiedByUserId)
        {
            var normalizedIds = jobIds
                .Where(id => id > 0)
                .Distinct()
                .ToList();

            var response = new BulkInvoiceJobVerificationResponse
            {
                RequestedCount = normalizedIds.Count
            };

            foreach (var jobId in normalizedIds)
            {
                var result = await VerifyJobAsync(jobId, verifiedByUserId);
                response.Results.Add(result);

                if (result.Outcome == InvoiceJobVerificationOutcomes.Verified
                    || result.Outcome == InvoiceJobVerificationOutcomes.Duplicate)
                {
                    response.VerifiedCount++;
                    if (result.Outcome == InvoiceJobVerificationOutcomes.Duplicate)
                        response.DuplicateCount++;
                }
                else if (result.Outcome == InvoiceJobVerificationOutcomes.AlreadyVerified
                    || result.Outcome == InvoiceJobVerificationOutcomes.InProgress)
                {
                    response.SkippedCount++;
                }
                else
                {
                    response.FailedCount++;
                }
            }

            return response;
        }

        public async Task<InvoiceJobVerificationResult> VerifyJobAsync(
            long jobId,
            long verifiedByUserId,
            CreateInvoiceRequest? reviewedInvoice = null,
            bool automatic = false)
        {
            var job = _jobSvc.GetById(jobId);
            if (job == null)
                return Result(jobId, InvoiceJobVerificationOutcomes.Unavailable, "Upload job was not found.");

            if (verifiedByUserId <= 0
                || (job.UserId != verifiedByUserId
                    && !_db.UserHasActiveCompanyAccess(verifiedByUserId, job.CompanyId)))
            {
                return Result(jobId, InvoiceJobVerificationOutcomes.Unavailable, "Upload job is unavailable.");
            }

            if (!string.Equals(job.JobType, UploadJobTypes.InvoiceUploadPdf, StringComparison.OrdinalIgnoreCase))
                return Result(jobId, InvoiceJobVerificationOutcomes.Unavailable, "Only extracted invoice upload jobs can be verified.");

            var storedPayload = ReadStoredPayload(job.ResultJson);
            var confidence = storedPayload.ExtractedData?.ExtractionConfidence;

            if (string.Equals(job.Status, UploadJobStatuses.Verified, StringComparison.OrdinalIgnoreCase))
            {
                return new InvoiceJobVerificationResult
                {
                    JobId = jobId,
                    InvoiceId = storedPayload.InvoiceId,
                    Outcome = InvoiceJobVerificationOutcomes.AlreadyVerified,
                    Message = "Invoice was already verified.",
                    Confidence = confidence,
                    IsDuplicate = storedPayload.IsDuplicate
                };
            }

            if (automatic && (!confidence.HasValue || confidence.Value < AutoVerifyConfidenceThreshold))
            {
                return Result(
                    jobId,
                    InvoiceJobVerificationOutcomes.RequiresReview,
                    "Invoice confidence is below the automatic verification threshold.",
                    confidence);
            }

            CreateInvoiceRequest request;
            if (reviewedInvoice != null)
            {
                request = reviewedInvoice;
                request.CompanyId = job.CompanyId;
            }
            else
            {
                if (storedPayload.ExtractedData == null)
                    return Result(jobId, InvoiceJobVerificationOutcomes.RequiresReview, "Extracted invoice data is unavailable.", confidence);

                var validationError = ValidateExtractedInvoice(storedPayload.ExtractedData);
                if (validationError != null)
                    return Result(jobId, InvoiceJobVerificationOutcomes.RequiresReview, validationError, confidence);

                request = BuildInvoiceRequest(job.CompanyId, storedPayload.ExtractedData);
            }

            var reviewedValidationError = ValidateReviewedInvoice(request);
            if (reviewedValidationError != null)
                return Result(jobId, InvoiceJobVerificationOutcomes.RequiresReview, reviewedValidationError, confidence);

            var isResuming = storedPayload.InvoiceId.HasValue
                && (string.Equals(job.Status, UploadJobStatuses.Completed, StringComparison.OrdinalIgnoreCase)
                    || string.Equals(job.Status, UploadJobStatuses.Verifying, StringComparison.OrdinalIgnoreCase));

            if (!isResuming)
            {
                if (!string.Equals(job.Status, UploadJobStatuses.Completed, StringComparison.OrdinalIgnoreCase))
                {
                    var outcome = string.Equals(job.Status, UploadJobStatuses.Verifying, StringComparison.OrdinalIgnoreCase)
                        ? InvoiceJobVerificationOutcomes.InProgress
                        : InvoiceJobVerificationOutcomes.Unavailable;
                    return Result(jobId, outcome, "Upload job is not ready for verification.", confidence);
                }

                if (!_jobSvc.TryBeginVerification(jobId))
                {
                    var current = _jobSvc.GetById(jobId);
                    if (string.Equals(current?.Status, UploadJobStatuses.Verified, StringComparison.OrdinalIgnoreCase))
                    {
                        var currentPayload = ReadStoredPayload(current?.ResultJson);
                        return new InvoiceJobVerificationResult
                        {
                            JobId = jobId,
                            InvoiceId = currentPayload.InvoiceId,
                            Outcome = InvoiceJobVerificationOutcomes.AlreadyVerified,
                            Message = "Invoice was already verified.",
                            Confidence = currentPayload.ExtractedData?.ExtractionConfidence,
                            IsDuplicate = currentPayload.IsDuplicate
                        };
                    }

                    return Result(jobId, InvoiceJobVerificationOutcomes.InProgress, "Invoice verification is already in progress.", confidence);
                }
            }
            else if (string.Equals(job.Status, UploadJobStatuses.Completed, StringComparison.OrdinalIgnoreCase)
                && !_jobSvc.TryBeginVerification(jobId))
            {
                return Result(jobId, InvoiceJobVerificationOutcomes.InProgress, "Invoice verification is already in progress.", confidence);
            }

            long invoiceId = storedPayload.InvoiceId ?? 0;
            var isDuplicate = storedPayload.IsDuplicate;
            var verificationCommitted = false;

            try
            {
                if (invoiceId <= 0)
                {
                    var createResult = _invoiceSvc.Create(
                        request,
                        verifiedByUserId,
                        job.FileOriginalName,
                        job.FilePath,
                        string.IsNullOrWhiteSpace(job.FileType) ? "application/pdf" : job.FileType,
                        job.FileSize,
                        confidence);

                    if (!createResult.Success)
                    {
                        await RestoreForReviewAsync(job, createResult.Error);
                        return Result(jobId, InvoiceJobVerificationOutcomes.Failed, createResult.Error, confidence);
                    }

                    invoiceId = createResult.Id;
                    isDuplicate = createResult.IsDuplicate;

                    var provisionalJson = BuildResultJson(
                        storedPayload.ExtractedData,
                        invoiceId,
                        isDuplicate,
                        null,
                        "Invoice created; verification is being finalized.");
                    _jobSvc.UpdateProgress(jobId, 100, provisionalJson);
                }

                var existingInvoice = _invoiceSvc.GetById(invoiceId);
                if (existingInvoice == null || existingInvoice.CompanyId != job.CompanyId)
                    throw new InvalidOperationException("Created invoice could not be loaded for verification.");

                if (!_invoiceSvc.MarkVerified(invoiceId, verifiedByUserId))
                    throw new InvalidOperationException("Invoice could not be marked as verified.");

                var provisionalVerifiedJson = BuildResultJson(
                    storedPayload.ExtractedData,
                    invoiceId,
                    isDuplicate,
                    null,
                    "Invoice verified.");

                if (!_jobSvc.MarkVerified(jobId, provisionalVerifiedJson))
                    throw new InvalidOperationException("Upload job could not be marked as verified.");
                verificationCommitted = true;

                InvoiceJobAutoMatchResult? autoMatch = null;
                if (!isDuplicate)
                {
                    var match = await _invoiceSvc.AutoMatchAfterCreateAsync(invoiceId, verifiedByUserId, 70m);
                    autoMatch = new InvoiceJobAutoMatchResult
                    {
                        Matched = match.Success,
                        MatchId = match.MatchId,
                        MatchScore = match.MatchScore,
                        Message = match.Message
                    };
                }

                var finalJson = BuildResultJson(
                    storedPayload.ExtractedData,
                    invoiceId,
                    isDuplicate,
                    autoMatch,
                    isDuplicate ? "Duplicate invoice verified and flagged for review." : "Invoice verified.");
                _jobSvc.MarkVerified(jobId, finalJson);

                if (isDuplicate)
                    await NotifyDuplicateInvoiceAnomalyAsync(job.CompanyId, invoiceId);

                await NotifyVerifiedAsync(jobId, job, invoiceId, automatic);

                return new InvoiceJobVerificationResult
                {
                    JobId = jobId,
                    InvoiceId = invoiceId,
                    Outcome = isDuplicate
                        ? InvoiceJobVerificationOutcomes.Duplicate
                        : InvoiceJobVerificationOutcomes.Verified,
                    Message = isDuplicate
                        ? "Invoice verified and flagged as a duplicate."
                        : "Invoice verified successfully.",
                    Confidence = confidence,
                    IsDuplicate = isDuplicate,
                    AutoMatchResult = autoMatch
                };
            }
            catch (Exception ex)
            {
                if (verificationCommitted)
                {
                    await NotifyVerifiedAsync(jobId, job, invoiceId, automatic);
                    return new InvoiceJobVerificationResult
                    {
                        JobId = jobId,
                        InvoiceId = invoiceId,
                        Outcome = isDuplicate
                            ? InvoiceJobVerificationOutcomes.Duplicate
                            : InvoiceJobVerificationOutcomes.Verified,
                        Message = $"Invoice verified, but a follow-up action failed: {ex.Message}",
                        Confidence = confidence,
                        IsDuplicate = isDuplicate
                    };
                }

                if (invoiceId <= 0)
                    await RestoreForReviewAsync(job, ex.Message);

                return Result(jobId, InvoiceJobVerificationOutcomes.Failed, ex.Message, confidence, invoiceId > 0 ? invoiceId : null);
            }
        }

        private async Task RestoreForReviewAsync(UploadJobRow job, string error)
        {
            _jobSvc.RestoreCompleted(job.Id, job.ResultJson, error);
            var restored = _jobSvc.GetById(job.Id);
            if (restored != null)
                await _realtime.NotifyUploadJobUpdatedAsync(restored);
        }

        private async Task NotifyVerifiedAsync(long jobId, UploadJobRow job, long invoiceId, bool automatic)
        {
            var updated = _jobSvc.GetById(jobId);
            if (updated != null)
                await _realtime.NotifyUploadJobUpdatedAsync(updated);

            if (!automatic)
                return;

            await _realtime.CreateUserNotificationAsync(job.UserId, new NotificationMessage
            {
                EventType = NotificationEventTypes.UploadCompleted,
                Title = "Invoice auto-verified",
                Body = $"'{job.FileOriginalName ?? "Invoice"}' was automatically verified.",
                Severity = "success",
                TargetType = NotificationTargetTypes.Invoice,
                TargetId = invoiceId.ToString(),
                DedupeKey = $"upload-job:{job.Id}:verified"
            }, new { jobId = job.Id, invoiceId, status = UploadJobStatuses.Verified }, job.CompanyId);
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
                DedupeKey = $"anomaly:{anomaly.Id}:created"
            }, new { anomalyId = anomaly.Id, companyId, invoiceId });
        }

        private static string? ValidateExtractedInvoice(PdfExtractionResult extracted)
        {
            if (string.IsNullOrWhiteSpace(extracted.InvoiceNumber))
                return "Invoice number is missing; open the invoice to review it.";
            if (string.IsNullOrWhiteSpace(extracted.VendorName))
                return "Vendor name is missing; open the invoice to review it.";
            if (!extracted.InvoiceDate.HasValue)
                return "Invoice date is missing; open the invoice to review it.";
            if (!extracted.TotalAmount.HasValue)
                return "Invoice total is missing; open the invoice to review it.";
            return null;
        }

        private static string? ValidateReviewedInvoice(CreateInvoiceRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.InvoiceNumber))
                return "Invoice number is required.";
            if (string.IsNullOrWhiteSpace(request.VendorName))
                return "Vendor name is required.";
            if (request.InvoiceDate == default)
                return "Invoice date is required.";
            return null;
        }

        private static CreateInvoiceRequest BuildInvoiceRequest(long companyId, PdfExtractionResult extracted)
        {
            return new CreateInvoiceRequest
            {
                CompanyId = companyId,
                InvoiceNumber = extracted.InvoiceNumber!.Trim(),
                VendorName = extracted.VendorName!.Trim(),
                InvoiceDate = extracted.InvoiceDate!.Value,
                DueDate = extracted.DueDate,
                TotalAmount = extracted.TotalAmount!.Value,
                Subtotal = extracted.Subtotal ?? extracted.TotalAmount.Value,
                VatRate = extracted.VatRate,
                VatAmount = extracted.VatAmount,
                Currency = string.IsNullOrWhiteSpace(extracted.Currency) ? "USD" : extracted.Currency,
                VendorTaxId = extracted.VendorTaxId,
                LastFourDigitsCard = extracted.LastFourDigitsCard,
                ItemCount = extracted.ItemCount,
                PaymentPlanTotalInstallments = extracted.PaymentPlan?.TotalInstallments,
                PaymentPlanInstallmentAmount = extracted.PaymentPlan?.InstallmentAmount,
                PaymentPlanFrequency = extracted.PaymentPlan?.Frequency,
                PaymentPlanDescription = extracted.PaymentPlan?.Description,
                PaymentPlanCurrentInstallment = extracted.PaymentPlan?.CurrentInstallment,
                LineItems = extracted.LineItems.Select((li, index) => new CreateLineItemRequest
                {
                    Description = string.IsNullOrWhiteSpace(li.Description) ? "Item" : li.Description,
                    Quantity = li.Quantity,
                    UnitPrice = li.UnitPrice,
                    TotalAmount = li.TotalAmount,
                    VatRate = li.VatRate,
                    Category = li.Category,
                    LineNumber = index + 1,
                    AiConfidenceScore = li.AiConfidenceScore
                }).ToList()
            };
        }

        private static StoredInvoiceJobResult ReadStoredPayload(string? resultJson)
        {
            if (string.IsNullOrWhiteSpace(resultJson))
                return new StoredInvoiceJobResult();

            try
            {
                return JsonSerializer.Deserialize<StoredInvoiceJobResult>(resultJson, JsonOptions)
                    ?? new StoredInvoiceJobResult();
            }
            catch
            {
                return new StoredInvoiceJobResult();
            }
        }

        private static string BuildResultJson(
            PdfExtractionResult? extracted,
            long invoiceId,
            bool isDuplicate,
            InvoiceJobAutoMatchResult? autoMatch,
            string message)
        {
            return JsonSerializer.Serialize(new
            {
                invoiceId,
                isDuplicate,
                extractedData = extracted,
                autoMatchResult = autoMatch,
                message
            }, JsonOptions);
        }

        private static InvoiceJobVerificationResult Result(
            long jobId,
            string outcome,
            string message,
            decimal? confidence = null,
            long? invoiceId = null)
        {
            return new InvoiceJobVerificationResult
            {
                JobId = jobId,
                InvoiceId = invoiceId,
                Outcome = outcome,
                Message = message,
                Confidence = confidence
            };
        }

        private sealed class StoredInvoiceJobResult
        {
            public long? InvoiceId { get; set; }
            public bool IsDuplicate { get; set; }
            public PdfExtractionResult? ExtractedData { get; set; }
        }
    }
}
