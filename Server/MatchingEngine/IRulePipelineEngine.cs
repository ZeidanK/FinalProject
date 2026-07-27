using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.MatchingEngine
{
    public interface IRulePipelineEngine
    {
        PipelineResult Execute(List<InvoiceRow> invoices, List<TransactionRow> transactions);
    }
}
