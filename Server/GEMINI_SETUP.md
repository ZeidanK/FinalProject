# Gemini LLM Invoice Extraction - Setup Guide

## Overview
Your invoice extraction system has been upgraded to use **Google Gemini 1.5 Flash** (free tier) for intelligent parsing of invoice text. The system now intelligently extracts fields from Hebrew and English invoices with better accuracy than regex patterns.

## Architecture

```
PDF Upload → iText7/OCR Text Extraction → Gemini AI Parsing → Structured Invoice Data
                                              ↓ (on failure)
                                         Regex Fallback → Structured Invoice Data
```

**Key Features:**
- ✅ Gemini as primary parser for unstructured/complex invoices
- ✅ Regex fallback ensures system always works (even if API fails)
- ✅ Supports Hebrew & English multi-language invoices
- ✅ Better line item extraction (descriptions, quantities, prices)
- ✅ Per-field confidence scores from Gemini
- ✅ Tracking of extraction source (Gemini vs regex)

---

## Setup Instructions

### 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click **"Get API Key"** or **"Create API Key"**
3. Create a new key or use an existing one
4. Copy the API key (looks like: `AIzaSyA...`)

### 2. Configure API Key (Development)

Open `Server/appsettings.Development.json` and replace the placeholder:

```json
{
  "GeminiSettings": {
    "ApiKey": "YOUR_ACTUAL_API_KEY_HERE"
  }
}
```

**⚠️ Security Note:** Never commit the API key to git. Add `appsettings.Development.json` to `.gitignore`.

### 3. Production Configuration (Optional)

For production, use environment variables instead of hardcoding the key:

**Option A: Environment Variable**
```bash
set GeminiSettings__ApiKey=YOUR_API_KEY_HERE
```

**Option B: Azure App Settings** (if deploying to Azure)
Add an application setting:
- Name: `GeminiSettings:ApiKey`
- Value: `YOUR_API_KEY_HERE`

### 4. Restore NuGet Packages

The `Google.Generative.AI` package has been added to the project. Restore packages:

```bash
cd Server
dotnet restore
```

### 5. Build & Run

```bash
dotnet build
dotnet run
```

The API will start (default: `http://localhost:5000` or similar).

---

## Testing the Integration

### Test 1: Upload a PDF Invoice

Use Swagger UI or Postman:

**Endpoint:** `POST /api/invoices/upload-pdf`

**Request:**
- **Form Data:**
  - `file`: Select a PDF invoice (Hebrew or English)
  - `companyId`: Your company ID

**Expected Response:**
```json
{
  "fileOriginalName": "invoice123.pdf",
  "fileSize": 45678,
  "filePath": "uploads/invoices/1/...",
  "fileType": "application/pdf",
  "extractedData": {
    "vendorName": "ABC Company Ltd",
    "invoiceNumber": "INV-2024-001",
    "invoiceDate": "2024-03-15T00:00:00",
    "totalAmount": 1250.00,
    "subtotal": 1050.00,
    "vatRate": 17,
    "vatAmount": 200.00,
    "currency": "ILS",
    "lineItems": [
      {
        "description": "Consulting Services",
        "quantity": 10,
        "unitPrice": 105.00,
        "totalAmount": 1050.00,
        "aiConfidenceScore": 0.95
      }
    ],
    "extractionConfidence": 0.92,
    "extractionMethod": "text",
    "extractionSource": "gemini",  // ← Shows Gemini was used
    "rawText": "..."
  }
}
```

### Test 2: Check Logs

After uploading, check the application logs for:

**✅ Gemini Success:**
```
Attempting Gemini extraction for invoice123.pdf
Gemini extraction successful for invoice123.pdf. Confidence: 0.92
```

**⚠️ Gemini Fallback:**
```
Attempting Gemini extraction for invoice456.pdf
Gemini extraction failed for invoice456.pdf. Falling back to regex: [error message]
Using regex fallback extraction for invoice456.pdf
```

### Test 3: Verify Extraction Accuracy

Compare the extracted data with the actual invoice:
- ✅ **Vendor Name** correctly extracted
- ✅ **Invoice Number** matches
- ✅ **Date** parsed correctly
- ✅ **Amounts** (total, subtotal, VAT) accurate
- ✅ **Line Items** all captured with correct quantities/prices
- ✅ **Confidence Score** reflects accuracy (0.8+ is good)

### Test 4: Test Fallback Behavior

**Simulate API Failure:**
1. Change API key to invalid value in `appsettings.Development.json`
2. Upload an invoice
3. Should see "Falling back to regex" in logs
4. Invoice still processes (using regex extraction)
5. `extractionSource` field will be `"regex"` instead of `"gemini"`

