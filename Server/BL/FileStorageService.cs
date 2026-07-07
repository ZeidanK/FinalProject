using System.Text.RegularExpressions;
using FinalProjectAuthAPI.BL.Interfaces;

namespace FinalProjectAuthAPI.BL
{
    public class FileStorageService : IFileStorageService
    {
        private readonly string _webRoot;
        private readonly string _contentRoot;
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
            _contentRoot = env.ContentRootPath;
            _webRoot = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
            _uploadsRoot = Path.Combine(_webRoot, UploadsFolder, "invoices");
            _excelUploadsRoot = Path.Combine(_webRoot, UploadsFolder, "transactions");
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

            var normalized = relativePath.Replace("\\", "/").TrimStart('/');

            // Prevent path traversal
            if (normalized.Contains(".."))
                throw new ArgumentException("Invalid file path.");

            // Scope to the excel uploads folder only
            if (!normalized.StartsWith("uploads/transactions/", StringComparison.OrdinalIgnoreCase))
                throw new ArgumentException("Invalid file path.");

            return ResolveStoredFilePath(normalized, "uploads/transactions/", "Excel file not found on server.");
        }

        public string GetInvoiceFullPath(string relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
                throw new ArgumentException("File path is required.");

            var normalized = relativePath.Replace("\\", "/").TrimStart('/');

            if (normalized.Contains(".."))
                throw new ArgumentException("Invalid file path.");

            if (!normalized.StartsWith("uploads/invoices/", StringComparison.OrdinalIgnoreCase))
                throw new ArgumentException("Invalid file path.");

            return ResolveStoredFilePath(normalized, "uploads/invoices/", "Invoice file not found on server.");
        }

        public bool Delete(string relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
                return false;

            // Prevent path traversal
            if (relativePath.Contains(".."))
                return false;

            var normalized = relativePath.Replace("\\", "/").TrimStart('/');
            var candidatePaths = BuildCandidatePaths(normalized);
            var fullPath = candidatePaths.FirstOrDefault(File.Exists) ?? candidatePaths[0];

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

            var profileDir = Path.Combine(_webRoot, UploadsFolder, "profiles");
            Directory.CreateDirectory(profileDir);

            var fullPath = Path.Combine(profileDir, uniqueName);
            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            var relativePath = $"uploads/profiles/{uniqueName}";
            return (relativePath, fullPath);
        }

        private string ResolveStoredFilePath(string normalizedRelativePath, string expectedPrefix, string notFoundMessage)
        {
            if (!normalizedRelativePath.StartsWith(expectedPrefix, StringComparison.OrdinalIgnoreCase))
                throw new ArgumentException("Invalid file path.");

            var candidatePaths = BuildCandidatePaths(normalizedRelativePath);
            var existingPath = candidatePaths.FirstOrDefault(File.Exists);

            if (existingPath != null)
                return existingPath;

            Console.WriteLine($"[ERROR] File not found at any candidate path. Relative: {normalizedRelativePath}");
            foreach (var path in candidatePaths)
                Console.WriteLine($"  Candidate: {path}  Exists={File.Exists(path)}");
            Console.WriteLine($"  WebRoot: {_webRoot}  ContentRoot: {_contentRoot}");

            throw new FileNotFoundException(notFoundMessage, candidatePaths[0]);
        }

        private List<string> BuildCandidatePaths(string normalizedRelativePath)
        {
            var relativePath = normalizedRelativePath.Replace("/", Path.DirectorySeparatorChar.ToString());
            var candidates = new List<string>();
            var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            void AddCandidate(string basePath)
            {
                if (string.IsNullOrWhiteSpace(basePath))
                    return;

                var fullPath = Path.GetFullPath(Path.Combine(basePath, relativePath));
                if (seen.Add(fullPath))
                    candidates.Add(fullPath);
            }

            AddCandidate(_webRoot);
            AddCandidate(Path.Combine(_contentRoot, "wwwroot"));
            AddCandidate(Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"));
            AddCandidate(Path.Combine(AppContext.BaseDirectory, "wwwroot"));

            var baseDirectory = new DirectoryInfo(AppContext.BaseDirectory);
            for (var i = 0; i < 5 && baseDirectory != null; i++, baseDirectory = baseDirectory.Parent)
            {
                AddCandidate(Path.Combine(baseDirectory.FullName, "wwwroot"));
            }

            return candidates;
        }
    }
}
