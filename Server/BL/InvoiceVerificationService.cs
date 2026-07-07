using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.BL.InvoiceVerification;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    public class InvoiceVerificationService : IInvoiceVerificationService
    {
        private readonly IInvoiceService _invoiceSvc;
        private readonly IUploadJobService _jobSvc;
        private readonly IAnomalyService _anomalySvc;
        private readonly IRealtimeNotificationService _realtime;
        private readonly DBservices _db;
        private readonly IVerifiedHybridAuditWriter _verifiedHybridAuditWriter;
        private readonly InvoiceJobValidator _validator;
        private readonly InvoiceJobPayloadSerializer _serializer;

        public const decimal AutoVerifyConfidenceThreshold = 0.90m;

        public InvoiceVerificationService(
            IInvoiceService invoiceSvc,
            IUploadJobService jobSvc,
            IAnomalyService anomalySvc,
            IRealtimeNotificationService realtime,
            DBservices db,
            IVerifiedHybridAuditWriter verifiedHybridAuditWriter)
        {
            _invoiceSvc = invoiceSvc;
            _jobSvc = jobSvc;
            _anomalySvc = anomalySvc;
            _realtime = realtime;
            _db = db;
            _verifiedHybridAuditWriter = verifiedHybridAuditWriter;
            _validator = new InvoiceJobValidator();
            _serializer = new InvoiceJobPayloadSerializer();
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
                return _serializer.Result(jobId, InvoiceJobVerificationOutcomes.Unavailable, "Upload job was not found.");

            if (verifiedByUserId <= 0
                || (job.UserId != verifiedByUserId
                    && !_db.UserHasActiveCompanyAccess(verifiedByUserId, job.CompanyId)))
            {
                return _serializer.Result(jobId, InvoiceJobVerificationOutcomes.Unavailable, "Upload job is unavailable.");
            }

            if (!string.Equals(job.JobType, UploadJobTypes.InvoiceUploadPdf, StringComparison.OrdinalIgnoreCase))
                return _serializer.Result(jobId, InvoiceJobVerificationOutcomes.Unavailable, "Only extracted invoice upload jobs can be verified.");

            var storedPayload = _serializer.ReadStoredPayload(job.ResultJson);
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
                return _serializer.Result(
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
                    return _serializer.Result(jobId, InvoiceJobVerificationOutcomes.RequiresReview, "Extracted invoice data is unavailable.", confidence);

                var validationError = _validator.ValidateExtractedInvoice(storedPayload.ExtractedData);
                if (validationError != null)
                    return _serializer.Result(jobId, InvoiceJobVerificationOutcomes.RequiresReview, validationError, confidence);

                request = _validator.BuildInvoiceRequest(job.CompanyId, storedPayload.ExtractedData);
            }

            var reviewedValidationError = _validator.ValidateReviewedInvoice(request);
            if (reviewedValidationError != null)
                return _serializer.Result(jobId, InvoiceJobVerificationOutcomes.RequiresReview, reviewedValidationError, confidence);

            // A job is resumable if it is already in Verifying (stuck mid-flight with or without
            // an InvoiceId), or if it is Completed and already has an InvoiceId from a prior attempt.
            var isResuming = string.Equals(job.Status, UploadJobStatuses.Verifying, StringComparison.OrdinalIgnoreCase)
                || (storedPayload.InvoiceId.HasValue
                    && string.Equals(job.Status, UploadJobStatuses.Completed, StringComparison.OrdinalIgnoreCase));

            if (!isResuming)
            {
                if (!string.Equals(job.Status, UploadJobStatuses.Completed, StringComparison.OrdinalIgnoreCase))
                {
                    var outcome = string.Equals(job.Status, UploadJobStatuses.Verifying, StringComparison.OrdinalIgnoreCase)
                        ? InvoiceJobVerificationOutcomes.InProgress
                        : InvoiceJobVerificationOutcomes.Unavailable;
                    return _serializer.Result(jobId, outcome, "Upload job is not ready for verification.", confidence);
                }

                if (!_jobSvc.TryBeginVerification(jobId))
                {
                    var current = _jobSvc.GetById(jobId);
                    if (string.Equals(current?.Status, UploadJobStatuses.Verified, StringComparison.OrdinalIgnoreCase))
                    {
                        var currentPayload = _serializer.ReadStoredPayload(current?.ResultJson);
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

                    return _serializer.Result(jobId, InvoiceJobVerificationOutcomes.InProgress, "Invoice verification is already in progress.", confidence);
                }
            }
            else if (string.Equals(job.Status, UploadJobStatuses.Completed, StringComparison.OrdinalIgnoreCase)
                && !_jobSvc.TryBeginVerification(jobId))
            {
                return _serializer.Result(jobId, InvoiceJobVerificationOutcomes.InProgress, "Invoice verification is already in progress.", confidence);
            }

            long invoiceId = storedPayload.InvoiceId ?? 0;
            var isDuplicate = storedPayload.IsDuplicate;
            var verificationCommitted = false;
            var hybridAudit = ToHybridAudit(storedPayload);
            var sourceExtraction = storedPayload.MergedResult ?? storedPayload.ExtractedData;
            var verificationSource = automatic ? "auto_verify" : "manual_review";
            var verifiedResult = reviewedInvoice != null
                ? ToVerifiedResult(request, confidence, sourceExtraction)
                : CloneResult(sourceExtraction ?? storedPayload.ExtractedData);

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
                        return _serializer.Result(jobId, InvoiceJobVerificationOutcomes.Failed, createResult.Error, confidence);
                    }

                    invoiceId = createResult.Id;
                    isDuplicate = createResult.IsDuplicate;

                    var provisionalJson = _serializer.BuildResultJson(
                        storedPayload.ExtractedData,
                        invoiceId,
                        isDuplicate,
                        null,
                        "Invoice created; verification is being finalized.",
                        hybridAudit,
                        verifiedResult,
                        verificationSource,
                        storedPayload.UsedRegexFallback);
                    _jobSvc.UpdateProgress(jobId, 100, provisionalJson);
                }

                var existingInvoice = _invoiceSvc.GetById(invoiceId);
                if (existingInvoice == null || existingInvoice.CompanyId != job.CompanyId)
                    throw new InvalidOperationException("Created invoice could not be loaded for verification.");

                if (!_invoiceSvc.MarkVerified(invoiceId, verifiedByUserId))
                    throw new InvalidOperationException("Invoice could not be marked as verified.");

                var provisionalVerifiedJson = _serializer.BuildResultJson(
                    storedPayload.ExtractedData,
                    invoiceId,
                    isDuplicate,
                    null,
                    "Invoice verified.",
                    hybridAudit,
                    verifiedResult,
                    verificationSource,
                    storedPayload.UsedRegexFallback);

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

                var finalJson = _serializer.BuildResultJson(
                    storedPayload.ExtractedData,
                    invoiceId,
                    isDuplicate,
                    autoMatch,
                    isDuplicate ? "Duplicate invoice verified and flagged for review." : "Invoice verified.",
                    hybridAudit,
                    verifiedResult,
                    verificationSource,
                    storedPayload.UsedRegexFallback);
                _jobSvc.MarkVerified(jobId, finalJson);
                if (verifiedResult != null)
                {
                    await _verifiedHybridAuditWriter.AppendVerifiedAsync(
                        job,
                        storedPayload,
                        verifiedResult,
                        verificationSource);
                }

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

                return _serializer.Result(jobId, InvoiceJobVerificationOutcomes.Failed, ex.Message, confidence, invoiceId > 0 ? invoiceId : null);
            }
        }

        private static HybridExtractionAudit? ToHybridAudit(StoredInvoiceJobResult payload)
        {
            if (payload.LocalResult == null && payload.GeminiResult == null && payload.MergedResult == null)
                return null;

            return new HybridExtractionAudit
            {
                LocalResult = CloneResult(payload.LocalResult),
                GeminiResult = CloneResult(payload.GeminiResult),
                MergedResult = CloneResult(payload.MergedResult),
                FieldSources = new Dictionary<string, string>(payload.FieldSources)
            };
        }

        private static PdfExtractionResult? CloneResult(PdfExtractionResult? input)
        {
            if (input == null)
                return null;

            return new PdfExtractionResult
            {
                VendorName = input.VendorName,
                InvoiceNumber = input.InvoiceNumber,
                InvoiceDate = input.InvoiceDate,
                DueDate = input.DueDate,
                TotalAmount = input.TotalAmount,
                Subtotal = input.Subtotal,
                VatRate = input.VatRate,
                VatAmount = input.VatAmount,
                Currency = input.Currency,
                VendorTaxId = input.VendorTaxId,
                LastFourDigitsCard = input.LastFourDigitsCard,
                ItemCount = input.ItemCount,
                PaymentPlan = input.PaymentPlan == null
                    ? null
                    : new PaymentPlanInfo
                    {
                        TotalInstallments = input.PaymentPlan.TotalInstallments,
                        InstallmentAmount = input.PaymentPlan.InstallmentAmount,
                        Frequency = input.PaymentPlan.Frequency,
                        CurrentInstallment = input.PaymentPlan.CurrentInstallment,
                        Description = input.PaymentPlan.Description
                    },
                LineItems = input.LineItems.Select((item, index) => new ExtractedLineItem
                {
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalAmount = item.TotalAmount,
                    VatRate = item.VatRate,
                    Category = item.Category,
                    AiConfidenceScore = item.AiConfidenceScore
                }).ToList(),
                ExtractionConfidence = input.ExtractionConfidence,
                ExtractionMethod = input.ExtractionMethod,
                ExtractionSource = input.ExtractionSource,
                RawText = input.RawText
            };
        }

        private static PdfExtractionResult ToVerifiedResult(
            CreateInvoiceRequest request,
            decimal? confidence,
            PdfExtractionResult? sourceExtraction)
        {
            return new PdfExtractionResult
            {
                VendorName = request.VendorName,
                InvoiceNumber = request.InvoiceNumber,
                InvoiceDate = request.InvoiceDate,
                DueDate = request.DueDate,
                TotalAmount = request.TotalAmount,
                Subtotal = request.Subtotal,
                VatRate = request.VatRate,
                VatAmount = request.VatAmount,
                Currency = request.Currency,
                VendorTaxId = request.VendorTaxId,
                LastFourDigitsCard = request.LastFourDigitsCard,
                ItemCount = request.ItemCount,
                PaymentPlan = request.PaymentPlanTotalInstallments.HasValue
                    || request.PaymentPlanInstallmentAmount.HasValue
                    || request.PaymentPlanCurrentInstallment.HasValue
                    || !string.IsNullOrWhiteSpace(request.PaymentPlanFrequency)
                    || !string.IsNullOrWhiteSpace(request.PaymentPlanDescription)
                    ? new PaymentPlanInfo
                    {
                        TotalInstallments = request.PaymentPlanTotalInstallments,
                        InstallmentAmount = request.PaymentPlanInstallmentAmount,
                        Frequency = request.PaymentPlanFrequency,
                        CurrentInstallment = request.PaymentPlanCurrentInstallment,
                        Description = request.PaymentPlanDescription
                    }
                    : null,
                LineItems = request.LineItems.Select(item => new ExtractedLineItem
                {
                    Description = item.Description,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TotalAmount = item.TotalAmount,
                    VatRate = item.VatRate,
                    Category = item.Category,
                    AiConfidenceScore = item.AiConfidenceScore
                }).ToList(),
                ExtractionConfidence = confidence ?? sourceExtraction?.ExtractionConfidence ?? 0m,
                ExtractionMethod = sourceExtraction?.ExtractionMethod ?? "text",
                ExtractionSource = sourceExtraction?.ExtractionSource ?? "hybrid",
                RawText = sourceExtraction?.RawText
            };
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
    }
}
