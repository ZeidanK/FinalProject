using FinalProjectAuthAPI.BL.UploadProcessing;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL.UploadProcessing
{
    public class UploadQueueNameProviderTests
    {
        [Theory]
        [InlineData("uploads_My Laptop", "uploads_my_laptop")]
        [InlineData("DEV.PC-01", "dev_pc_01")]
        [InlineData("123 machine", "uploads_123_machine")]
        [InlineData("___", "uploads_default")]
        [InlineData(null, "uploads_default")]
        public void Normalize_SanitizesHangfireQueueNames(string? input, string expected)
        {
            Assert.Equal(expected, UploadQueueNameProvider.Normalize(input));
        }
    }
}
