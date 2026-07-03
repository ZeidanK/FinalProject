using FinalProjectAuthAPI.Models;
using Mscc.GenerativeAI;

namespace FinalProjectAuthAPI.BL.GeminiExtraction
{
    public class GeminiApiClient
    {
        private readonly GeminiApiKeyPool _keyPool;
        private readonly List<string> _models;
        private readonly ILogger<GeminiApiClient> _logger;

        private static readonly SemaphoreSlim _globalGeminiThrottle = new(1, 1);
        private static DateTime _lastGeminiGlobalRequestUtc = DateTime.MinValue;

        public GeminiApiClient(GeminiApiKeyPool keyPool, GeminiSettings settings, ILogger<GeminiApiClient> logger)
        {
            _keyPool = keyPool;
            _logger = logger;
            _models = settings.Models.Count > 0
                ? settings.Models
                : new List<string> { settings.Model };
        }

        public async Task<T?> TryAllModelsAsync<T>(Func<GenerativeModel, Task<T?>> action, string operationName) where T : class
        {
            var attemptCount = 0;
            const int minDelayMillisecondsGlobal = 500;

            await _globalGeminiThrottle.WaitAsync();
            try
            {
                var now = DateTime.UtcNow;
                var elapsed = now - _lastGeminiGlobalRequestUtc;
                if (elapsed < TimeSpan.FromMilliseconds(minDelayMillisecondsGlobal))
                {
                    await Task.Delay(TimeSpan.FromMilliseconds(minDelayMillisecondsGlobal) - elapsed);
                }
                _lastGeminiGlobalRequestUtc = DateTime.UtcNow;
            }
            finally
            {
                _globalGeminiThrottle.Release();
            }

            var startingKeyIndex = _keyPool.PreferredKeyIndex;
            const int delayMillisecondsBetweenKeyAttempts = 750;

            foreach (var modelName in _models)
            {
                for (var keyOffset = 0; keyOffset < _keyPool.Count; keyOffset++)
                {
                    var keyIndex = (startingKeyIndex + keyOffset) % _keyPool.Count;
                    attemptCount++;

                    if (keyOffset > 0)
                        await Task.Delay(delayMillisecondsBetweenKeyAttempts);

                    try
                    {
                        _keyPool.Prefer((keyIndex + 1) % _keyPool.Count);

                        var model = _keyPool.GetClient(keyIndex).GenerativeModel(model: modelName);
                        Console.WriteLine(
                            $"[GEMINI] Operation={operationName} Model={modelName} KeyIndex={keyIndex} KeyNumber={keyIndex + 1}/{_keyPool.Count}"
                        );
                        _logger.LogDebug(
                            "{Operation}: sending request with Gemini key {KeyNumber}/{KeyCount} (keyIndex={KeyIndex}) for model {Model}",
                            operationName,
                            keyIndex + 1,
                            _keyPool.Count,
                            keyIndex,
                            modelName);

                        var result = await action(model);

                        if (result != null)
                        {
                            return result;
                        }
                    }
                    catch (Exception ex)
                    {
                        if (IsQuotaExhaustion(ex))
                        {
                            _logger.LogWarning(
                                "{Operation}: Gemini key {KeyNumber} hit a quota/rate limit for model {Model}; trying the next key.",
                                operationName,
                                keyIndex + 1,
                                modelName);
                        }
                        else
                        {
                            _logger.LogDebug(
                                "{Operation}: Gemini key {KeyNumber} failed for model {Model} ({ExceptionType}); trying the next key.",
                                operationName,
                                keyIndex + 1,
                                modelName,
                                ex.GetType().Name);
                        }
                    }
                }
            }

            _logger.LogError(
                "{Operation}: all {AttemptCount} Gemini key/model combinations were exhausted.",
                operationName,
                attemptCount);
            return null;
        }

        private static bool IsQuotaExhaustion(Exception exception)
        {
            for (Exception? current = exception; current != null; current = current.InnerException)
            {
                if (current is HttpRequestException httpException
                    && httpException.StatusCode == System.Net.HttpStatusCode.TooManyRequests)
                {
                    return true;
                }

                var message = current.Message;
                if (message.Contains("429", StringComparison.OrdinalIgnoreCase)
                    || message.Contains("RESOURCE_EXHAUSTED", StringComparison.OrdinalIgnoreCase)
                    || message.Contains("quota", StringComparison.OrdinalIgnoreCase)
                    || message.Contains("rate limit", StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }

            return false;
        }
    }
}
