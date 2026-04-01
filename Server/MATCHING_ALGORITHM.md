# Invoice-Transaction Matching Algorithm

## Overview

The intelligent matching system uses a **weighted scoring algorithm** to automatically match invoices with bank transactions. The algorithm considers multiple factors to determine the likelihood that a transaction corresponds to an invoice payment.

## Scoring Components

The matching score is calculated on a **0-100 scale** with the following weighted criteria:

### 1. Amount Similarity (40% weight - 40 points max)
- **Perfect match** (amounts identical): **40 points**
- **Within 1%** of invoice amount: **35 points**
- **Within 5%** of invoice amount: **25 points**
- **Within 10%** of invoice amount: **15 points**
- **Above 10%** difference: **0 points**

### 2. Date Proximity (25% weight - 25 points max)
- **Same day**: **25 points**
- **Within 7 days**: **20 points**
- **Within 30 days**: **10 points**
- **Within 60 days**: **5 points**
- **Beyond 60 days**: **0 points**

### 3. Vendor Name Matching (20% weight - 20 points max)
- **Full vendor name** appears in transaction description: **20 points**
- **Primary vendor keyword** appears (longest word > 3 chars): **10 points**
- **No match**: **0 points**

### 4. Reference Number Matching (10% weight - 10 points max)
- Invoice number appears in **transaction reference**: **10 points**
- Invoice number appears in **transaction description**: **8 points**
- **No match**: **0 points**

### 5. Card Digits Matching (5% weight - 5 points max)
- Last 4 digits appear in **transaction reference**: **5 points**
- Last 4 digits appear in **transaction description**: **3 points**
- **No match**: **0 points**

## Filtering Criteria

Before scoring, transactions are pre-filtered to include only relevant candidates:

1. **Same company** as the invoice
2. **Not already matched** to another invoice
3. **Transaction type** is debit/withdrawal/payment (outgoing only)
4. **Amount within 20%** of invoice total
5. **Date within 90 days** of invoice date

## Confidence Thresholds

Matches are categorized by confidence level:

| Score Range | Confidence Level | Action |
|------------|------------------|---------|
| **70-100** | High | ✅ Auto-match recommended |
| **50-69** | Medium | ⚠️ Suggest for review |
| **30-49** | Low | 📋 Show as option |
| **0-29** | Very Low | ❌ Don't suggest |

Only matches scoring **≥15** are returned as suggestions to avoid noise.

## Usage

### 1. Get Match Suggestions (Manual Review)

```http
GET /api/matches/suggestions/{invoiceId}
```

**Returns:** Ranked list of potential matches with scores
```json
[
  {
    "id": 123,
    "transactionDate": "2026-03-28",
    "description": "ACME Corp Payment",
    "amount": 1500.00,
    "transactionType": "debit",
    "referenceNumber": "INV-001",
    "amountDifference": 0.00,
    "matchScore": 85.0,
    "daysDifference": 2
  }
]
```

### 2. Auto-Match Single Invoice

```http
POST /api/matches/auto-match/{invoiceId}?minConfidence=70
```

**Parameters:**
- `minConfidence` (optional): Minimum score required (default: 70)

**Response:**
```json
{
  "matchId": 456,
  "message": "Auto-matched with 85.0% confidence.",
  "matchScore": 85.0,
  "confidenceLevel": "high"
}
```

### 3. Batch Auto-Match All Invoices

```http
POST /api/matches/auto-match-batch/{companyId}?minConfidence=70
```

**Response:**
```json
{
  "successfulMatches": 45,
  "skippedInvoices": 12,
  "totalProcessed": 57,
  "matchDetails": [
    {
      "invoiceId": 100,
      "invoiceNumber": "INV-001",
      "success": true,
      "matchScore": 88.5,
      "message": "Auto-matched with 88.5% confidence."
    }
  ],
  "suggestionsForReview": [
    {
      "invoiceId": 101,
      "invoiceNumber": "INV-002",
      "success": false,
      "matchScore": 62.0,
      "message": "Best match score (62.0) below threshold (70.0)."
    }
  ],
  "message": "Auto-matched 45 invoices. 5 require manual review."
}
```

## Algorithm Logic (SQL)

The core matching logic is implemented in:
- **Stored Procedure:** `FP26_sp_Matches_GetSuggestionsForInvoice.sql`
- **Service Layer:** `MatchService.cs`
- **Controller:** `MatchesController.cs`

## Example Scenarios

### ✅ Perfect Match (Score: 95)
- **Invoice:** $1,500.00 on March 25, 2026 from "ACME Corporation"
- **Transaction:** $1,500.00 on March 25, 2026 - "ACME Corporation Invoice Payment"
- **Score Breakdown:**
  - Amount: 40 (perfect)
  - Date: 25 (same day)
  - Vendor: 20 (full name match)
  - Reference: 10 (invoice # in description)
  - Card: 0
  - **Total: 95** ✅ Auto-match

### ⚠️ Good Match (Score: 65)
- **Invoice:** $2,000.00 on March 1, 2026 from "Tech Supplies Inc"
- **Transaction:** $1,950.00 on March 5, 2026 - "Tech Supplies payment"
- **Score Breakdown:**
  - Amount: 25 (within 5%)
  - Date: 20 (within 7 days)
  - Vendor: 10 (keyword match)
  - Reference: 0
  - Card: 0
  - **Total: 65** ⚠️ Suggest for review

### ❌ Weak Match (Score: 30)
- **Invoice:** $500.00 on March 1, 2026 from "Office Depot"
- **Transaction:** $525.00 on March 25, 2026 - "Office supplies"
- **Score Breakdown:**
  - Amount: 25 (within 5%)
  - Date: 5 (within 60 days)
  - Vendor: 0
  - Reference: 0
  - Card: 0
  - **Total: 30** ❌ Show as low-confidence option

## Best Practices

### For Automatic Matching
1. **Start conservative:** Use threshold of 70+ for initial auto-matching
2. **Review results:** Check the match details to validate accuracy
3. **Adjust threshold:** Lower to 60 if you're getting too many false negatives

### For Data Quality
1. **Consistent vendor names:** Use standardized vendor names in invoices
2. **Transaction descriptions:** Encourage detailed descriptions from bank
3. **Reference numbers:** Include invoice numbers in payment descriptions
4. **Timely processing:** Match transactions soon after they occur

### For Accountants
1. **Review medium-confidence matches:** These often need context
2. **Manual override:** You can always create matches manually
3. **Delete incorrect matches:** Wrong matches can be deleted and re-matched

## Future Enhancements

Potential improvements to the algorithm:
- **Machine learning:** Train on user-confirmed matches
- **Partial matching:** Support splitting one transaction across multiple invoices
- **Fuzzy string matching:** Better vendor name comparison (Levenshtein distance)
- **Historical patterns:** Learn from past matching behavior per vendor
- **Multi-currency support:** Handle exchange rate variations
- **Tax handling:** Consider VAT/tax differences separately

---

**Last Updated:** April 1, 2026  
**Version:** 1.0
