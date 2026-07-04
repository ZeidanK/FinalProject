using System.Text;
using FinalProjectAuthAPI.BL;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Hosting;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class FileStorageServiceTests : IDisposable
    {
        private readonly string _tempRoot;
        private readonly Mock<IWebHostEnvironment> _mockEnv;
        private readonly FileStorageService _service;

        public FileStorageServiceTests()
        {
            _tempRoot = Path.Combine(Path.GetTempPath(), "fs_test_" + Guid.NewGuid().ToString("N"));
            Directory.CreateDirectory(_tempRoot);
            _mockEnv = new Mock<IWebHostEnvironment>();
            _mockEnv.Setup(x => x.WebRootPath).Returns(Path.Combine(_tempRoot, "wwwroot"));
            _mockEnv.Setup(x => x.ContentRootPath).Returns(_tempRoot);
            _service = new FileStorageService(_mockEnv.Object);
        }

        public void Dispose()
        {
            try { Directory.Delete(_tempRoot, true); } catch { }
        }

        private static IFormFile MakeFormFile(string content, string fileName, string contentType = "application/pdf")
        {
            var bytes = Encoding.UTF8.GetBytes(content);
            var stream = new MemoryStream(bytes);
            return new FormFile(stream, 0, bytes.Length, "file", fileName)
            {
                Headers = new HeaderDictionary(),
                ContentType = contentType
            };
        }

        [Fact]
        public async Task SaveAsync_ValidPdf_SavesFile()
        {
            var file = MakeFormFile("%PDF-1.4 test content", "invoice.pdf");

            var (relativePath, fullPath) = await _service.SaveAsync(file, 1);

            Assert.StartsWith("uploads/invoices/1/", relativePath);
            Assert.True(File.Exists(fullPath));
            Assert.EndsWith(".pdf", relativePath);
        }

        [Fact]
        public async Task SaveAsync_NullFile_Throws()
        {
            await Assert.ThrowsAsync<ArgumentException>(() => _service.SaveAsync(null!, 1));
        }

        [Fact]
        public async Task SaveAsync_EmptyFile_Throws()
        {
            var file = MakeFormFile("", "empty.pdf");
            await Assert.ThrowsAsync<ArgumentException>(() => _service.SaveAsync(file, 1));
        }

        [Fact]
        public async Task SaveAsync_ExceedsMaxSize_Throws()
        {
            var big = new string('x', 11 * 1024 * 1024);
            var file = MakeFormFile(big, "big.pdf");
            await Assert.ThrowsAsync<ArgumentException>(() => _service.SaveAsync(file, 1));
        }

        [Fact]
        public async Task SaveAsync_InvalidExtension_Throws()
        {
            var file = MakeFormFile("content", "invoice.txt", "text/plain");
            await Assert.ThrowsAsync<ArgumentException>(() => _service.SaveAsync(file, 1));
        }

        [Fact]
        public async Task SaveAsync_InvalidContentType_Throws()
        {
            var file = MakeFormFile("content", "invoice.pdf", "text/plain");
            await Assert.ThrowsAsync<ArgumentException>(() => _service.SaveAsync(file, 1));
        }

        [Fact]
        public async Task SaveExcelAsync_ValidXlsx_SavesFile()
        {
            var file = MakeFormFile("Excel content", "transactions.xlsx",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

            var (relativePath, fullPath) = await _service.SaveExcelAsync(file, 2);

            Assert.StartsWith("uploads/transactions/2/", relativePath);
            Assert.True(File.Exists(fullPath));
            Assert.EndsWith(".xlsx", relativePath);
        }

        [Fact]
        public async Task SaveExcelAsync_InvalidExtension_Throws()
        {
            var file = MakeFormFile("content", "data.csv", "text/csv");
            await Assert.ThrowsAsync<ArgumentException>(() => _service.SaveExcelAsync(file, 2));
        }

        [Fact]
        public async Task SaveExcelAsync_InvalidContentType_Throws()
        {
            var file = MakeFormFile("content", "data.xlsx", "application/pdf");
            await Assert.ThrowsAsync<ArgumentException>(() => _service.SaveExcelAsync(file, 2));
        }

        [Fact]
        public void GetExcelFullPath_ValidPath_ReturnsPath()
        {
            // Create the file first
            var dir = Path.Combine(_tempRoot, "wwwroot", "uploads", "transactions", "1");
            Directory.CreateDirectory(dir);
            var existingFile = Path.Combine(dir, "test.xlsx");
            File.WriteAllText(existingFile, "test");

            var fullPath = _service.GetExcelFullPath("uploads/transactions/1/test.xlsx");

            Assert.Equal(existingFile, fullPath);
        }

        [Fact]
        public void GetExcelFullPath_NullPath_Throws()
        {
            Assert.Throws<ArgumentException>(() => _service.GetExcelFullPath(null!));
        }

        [Fact]
        public void GetExcelFullPath_EmptyPath_Throws()
        {
            Assert.Throws<ArgumentException>(() => _service.GetExcelFullPath("  "));
        }

        [Fact]
        public void GetExcelFullPath_PathTraversal_Throws()
        {
            Assert.Throws<ArgumentException>(() => _service.GetExcelFullPath("uploads/transactions/1/../../etc/passwd"));
        }

        [Fact]
        public void GetExcelFullPath_WrongFolder_Throws()
        {
            Assert.Throws<ArgumentException>(() => _service.GetExcelFullPath("uploads/invoices/1/test.pdf"));
        }

        [Fact]
        public void GetInvoiceFullPath_FileNotFound_Throws()
        {
            Assert.Throws<FileNotFoundException>(() =>
                _service.GetInvoiceFullPath("uploads/invoices/1/nonexistent.pdf"));
        }

        [Fact]
        public void Delete_ValidFile_ReturnsTrue()
        {
            var dir = Path.Combine(_tempRoot, "wwwroot", "uploads", "invoices", "1");
            Directory.CreateDirectory(dir);
            var path = Path.Combine(dir, "test.pdf");
            File.WriteAllText(path, "content");

            var result = _service.Delete("uploads/invoices/1/test.pdf");

            Assert.True(result);
            Assert.False(File.Exists(path));
        }

        [Fact]
        public void Delete_NullPath_ReturnsFalse()
        {
            Assert.False(_service.Delete(null!));
        }

        [Fact]
        public void Delete_EmptyPath_ReturnsFalse()
        {
            Assert.False(_service.Delete(""));
        }

        [Fact]
        public void Delete_PathTraversal_ReturnsFalse()
        {
            Assert.False(_service.Delete("uploads/invoices/1/../../etc/passwd"));
        }

        [Fact]
        public void Delete_NonExistent_ReturnsFalse()
        {
            Assert.False(_service.Delete("uploads/invoices/1/nonexistent.pdf"));
        }

        [Fact]
        public async Task SaveProfilePictureAsync_ValidImage_SavesFile()
        {
            var file = MakeFormFile("image data", "photo.jpg", "image/jpeg");

            var (relativePath, fullPath) = await _service.SaveProfilePictureAsync(file, 42);

            Assert.StartsWith("uploads/profiles/", relativePath);
            Assert.Contains("42_", relativePath);
            Assert.True(File.Exists(fullPath));
            Assert.EndsWith(".jpg", relativePath);
        }

        [Fact]
        public async Task SaveProfilePictureAsync_InvalidExtension_Throws()
        {
            var file = MakeFormFile("data", "photo.bmp", "image/bmp");
            await Assert.ThrowsAsync<ArgumentException>(() => _service.SaveProfilePictureAsync(file, 1));
        }

        [Fact]
        public async Task SaveProfilePictureAsync_TooLarge_Throws()
        {
            var big = new string('x', 6 * 1024 * 1024);
            var file = MakeFormFile(big, "photo.jpg", "image/jpeg");
            await Assert.ThrowsAsync<ArgumentException>(() => _service.SaveProfilePictureAsync(file, 1));
        }
    }
}
