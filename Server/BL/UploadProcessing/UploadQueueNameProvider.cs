using System.Text.RegularExpressions;
using FinalProjectAuthAPI.BL.Interfaces;

namespace FinalProjectAuthAPI.BL.UploadProcessing
{
    public class UploadQueueNameProvider : IUploadQueueNameProvider
    {
        public UploadQueueNameProvider(IConfiguration configuration)
        {
            var configuredName = configuration["Hangfire:UploadQueueName"];
            var rawName = string.IsNullOrWhiteSpace(configuredName)
                ? $"uploads_{Environment.MachineName}"
                : configuredName;

            UploadQueueName = Normalize(rawName);
        }

        public string UploadQueueName { get; }

        public static string Normalize(string? queueName)
        {
            var raw = string.IsNullOrWhiteSpace(queueName) ? "uploads_default" : queueName.Trim();
            var normalized = Regex.Replace(raw.ToLowerInvariant(), @"[^a-z0-9_]+", "_");
            normalized = Regex.Replace(normalized, @"_+", "_").Trim('_');

            if (string.IsNullOrWhiteSpace(normalized))
                normalized = "uploads_default";

            if (!char.IsLetter(normalized[0]))
                normalized = $"uploads_{normalized}";

            return normalized;
        }
    }
}
