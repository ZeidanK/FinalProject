using Microsoft.AspNetCore.Http;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IFileStorageService
    {
        Task<(string RelativePath, string FullPath)> SaveAsync(IFormFile file, long companyId);
        Task<(string RelativePath, string FullPath)> SaveExcelAsync(IFormFile file, long companyId);
        Task<(string RelativePath, string FullPath)> SaveProfilePictureAsync(IFormFile file, long userId);
        string GetExcelFullPath(string relativePath);
        bool Delete(string relativePath);
    }
}
