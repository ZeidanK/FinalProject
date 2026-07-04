using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.DAL;
using FinalProjectAuthAPI.Models;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class ReportServiceTests
    {
        private readonly Mock<DBservices> _mockDb;
        private readonly ReportService _service;

        public ReportServiceTests()
        {
            _mockDb = new Mock<DBservices>();
            _service = new ReportService(_mockDb.Object);
        }

        [Fact]
        public void GetDashboardStats_ReturnsStats()
        {
            var stats = new DashboardStatsRow { TotalInvoices = 100, TotalTransactions = 50 };
            _mockDb.Setup(x => x.GetDashboardStats(5)).Returns(stats);

            var result = _service.GetDashboardStats(5);

            Assert.Same(stats, result);
        }

        [Fact]
        public void GetReconciliationReport_ReturnsReport()
        {
            var report = new ReconciliationReport();
            _mockDb.Setup(x => x.GetReconciliationReport(5, null, null)).Returns(report);

            var result = _service.GetReconciliationReport(5);

            Assert.Same(report, result);
        }

        [Fact]
        public void GetReconciliationReport_WithDates_PassesDates()
        {
            var start = new DateTime(2026, 1, 1);
            var end = new DateTime(2026, 6, 30);
            var report = new ReconciliationReport();
            _mockDb.Setup(x => x.GetReconciliationReport(5, start, end)).Returns(report);

            var result = _service.GetReconciliationReport(5, start, end);

            Assert.Same(report, result);
        }

        [Fact]
        public void GetPayablesAgingReport_ReturnsReport()
        {
            var asOf = new DateTime(2026, 7, 1);
            var report = new PayablesAgingReport();
            _mockDb.Setup(x => x.GetPayablesAgingReport(5, asOf)).Returns(report);

            var result = _service.GetPayablesAgingReport(5, asOf);

            Assert.Same(report, result);
        }
    }
}