---

## API Limits (Free Tier)

**Gemini 1.5 Flash Free Tier:**
- **15 requests per minute (RPM)**
- **1,500 requests per day (RPD)**
- **1 million tokens per day (TPD)**

For most invoices (1-2 pages), this should handle:
- **~15 invoices per minute**
- **~1,500 invoices per day**

If you exceed limits, the system will automatically fall back to regex parsing.

**Monitoring:** Track usage at [Google AI Studio](https://makersuite.google.com/)

---

## Troubleshooting

### Issue: "Gemini service not initialized. API key missing."

**Solution:** 
- Verify API key is set in `appsettings.Development.json`
- Check environment variable is set correctly
- Ensure configuration binding in `Program.cs` is correct

### Issue: "Gemini returned empty response"

**Possible Causes:**
- Invoice text is empty or corrupted (check `rawText` field)
- API rate limit exceeded (wait 1 minute)
- API key quota exhausted (check Google AI Studio dashboard)

**Solution:**
- Verify PDF text extraction works (`rawText` should contain invoice text)
- Check API quota/limits
- System will fall back to regex automatically

### Issue: Low Confidence Scores

**Causes:**
- Poor quality scans (low OCR accuracy)
- Unusual invoice formats
- Missing key fields in invoice

**Solutions:**
- Use higher quality PDFs (300 DPI minimum for scans)
- Train Gemini with better prompts (edit `BuildInvoiceExtractionPrompt()`)
- Review `rawText` to see what Gemini received

### Issue: Wrong Data Extracted

**Debugging Steps:**
1. Check `rawText` field in response (is the text extraction correct?)
2. Review Gemini response in debug logs (`LogDebug("Gemini response: {Response}")`)
3. Adjust prompt in `GeminiExtractionService.cs` → `BuildInvoiceExtractionPrompt()`

**Prompt Engineering:** The prompt is designed for Hebrew/English invoices. If you process other languages, update the prompt to include language-specific field names.

---

## Files Modified

| File | Changes |
|------|---------|
| `FinalProjectAuthAPI.csproj` | Added `Google.Generative.AI` package |
| `appsettings.json` | Added `GeminiSettings` section |
| `appsettings.Development.json` | Created with API key placeholder |
| `BL/Interfaces/IGeminiExtractionService.cs` | New interface for Gemini service |
| `BL/GeminiExtractionService.cs` | **New service** - Gemini AI integration |
| `BL/PdfExtractionService.cs` | Modified to use Gemini with regex fallback |
| `Models/InvoiceModels.cs` | Added `ExtractionSource` field |
| `Program.cs` | Registered Gemini service & configuration |

---

## Next Steps

### 1. Performance Monitoring

Track extraction accuracy over time:
- Monitor `extractionSource` field (how often Gemini vs regex?)
- Review `extractionConfidence` scores (average should be 0.8+)
- Check logs for failure patterns

### 2. Prompt Optimization

If extraction accuracy is poor for certain invoice types:
1. Collect sample invoices that fail
2. Edit `BuildInvoiceExtractionPrompt()` in `GeminiExtractionService.cs`
3. Add specific instructions for your invoice formats
4. Test iteratively

### 3. Add Rate Limiting (Optional)

If you process high volumes:
```csharp
// In GeminiExtractionService.cs, add:
private static readonly SemaphoreSlim _rateLimiter = new(15, 15); // 15 concurrent

public async Task<PdfExtractionResult> ParseInvoiceTextAsync(string rawText)
{
    await _rateLimiter.WaitAsync();
    try
    {
        // ... existing code ...
    }
    finally
    {
        _rateLimiter.Release();
    }
}
```

### 4. Upgrade to Paid Tier (If Needed)

If free tier limits are too restrictive:
- [Google AI Pricing](https://ai.google.dev/pricing)
- Paid tier: **Higher RPM/RPD limits** + **Gemini 1.5 Pro** (more accurate)

---

## Support

**Gemini AI Documentation:** https://ai.google.dev/docs  
**API Key Management:** https://makersuite.google.com/app/apikey  
**Pricing & Limits:** https://ai.google.dev/pricing

**Questions?** Check the logs for detailed error messages - they will guide you to the issue.

---

## Summary

✅ **Setup Complete!** Your invoice extraction now uses Gemini AI for intelligent parsing.

**Key Benefits:**
- 📈 Better accuracy on complex/unusual invoice layouts
- 🌍 Multi-language support (Hebrew/English)
- 🛡️ Robust fallback (always works even if API fails)
- 📊 Confidence tracking for quality monitoring
- 🔍 Better line item extraction

**Next:** Get your API key, configure it, and test with real invoices!
