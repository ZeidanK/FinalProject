using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinalProjectAuthAPI.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MatchesController : ApiControllerBase
    {
        private readonly IMatchService _svc;

        public MatchesController(IMatchService svc)
        {
            _svc = svc;
        }

        // GET api/matches/company/{companyId}
        [HttpGet("company/{companyId:long}")]
        public IActionResult GetByCompany(long companyId) =>
            Ok(_svc.GetByCompany(companyId));

        // GET api/matches/{id}
        [HttpGet("{id:long}")]
        public IActionResult GetById(long id)
        {
            var match = _svc.GetById(id);
            return match is null ? NotFound(new { message = "Match not found." }) : Ok(match);
        }

        // GET api/matches/suggestions/{invoiceId}
        [HttpGet("suggestions/{invoiceId:long}")]
        public async Task<IActionResult> GetSuggestions(long invoiceId) =>
            Ok(await _svc.GetSuggestionsAsync(invoiceId));

        // POST api/matches
        [HttpPost]
        public IActionResult Create([FromBody] CreateMatchRequest request)
        {
            var userId = GetCurrentUserId();
            var (success, id, error) = _svc.Create(request, userId);

            return success
                ? CreatedAtAction(nameof(GetById), new { id }, new { id, message = "Match created." })
                : BadRequest(new { message = error });
        }

        // POST api/matches/auto-match/{invoiceId}
        /// <summary>
        /// Automatically match an invoice with the best transaction candidate.
        /// Query params: minConfidence (default: 70)
        /// </summary>
        [HttpPost("auto-match/{invoiceId:long}")]
        public async Task<IActionResult> AutoMatch(long invoiceId, [FromQuery] decimal? minConfidence)
        {
            var userId = GetCurrentUserId();
            var threshold = minConfidence ?? 70m;
            
            var (success, matchId, message, score) = await _svc.AutoMatchAsync(invoiceId, userId, threshold);
            
            if (success)
                return Ok(new { 
                    matchId, 
                    message, 
                    matchScore = score,
                    confidenceLevel = MatchService.GetConfidenceCategory(score ?? 0)
                });
            
            return BadRequest(new { message, matchScore = score });
        }

        // POST api/matches/auto-match-batch/{companyId}
        /// <summary>
        /// Batch auto-match all unmatched invoices for a company.
        /// Query params: minConfidence (default: 70)
        /// </summary>
        [HttpPost("auto-match-batch/{companyId:long}")]
        public async Task<IActionResult> AutoMatchBatch(long companyId, [FromQuery] decimal? minConfidence)
        {
            var result = await ExecuteAutoMatchBatch(companyId, minConfidence);
            
            return Ok(new { 
                successfulMatches = result.SuccessfulMatches,
                skippedInvoices = result.SkippedInvoices,
                totalProcessed = result.SuccessfulMatches + result.SkippedInvoices,
                matchDetails = result.MatchDetails,
                suggestionsForReview = result.SuggestionsForReview,
                message = $"Auto-matched {result.SuccessfulMatches} invoices. " +
                         $"{result.SuggestionsForReview.Count} require manual review."
            });
        }

        // POST api/matches/auto-match-on-load/{companyId}
        /// <summary>
        /// Trigger automatic batch matching on page load.
        /// Used when user navigates to the matches page to automatically find new matches.
        /// Query params: minConfidence (default: 70)
        /// </summary>
        [HttpPost("auto-match-on-load/{companyId:long}")]
        public async Task<IActionResult> AutoMatchOnLoad(long companyId, [FromQuery] decimal? minConfidence)
        {
            var result = await ExecuteAutoMatchBatch(companyId, minConfidence);
            
            return Ok(new { 
                successfulMatches = result.SuccessfulMatches,
                skippedInvoices = result.SkippedInvoices,
                totalProcessed = result.SuccessfulMatches + result.SkippedInvoices,
                message = result.SuccessfulMatches > 0 
                    ? $"✓ {result.SuccessfulMatches} automatic match(es) found"
                    : "No automatic matches found"
            });
        }

        // DELETE api/matches/{id}
        [HttpDelete("{id:long}")]
        public IActionResult Delete(long id)
        {
            var ok = _svc.Delete(id);
            return ok ? Ok(new { message = "Match deleted." }) : NotFound(new { message = "Match not found." });
        }

        private async Task<AutoMatchBatchResult> ExecuteAutoMatchBatch(long companyId, decimal? minConfidence)
        {
            var userId = GetCurrentUserId();
            var threshold = minConfidence ?? 70m;
            return await _svc.AutoMatchBatchAsync(companyId, userId, threshold);
        }
    }
}
