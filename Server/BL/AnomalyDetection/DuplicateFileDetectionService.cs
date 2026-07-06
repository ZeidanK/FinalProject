using System.Globalization;
using System.Security.Cryptography;
using System.Text;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.AnomalyDetection
{
    public class DuplicateFileDetectionService
    {
        private readonly DBservices _db;
        private readonly AnomalyCrudService _anomalyCrud;

        public DuplicateFileDetectionService(DBservices db, AnomalyCrudService anomalyCrud)
        {
            _db = db;
            _anomalyCrud = anomalyCrud;
        }

        public virtual (bool Success, long? UploadId, long? AnomalyId, bool IsDuplicate, string Error) RegisterTransactionFileUpload(
            long companyId,
            string fileOriginalName,
            string filePath,
            long fileSize,
            long uploadedByUserId,
            string fileHashSha256,
            DateTime? firstTransactionDate,
            DateTime? lastTransactionDate)
        {
            _db.EnsureTransactionFileUploadsTable();

            var uploadId = _db.CreateTransactionFileUpload(
                companyId,
                fileHashSha256,
                fileOriginalName,
                filePath,
                fileSize,
                uploadedByUserId);

            if (uploadId <= 0)
                return (false, null, null, false, "Failed to register uploaded file.");

            var uploadCount = _db.CountTransactionFileUploadsByHash(companyId, fileHashSha256);
            var isDuplicate = uploadCount > 1;
            if (!isDuplicate)
                return (true, uploadId, null, false, string.Empty);

            var existingAnomalyId = _db.GetOpenDuplicateFileAnomalyId(companyId, fileHashSha256);
            long anomalyId;

            if (existingAnomalyId.HasValue)
            {
                anomalyId = existingAnomalyId.Value;
            }
            else
            {
                var createResult = _anomalyCrud.Create(new CreateAnomalyRequest
                {
                    CompanyId = companyId,
                    AnomalyType = "duplicate_transaction_file",
                    Title = $"Duplicate transaction file - {FormatTransactionPeriod(firstTransactionDate, lastTransactionDate)}",
                    Description =
                        "This Excel file matches a previously imported transaction file. " +
                        "The duplicate upload was detected and its transactions were not imported.",
                    Severity = "high",
                    SuggestedAction = "No action is required. The original import was kept and the duplicate was skipped.",
                    DetectionMethod = "manual",
                    DetectionConfidence = 1m,
                });

                if (!createResult.Success)
                    return (false, uploadId, null, true, createResult.Error);

                anomalyId = createResult.Id;
            }

            _db.AssignTransactionFileUploadAnomaly(uploadId, anomalyId);
            return (true, uploadId, anomalyId, true, string.Empty);
        }

        public virtual string BuildFileGroupKey(long companyId, string fileHash)
        {
            var raw = $"file|{companyId}|{fileHash.Trim().ToLowerInvariant()}";
            return $"file:{ComputeStableHash(raw)}";
        }

        private static string ComputeStableHash(string value)
        {
            var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(value));
            return Convert.ToHexString(bytes).ToLowerInvariant();
        }

        private static string FormatTransactionPeriod(DateTime? firstDate, DateTime? lastDate)
        {
            if (!firstDate.HasValue)
                return "Unknown period";

            var start = firstDate.Value;
            var end = lastDate ?? start;
            if (start.Year == end.Year && start.Month == end.Month)
                return start.ToString("MMMM yyyy", CultureInfo.InvariantCulture);

            return $"{start.ToString("MMMM yyyy", CultureInfo.InvariantCulture)} - {end.ToString("MMMM yyyy", CultureInfo.InvariantCulture)}";
        }
    }
}
