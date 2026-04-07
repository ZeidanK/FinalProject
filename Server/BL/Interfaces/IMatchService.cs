using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.Interfaces
{
    public interface IMatchService
    {
        List<MatchRow> GetByCompany(long companyId);
        MatchRow? GetById(long id);
        Task<List<MatchSuggestionRow>> GetSuggestionsAsync(long invoiceId);
        List<SimpleMatchSuggestion> GetSimpleSuggestions(long companyId);
        List<InstallmentGroupSuggestion> GetInstallmentSuggestions(long companyId);
        (bool Success, long Id, string Error) Create(CreateMatchRequest req, long matchedByUserId);
        bool Delete(long id);
        Task<(bool Success, long? MatchId, string Message, decimal? MatchScore)> AutoMatchAsync(
            long invoiceId, long userId, decimal minConfidenceThreshold = 70m);
        Task<AutoMatchBatchResult> AutoMatchBatchAsync(
            long companyId, long userId, decimal minConfidenceThreshold = 70m);
    }
}
