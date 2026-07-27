using FinalProjectAuthAPI.MatchingEngine;
using FinalProjectAuthAPI.Models;
using Xunit;

namespace FinalProjectAuthAPI.Tests.MatchingEngine
{
    public class CombinationEvaluatorTests
    {
        [Fact]
        public void FindExactSubset_ReturnsNull_ForEmptyList()
        {
            Assert.Null(CombinationEvaluator.FindExactSubset(new List<InvoiceRow>(), 100));
        }

        [Fact]
        public void FindExactSubset_ReturnsNull_ForZeroTarget()
        {
            var invoices = new List<InvoiceRow> { new InvoiceRow { TotalAmount = 100 } };
            Assert.Null(CombinationEvaluator.FindExactSubset(invoices, 0));
        }

        [Fact]
        public void FindExactSubset_FindsSingleInvoice()
        {
            var invoices = new List<InvoiceRow>
            {
                new InvoiceRow { Id = 1, TotalAmount = 500 },
                new InvoiceRow { Id = 2, TotalAmount = 300 },
            };

            var result = CombinationEvaluator.FindExactSubset(invoices, 300);

            Assert.NotNull(result);
            Assert.Single(result);
            Assert.Equal(2, result[0].Id);
        }

        [Fact]
        public void FindExactSubset_FindsMultipleInvoiceSubset()
        {
            var invoices = new List<InvoiceRow>
            {
                new InvoiceRow { Id = 1, TotalAmount = 300 },
                new InvoiceRow { Id = 2, TotalAmount = 200 },
                new InvoiceRow { Id = 3, TotalAmount = 100 },
            };

            var result = CombinationEvaluator.FindExactSubset(invoices, 300);

            Assert.NotNull(result);
            Assert.Single(result);
            Assert.Equal(1, result[0].Id);
        }

        [Fact]
        public void FindExactSubset_ReturnsNull_WhenNoCombinationWorks()
        {
            var invoices = new List<InvoiceRow>
            {
                new InvoiceRow { Id = 1, TotalAmount = 100 },
                new InvoiceRow { Id = 2, TotalAmount = 200 },
            };

            Assert.Null(CombinationEvaluator.FindExactSubset(invoices, 250));
        }

        [Fact]
        public void FindAllExactSubsets_ReturnsAllCombinations()
        {
            var invoices = new List<InvoiceRow>
            {
                new InvoiceRow { Id = 1, TotalAmount = 100 },
                new InvoiceRow { Id = 2, TotalAmount = 200 },
                new InvoiceRow { Id = 3, TotalAmount = 300 },
            };

            var results = CombinationEvaluator.FindAllExactSubsets(invoices, 300);

            Assert.Equal(2, results.Count);
        }
    }
}
