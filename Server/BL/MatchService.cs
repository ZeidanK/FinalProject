using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.BL.Matching;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL
{
    public class MatchService : IMatchService
    {
        private readonly MatchCrudService _crud;
        private readonly MatchSuggestionService _suggestions;
        private readonly AutoMatchService _autoMatch;

        public MatchService(
            MatchCrudService crud,
            MatchSuggestionService suggestions,
            AutoMatchService autoMatch)
        {
            _crud = crud;
            _suggestions = suggestions;
            _autoMatch = autoMatch;
        }

        public List<MatchRow> GetByCompany(long companyId) =>
            _crud.GetByCompany(companyId);

        public MatchRow? GetById(long id) =>
            _crud.GetById(id);

        public List<MatchRow> GetMatchesByInvoice(long invoiceId) =>
            _crud.GetMatchesByInvoice(invoiceId);

        public List<SimpleMatchSuggestion> GetSimpleSuggestions(long companyId) =>
            _suggestions.GetSimpleSuggestions(companyId);

        public List<InstallmentGroupSuggestion> GetInstallmentSuggestions(long companyId) =>
            _suggestions.GetInstallmentSuggestions(companyId);

        public async Task<List<MatchSuggestionRow>> GetSuggestionsAsync(long invoiceId) =>
            await _suggestions.GetSuggestionsAsync(invoiceId);

        public async Task<(bool Success, long? MatchId, string Message, decimal? MatchScore)> AutoMatchAsync(
            long invoiceId, long userId, decimal minConfidenceThreshold = 70m) =>
            await _autoMatch.AutoMatchAsync(invoiceId, userId, minConfidenceThreshold);

        public async Task<AutoMatchBatchResult> AutoMatchBatchAsync(
            long companyId, long userId, decimal minConfidenceThreshold = 70m) =>
            await _autoMatch.AutoMatchBatchAsync(companyId, userId, minConfidenceThreshold);

        public (bool Success, long Id, string Error) Create(CreateMatchRequest req, long matchedByUserId) =>
            _crud.Create(req, matchedByUserId);

        public bool Delete(long id) =>
            _crud.Delete(id);

        public static string GetConfidenceCategory(decimal matchScore) =>
            MatchCrudService.GetConfidenceCategory(matchScore);
    }
}
