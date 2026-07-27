namespace FinalProjectAuthAPI.Models
{
    public class TransactionClassificationSettings
    {
        public List<string> NoInvoiceTransactionTypes { get; set; } = new();
        public List<string> NoInvoiceVendorPatterns  { get; set; } = new();
    }
}
