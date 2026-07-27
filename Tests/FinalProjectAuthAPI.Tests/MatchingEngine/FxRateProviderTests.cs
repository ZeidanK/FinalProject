using FinalProjectAuthAPI.MatchingEngine;
using Xunit;

namespace FinalProjectAuthAPI.Tests.MatchingEngine
{
    public class FxRateProviderTests
    {
        private readonly MockFxRateProvider _provider = new();

        [Fact]
        public void GetRate_SameCurrency_ReturnsOne()
        {
            var rate = _provider.GetRate("USD", "USD", DateTime.Now);
            Assert.Equal(1.0m, rate);
        }

        [Fact]
        public void GetRate_UsdToEur_ReturnsCorrect()
        {
            var rate = _provider.GetRate("USD", "EUR", DateTime.Now);
            Assert.NotNull(rate);
            Assert.True(rate.Value > 0);
        }

        [Fact]
        public void GetRate_EurToUsd_ReturnsCorrect()
        {
            var rate = _provider.GetRate("EUR", "USD", DateTime.Now);
            Assert.NotNull(rate);
            Assert.True(rate.Value > 0);
        }

        [Fact]
        public void GetRate_ReturnsNull_ForUnknownCurrency()
        {
            var rate = _provider.GetRate("XYZ", "USD", DateTime.Now);
            Assert.Null(rate);
        }

        [Fact]
        public void GetRate_ReturnsNull_ForEmptyInput()
        {
            Assert.Null(_provider.GetRate("", "USD", DateTime.Now));
            Assert.Null(_provider.GetRate("USD", "", DateTime.Now));
        }
    }
}
