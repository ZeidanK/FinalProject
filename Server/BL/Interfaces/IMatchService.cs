using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IMatchService
    {
        List<MatchRow> GetByCompany(long companyId);
        MatchRow? GetById(long id);
        List<MatchSuggestionRow> GetSuggestions(long invoiceId);
        (bool Success, long Id, string Error) Create(CreateMatchRequest req, long matchedByUserId);
        bool Delete(long id);
    }
}
