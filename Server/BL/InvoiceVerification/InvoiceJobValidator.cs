using FinalProjectAuthAPI.Models;

namespace FinalProjectAuthAPI.BL.InvoiceVerification
{
    public class InvoiceJobValidator
    {
        public string? ValidateExtractedInvoice(PdfExtractionResult extracted)
        {
            if (string.IsNullOrWhiteSpace(extracted.InvoiceNumber))
                return "Invoice number is missing; open the invoice to review it.";
            if (string.IsNullOrWhiteSpace(extracted.VendorName))
                return "Vendor name is missing; open the invoice to review it.";
            if (!extracted.InvoiceDate.HasValue)
                return "Invoice date is missing; open the invoice to review it.";
            if (!extracted.TotalAmount.HasValue)
                return "Invoice total is missing; open the invoice to review it.";
            return null;
        }

        public string? ValidateReviewedInvoice(CreateInvoiceRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.InvoiceNumber))
                return "Invoice number is required.";
            if (string.IsNullOrWhiteSpace(request.VendorName))
                return "Vendor name is required.";
            if (request.InvoiceDate == default)
                return "Invoice date is required.";
            return null;
        }

        public CreateInvoiceRequest BuildInvoiceRequest(long companyId, PdfExtractionResult extracted)
        {
            return new CreateInvoiceRequest
            {
                CompanyId = companyId,
                InvoiceNumber = extracted.InvoiceNumber!.Trim(),
                VendorName = extracted.VendorName!.Trim(),
                InvoiceDate = extracted.InvoiceDate!.Value,
                DueDate = extracted.DueDate,
                TotalAmount = extracted.TotalAmount!.Value,
                Subtotal = extracted.Subtotal ?? extracted.TotalAmount.Value,
                VatRate = extracted.VatRate,
                VatAmount = extracted.VatAmount,
                Currency = string.IsNullOrWhiteSpace(extracted.Currency) ? "USD" : extracted.Currency,
                VendorTaxId = extracted.VendorTaxId,
                LastFourDigitsCard = extracted.LastFourDigitsCard,
                ItemCount = extracted.ItemCount,
                PaymentPlanTotalInstallments = extracted.PaymentPlan?.TotalInstallments,
                PaymentPlanInstallmentAmount = extracted.PaymentPlan?.InstallmentAmount,
                PaymentPlanFrequency = extracted.PaymentPlan?.Frequency,
                PaymentPlanDescription = extracted.PaymentPlan?.Description,
                PaymentPlanCurrentInstallment = extracted.PaymentPlan?.CurrentInstallment,
                LineItems = extracted.LineItems.Select((li, index) => new CreateLineItemRequest
                {
                    Description = string.IsNullOrWhiteSpace(li.Description) ? "Item" : li.Description,
                    Quantity = li.Quantity,
                    UnitPrice = li.UnitPrice,
                    TotalAmount = li.TotalAmount,
                    VatRate = li.VatRate,
                    Category = li.Category,
                    LineNumber = index + 1,
                    AiConfidenceScore = li.AiConfidenceScore
                }).ToList()
            };
        }
    }
}
