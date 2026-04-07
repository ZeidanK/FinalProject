using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IExcelExtractionService
    {
        ExcelExtractionResult Extract(Stream excelStream, string fileName);
    }
}
