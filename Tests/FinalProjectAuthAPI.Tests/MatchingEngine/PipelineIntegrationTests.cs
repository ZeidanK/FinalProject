using System.Reflection;
using System.Text.Json;
using FinalProjectAuthAPI.MatchingEngine;
using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.Tests.MatchingEngine
{
    public class PipelineIntegrationTests
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNameCaseInsensitive = false,
            PropertyNamingPolicy = new SnakeCaseNamingPolicy(),
            Converters = { new BoolStringConverter() }
        };

        private readonly RulePipelineEngine _engine = new(new MockFxRateProvider());

        public static readonly TheoryData<long, int, int> CompanyStatsData = new()
        {
            { 3, 2, 18 },
            { 5, 1, 20 },
            { 6, 31, 133 },
            { 7, 1, 67 },
            { 8, 20, 180 },
            { 11, 8, 133 },
        };

        private string ResolveDataPath(string filename)
        {
            var dir = new DirectoryInfo(AppContext.BaseDirectory);
            for (int i = 0; i < 5; i++)
                dir = dir.Parent;

            var path = Path.Combine(dir.FullName, "Server", "DAL", filename);
            if (File.Exists(path))
                return path;

            path = Path.Combine(Directory.GetCurrentDirectory(), filename);
            if (File.Exists(path))
                return path;

            var asmDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
            path = Path.Combine(asmDir!, filename);
            if (File.Exists(path))
                return path;

            throw new FileNotFoundException($"Cannot find data file: {filename}. Checked multiple locations.");
        }

        [Fact]
        public void LoadInvoiceJson_Succeeds()
        {
            var path = ResolveDataPath("current invoices in the database.json");
            var json = File.ReadAllText(path);
            var invoices = JsonSerializer.Deserialize<List<InvoiceRow>>(json, JsonOptions);
            Assert.NotNull(invoices);
            Assert.True(invoices.Count > 0);
        }

        [Fact]
        public void LoadTransactionJson_Succeeds()
        {
            var path = ResolveDataPath("current transactions in database.json");
            var json = File.ReadAllText(path);
            var transactions = JsonSerializer.Deserialize<List<TransactionRow>>(json, JsonOptions);
            Assert.NotNull(transactions);
            Assert.True(transactions.Count > 0);
        }

        [Theory]
        [MemberData(nameof(CompanyStatsData))]
        public void Pipeline_ProcessesCompanyData_WithoutError(long companyId, int expectedInvoiceCount, int expectedTxnCount)
        {
            var invoices = LoadInvoicesForCompany(companyId);
            var transactions = LoadTransactionsForCompany(companyId);

            Assert.Equal(expectedInvoiceCount, invoices.Count);
            Assert.Equal(expectedTxnCount, transactions.Count);

            var result = _engine.Execute(invoices, transactions);

            Assert.NotNull(result);
            Assert.True(result.InvoicesProcessed <= invoices.Count);
            Assert.True(result.TransactionsProcessed <= transactions.Count);
        }

        [Fact]
        public void Company8_KspInstallmentInvoice_GetsAutoMatched()
        {
            var invoices = LoadInvoicesForCompany(8);
            var transactions = LoadTransactionsForCompany(8);
            var result = _engine.Execute(invoices, transactions);

            var kspInvoice = invoices.FirstOrDefault(i => i.Id == 80);
            Assert.NotNull(kspInvoice);
            Assert.True(kspInvoice.PaymentPlanTotalInstallments > 1);

            var kspMatches = result.AutoMatches.Where(m => m.InvoiceId == 80).ToList();
            Assert.NotEmpty(kspMatches);

            Assert.Equal(7, kspMatches.Count);

            foreach (var match in kspMatches)
            {
                var txn = transactions.FirstOrDefault(t => t.Id == match.TransactionId);
                Assert.NotNull(txn);
                Assert.True(TxPoolClassifier.IsInstallmentTxn(txn),
                    $"KSP match txn {txn.Id} should be installment type");
                Assert.NotNull(match.InstallmentNumber);
            }
        }

        [Fact]
        public void Company8_WaxmanInstallmentInvoice_Gets5AutoMatches()
        {
            var invoices = LoadInvoicesForCompany(8);
            var transactions = LoadTransactionsForCompany(8);
            var result = _engine.Execute(invoices, transactions);

            var waxmanInvoice = invoices.FirstOrDefault(i => i.Id == 90);
            Assert.NotNull(waxmanInvoice);
            Assert.True(waxmanInvoice.PaymentPlanTotalInstallments > 1);

            var waxmanMatches = result.AutoMatches.Where(m => m.InvoiceId == 90).ToList();

            Assert.Equal(5, waxmanMatches.Count);

            var waxmanTxns = transactions
                .Where(t => waxmanMatches.Any(m => m.TransactionId == t.Id))
                .ToList();

            foreach (var match in waxmanMatches)
            {
                var txn = waxmanTxns.First(t => t.Id == match.TransactionId);
                Assert.True(TxPoolClassifier.IsInstallmentTxn(txn),
                    $"Waxman match txn {txn.Id} should be installment type");
                Assert.NotNull(match.InstallmentNumber);
                Assert.True(match.InstallmentNumber >= 1 && match.InstallmentNumber <= 5);
            }

            var installmentNumbers = waxmanMatches.Select(m => m.InstallmentNumber).OrderBy(n => n).ToList();
            Assert.Equal([1, 2, 3, 4, 5], installmentNumbers);
        }

        [Fact]
        public void Company8_TravelGoInstallmentInvoice_UsesChargeAmountNotPlanAmount()
        {
            var invoices = LoadInvoicesForCompany(8);
            var transactions = LoadTransactionsForCompany(8);
            var result = _engine.Execute(invoices, transactions);

            var travelGoInvoice = invoices.FirstOrDefault(i => i.Id == 110);
            Assert.NotNull(travelGoInvoice);
            Assert.Equal("INV-TGT-2025-0825", travelGoInvoice.InvoiceNumber);
            Assert.True(travelGoInvoice.PaymentPlanTotalInstallments > 1);

            var travelGoMatches = result.AutoMatches
                .Where(m => m.InvoiceId == 110)
                .OrderBy(m => m.TransactionId)
                .ToList();

            Assert.Equal(4, travelGoMatches.Count);
            Assert.All(travelGoMatches, match =>
            {
                Assert.Equal(525m, match.MatchedAmount);
                Assert.NotEqual(2100m, match.MatchedAmount);
                Assert.NotNull(match.InstallmentNumber);
                Assert.DoesNotContain("Trinity", match.RuleName);

                var txn = transactions.First(t => t.Id == match.TransactionId);
                Assert.Equal(2100m, Math.Abs(txn.Amount));
                Assert.Equal(525m, txn.ChargeAmount.GetValueOrDefault());
                Assert.True(TxPoolClassifier.IsInstallmentTxn(txn));
            });
        }

        [Fact]
        public void Company8_NoCrossTypeMatching()
        {
            var invoices = LoadInvoicesForCompany(8);
            var transactions = LoadTransactionsForCompany(8);
            var result = _engine.Execute(invoices, transactions);

            foreach (var match in result.AutoMatches)
            {
                var invoice = invoices.First(i => i.Id == match.InvoiceId);
                var txn = transactions.First(t => t.Id == match.TransactionId);
                var isInstallmentInvoice = TxPoolClassifier.IsPaymentPlanInvoice(invoice);
                var isInstallmentTxn = TxPoolClassifier.IsInstallmentTxn(txn);

                if (isInstallmentInvoice)
                    Assert.True(isInstallmentTxn,
                        $"Cross-type violation: Invoice {invoice.Id} (installment) matched with txn {txn.Id} (non-installment)");
                if (isInstallmentTxn)
                    Assert.True(isInstallmentInvoice,
                        $"Cross-type violation: Txn {txn.Id} (installment) matched with invoice {invoice.Id} (non-installment)");
            }
        }

        [Fact]
        public void AllCompanies_NoCrossTypeMatching()
        {
            var allCompanyIds = new[] { 3L, 5, 6, 7, 8, 11 };

            foreach (var companyId in allCompanyIds)
            {
                var invoices = LoadInvoicesForCompany(companyId);
                var transactions = LoadTransactionsForCompany(companyId);
                var result = _engine.Execute(invoices, transactions);

                foreach (var match in result.AutoMatches)
                {
                    var invoice = invoices.First(i => i.Id == match.InvoiceId);
                    var txn = transactions.First(t => t.Id == match.TransactionId);
                    var isInstallmentInvoice = TxPoolClassifier.IsPaymentPlanInvoice(invoice);
                    var isInstallmentTxn = TxPoolClassifier.IsInstallmentTxn(txn);

                    if (isInstallmentInvoice)
                        Assert.True(isInstallmentTxn,
                            $"Company {companyId}: Cross-type: invoice {invoice.Id} (installment) -> txn {txn.Id} (non-installment)");
                    if (isInstallmentTxn)
                        Assert.True(isInstallmentInvoice,
                            $"Company {companyId}: Cross-type: txn {txn.Id} (installment) -> invoice {invoice.Id} (non-installment)");
                }
            }
        }

        private List<InvoiceRow> LoadInvoicesForCompany(long companyId)
        {
            var path = ResolveDataPath("current invoices in the database.json");
            var json = File.ReadAllText(path);
            var all = JsonSerializer.Deserialize<List<InvoiceRow>>(json, JsonOptions);
            var filtered = all.Where(i => i.CompanyId == companyId).ToList();

            foreach (var inv in filtered)
            {
                inv.IsMatched = false;
            }
            return filtered;
        }

        private List<TransactionRow> LoadTransactionsForCompany(long companyId)
        {
            var path = ResolveDataPath("current transactions in database.json");
            var json = File.ReadAllText(path);
            var all = JsonSerializer.Deserialize<List<TransactionRow>>(json, JsonOptions);
            var filtered = all.Where(t => t.CompanyId == companyId).ToList();

            foreach (var txn in filtered)
            {
                txn.IsMatched = false;
            }
            return filtered;
        }
    }
}
