using System.Text.RegularExpressions;
using FinalProjectAuthAPI.BL.Interfaces;

namespace FinalProjectAuthAPI.BL
{
    public class FileStorageService : IFileStorageService
    {
        private readonly string _uploadsRoot;
        private readonly string _excelUploadsRoot;

        private const string UploadsFolder = "uploads";

        private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase) { ".pdf" };
        private static readonly HashSet<string> AllowedContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "application/pdf"
        };

        private static readonly HashSet<string> AllowedImageExtensions = new(StringComparer.OrdinalIgnoreCase)
        {
            ".jpg", ".jpeg", ".png", ".gif", ".webp"
        };
        private static readonly HashSet<string> AllowedImageContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "image/jpeg", "image/png", "image/gif", "image/webp"
        };
        private const long MaxImageSize = 5 * 1024 * 1024; // 5 MB

        private static readonly HashSet<string> AllowedExcelExtensions = new(StringComparer.OrdinalIgnoreCase) { ".xlsx", ".xls" };
        private static readonly HashSet<string> AllowedExcelContentTypes = new(StringComparer.OrdinalIgnoreCase)
        {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "application/vnd.ms-excel"
        };

        private const long MaxFileSize = 10 * 1024 * 1024; // 10 MB

        public FileStorageService(IWebHostEnvironment env)
        {
            var wwwroot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
            _uploadsRoot = Path.Combine(wwwroot, UploadsFolder, "invoices");
            _excelUploadsRoot = Path.Combine(wwwroot, UploadsFolder, "transactions");
        }

        public async Task<(string RelativePath, string FullPath)> SaveAsync(IFormFile file, long companyId)
        {
            // Validate file
            if (file == null || file.Length == 0)
                throw new ArgumentException("No file provided.");

            if (file.Length > MaxFileSize)
                throw new ArgumentException($"File size exceeds the maximum allowed size of {MaxFileSize / (1024 * 1024)} MB.");

            var extension = Path.GetExtension(file.FileName);
            if (!AllowedExtensions.Contains(extension))
                throw new ArgumentException($"File type '{extension}' is not allowed. Only PDF files are accepted.");

            if (!AllowedContentTypes.Contains(file.ContentType))
                throw new ArgumentException($"Content type '{file.ContentType}' is not allowed.");

            // Sanitize the original file name
            var sanitizedName = SanitizeFileName(Path.GetFileNameWithoutExtension(file.FileName));
            var uniqueName = $"{Guid.NewGuid():N}_{sanitizedName}{extension}";

            // Build directory path
            var companyDir = Path.Combine(_uploadsRoot, companyId.ToString());
            Directory.CreateDirectory(companyDir);

            // Save file
            var fullPath = Path.Combine(companyDir, uniqueName);
            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var relativePath = Path.Combine(UploadsFolder, "invoices", companyId.ToString(), uniqueName)
                                   .Replace("\\", "/");

            return (relativePath, fullPath);
        }

        public async Task<(string RelativePath, string FullPath)> SaveExcelAsync(IFormFile file, long companyId)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("No file provided.");

            if (file.Length > MaxFileSize)
                throw new ArgumentException($"File size exceeds the maximum allowed size of {MaxFileSize / (1024 * 1024)} MB.");

            var extension = Path.GetExtension(file.FileName);
            if (!AllowedExcelExtensions.Contains(extension))
                throw new ArgumentException($"File type '{extension}' is not allowed. Only Excel files (.xlsx, .xls) are accepted.");

            if (!AllowedExcelContentTypes.Contains(file.ContentType))
                throw new ArgumentException($"Content type '{file.ContentType}' is not allowed.");

            var sanitizedName = SanitizeFileName(Path.GetFileNameWithoutExtension(file.FileName));
            var uniqueName = $"{Guid.NewGuid():N}_{sanitizedName}{extension}";

            var companyDir = Path.Combine(_excelUploadsRoot, companyId.ToString());
            Directory.CreateDirectory(companyDir);

            var fullPath = Path.Combine(companyDir, uniqueName);
            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var relativePath = Path.Combine(UploadsFolder, "transactions", companyId.ToString(), uniqueName)
                                   .Replace("\\", "/");

            return (relativePath, fullPath);
        }

        public string GetExcelFullPath(string relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
                throw new ArgumentException("File path is required.");

            var normalized = relativePath.Replace("\\", "/");

            // Prevent path traversal
            if (normalized.Contains(".."))
                throw new ArgumentException("Invalid file path.");

            // Scope to the excel uploads folder only
            if (!normalized.StartsWith("uploads/transactions/", StringComparison.OrdinalIgnoreCase))
                throw new ArgumentException("Invalid file path.");

            var wwwroot = Directory.GetParent(_excelUploadsRoot)!.Parent!.FullName;
            var fullPath = Path.Combine(wwwroot, normalized.Replace("/", Path.DirectorySeparatorChar.ToString()));

            if (!File.Exists(fullPath))
                throw new FileNotFoundException("Excel file not found on server.", fullPath);

            return fullPath;
        }

        public bool Delete(string relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
                return false;

            // Prevent path traversal
            if (relativePath.Contains(".."))
                return false;

            var fullPath = Path.Combine(
                Directory.GetParent(_uploadsRoot)!.Parent!.FullName,
                relativePath.Replace("/", Path.DirectorySeparatorChar.ToString()));

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
                return true;
            }
            return false;
        }

        private static string SanitizeFileName(string fileName)
        {
            // Remove invalid chars and limit length
            var sanitized = Regex.Replace(fileName, @"[^\w\-.]", "_");
            return sanitized.Length > 50 ? sanitized[..50] : sanitized;
        }
        public async Task<(string RelativePath, string FullPath)> SaveProfilePictureAsync(IFormFile file, long userId)
        {
            if (file == null || file.Length == 0)
                throw new ArgumentException("No file provided.");

            if (file.Length > MaxImageSize)
                throw new ArgumentException($"File size exceeds the maximum allowed size of {MaxImageSize / (1024 * 1024)} MB.");

            var extension = Path.GetExtension(file.FileName);
            if (!AllowedImageExtensions.Contains(extension))
                throw new ArgumentException($"File type '{extension}' is not allowed. Only image files (jpg, png, gif, webp) are accepted.");

            if (!AllowedImageContentTypes.Contains(file.ContentType))
                throw new ArgumentException($"Content type '{file.ContentType}' is not allowed.");

            var uniqueName = $"{userId}_{Guid.NewGuid():N}{extension}";

            var wwwroot = Directory.GetParent(_uploadsRoot)!.Parent!.FullName;
            var profileDir = Path.Combine(wwwroot, UploadsFolder, "profiles");
            Directory.CreateDirectory(profileDir);

            var fullPath = Path.Combine(profileDir, uniqueName);
            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var relativePath = $"uploads/profiles/{uniqueName}";
            return (relativePath, fullPath);
        }    }
}
