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
        (bool Success, long? MatchId, string Message, decimal? MatchScore) AutoMatch(
            long invoiceId, long userId, decimal minConfidenceThreshold = 70m);
        AutoMatchBatchResult AutoMatchBatch(
            long companyId, long userId, decimal minConfidenceThreshold = 70m);
    }
}
