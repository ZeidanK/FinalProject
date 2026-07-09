using FinalProjectAuthAPI.BL;
using FinalProjectAuthAPI.BL.Interfaces;
using FinalProjectAuthAPI.BL.UploadProcessing;
using FinalProjectAuthAPI.DAL;
using Moq;
using Xunit;

namespace FinalProjectAuthAPI.Tests.BL
{
    public class UploadJobWorkerTests
    {
        private static UploadJobNotificationService MakeNotifSvc() =>
            new(Mock.Of<IRealtimeNotificationService>(), Mock.Of<IActivityLogService>());

        private static InvoiceJobProcessor MakeInvoiceProcessor() =>
            new(Mock.Of<IUploadJobService>(), Mock.Of<IFileStorageService>(),
                Mock.Of<IPdfExtractionService>(), Mock.Of<IInvoiceService>(),
                Mock.Of<IAnomalyService>(), MakeNotifSvc(),
                Mock.Of<IWebHostEnvironment>());

        private static TransactionJobProcessor MakeTransactionProcessor() =>
            new(Mock.Of<IUploadJobService>(), Mock.Of<IFileStorageService>(),
                Mock.Of<IExcelExtractionService>(), Mock.Of<ITransactionService>(),
                Mock.Of<IAnomalyService>(), Mock.Of<IRealtimeNotificationService>(),
                MakeNotifSvc(), Mock.Of<DBservices>());

        [Fact]
        public async Task ProcessInvoiceJobAsync_Delegates()
        {
            var mockProcessor = new Mock<InvoiceJobProcessor>(
                Mock.Of<IUploadJobService>(),
                Mock.Of<IFileStorageService>(),
                Mock.Of<IPdfExtractionService>(),
                Mock.Of<IInvoiceService>(),
                Mock.Of<IAnomalyService>(),
                MakeNotifSvc(),
                Mock.Of<IWebHostEnvironment>());

            var worker = new UploadJobWorker(mockProcessor.Object, MakeTransactionProcessor());

            await worker.ProcessInvoiceJobAsync(42);

            mockProcessor.Verify(x => x.ProcessAsync(42), Times.Once);
        }

        [Fact]
        public async Task ProcessTransactionJobAsync_Delegates()
        {
            var mockProcessor = new Mock<TransactionJobProcessor>(
                Mock.Of<IUploadJobService>(),
                Mock.Of<IFileStorageService>(),
                Mock.Of<IExcelExtractionService>(),
                Mock.Of<ITransactionService>(),
                Mock.Of<IAnomalyService>(),
                Mock.Of<IRealtimeNotificationService>(),
                MakeNotifSvc(),
                Mock.Of<DBservices>());

            var worker = new UploadJobWorker(MakeInvoiceProcessor(), mockProcessor.Object);

            await worker.ProcessTransactionJobAsync(99);

            mockProcessor.Verify(x => x.ProcessAsync(99), Times.Once);
        }
    }
}
