# Matching API Quick Reference

## Endpoints

### 1. Get Match Suggestions for Invoice
```http
GET /api/matches/suggestions/{invoiceId}
Authorization: Bearer {token}
```

**Purpose:** Get ranked list of potential transaction matches for an invoice

**Response:**
```json
[
  {
    "id": 123,
    "transactionDate": "2026-03-28T00:00:00",
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

**Match Score Categories:**
- `70-100`: 🟢 High confidence (auto-match safe)
- `50-69`: 🟡 Medium confidence (review recommended)
- `30-49`: 🟠 Low confidence (show as option)
- `0-29`: 🔴 Very low (filtered out)

---

### 2. Create Manual Match
```http
POST /api/matches
Authorization: Bearer {token}
Content-Type: application/json

{
  "invoiceId": 100,
  "transactionId": 123,
  "matchedAmount": 1500.00,
  "matchMethod": "manual",
  "matchType": "full",
  "matchConfidence": 0.95,
  "matchReason": "Verified by accountant"
}
```

**Match Types:**
- `"full"`: Complete match (amounts match exactly)
- `"partial"`: Partial payment (amount mismatch)

**Match Methods:**
- `"manual"`: User created manually
- `"automatic"`: System auto-matched
- `"assisted"`: User accepted system suggestion

**Response:**
```json
{
  "id": 456,
  "message": "Match created."
}
```

---

### 3. Auto-Match Single Invoice
```http
POST /api/matches/auto-match/{invoiceId}?minConfidence=70
Authorization: Bearer {token}
```

**Purpose:** Automatically match invoice with best transaction candidate

**Query Parameters:**
- `minConfidence` (optional, default: 70): Minimum match score required (0-100)

**Success Response (200):**
```json
{
  "matchId": 456,
  "message": "Auto-matched with 85.0% confidence.",
  "matchScore": 85.0,
  "confidenceLevel": "high"
}
```

**No Match Response (400):**
```json
{
  "message": "Best match score (62.0) below threshold (70.0).",
  "matchScore": 62.0
}
```

**Use Cases:**
- Quick single-invoice matching
- Testing before batch processing
- High-value invoices requiring individual attention

---

### 4. Batch Auto-Match (Company-Wide)
```http
POST /api/matches/auto-match-batch/{companyId}?minConfidence=70
Authorization: Bearer {token}
```

**Purpose:** Auto-match ALL unmatched invoices for a company in one operation

**Query Parameters:**
- `minConfidence` (optional, default: 70): Minimum score for auto-matching

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
    },
    {
      "invoiceId": 102,
      "invoiceNumber": "INV-003",
      "success": true,
      "matchScore": 75.2,
      "message": "Auto-matched with 75.2% confidence."
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

**Use Cases:**
- End-of-month reconciliation
- Initial system setup with bulk data
- Periodic auto-matching runs

---

### 5. Get Matches by Company
```http
GET /api/matches/company/{companyId}
Authorization: Bearer {token}
```

**Purpose:** Get all existing matches for a company

**Response:**
```json
[
  {
    "id": 456,
    "invoiceId": 100,
    "invoiceNumber": "INV-001",
    "vendorName": "ACME Corp",
    "invoiceAmount": 1500.00,
    "transactionId": 123,
    "transactionDescription": "ACME Corp Payment",
    "transactionDate": "2026-03-28T00:00:00",
    "transactionAmount": 1500.00,
    "transactionType": "debit",
    "matchType": "full",
    "matchedAmount": 1500.00,
    "matchMethod": "automatic",
    "matchConfidence": 0.85,
    "matchReason": "Exact amount match, Same date, Score: 85.0/100",
    "matchedByUserId": 5,
    "matchedByName": "John Accountant",
    "createdAt": "2026-03-28T14:30:00",
    "updatedAt": "2026-03-28T14:30:00"
  }
]
```

---

### 6. Get Single Match
```http
GET /api/matches/{matchId}
Authorization: Bearer {token}
```

**Purpose:** Get details of a specific match

**Response:** Same structure as individual match object above

---

### 7. Delete Match
```http
DELETE /api/matches/{matchId}
Authorization: Bearer {token}
```

**Purpose:** Remove an incorrect match (allows re-matching)

**Response:**
```json
{
  "message": "Match deleted."
}
```

---

## Frontend Integration Examples

### React/JavaScript Example

```javascript
// 1. Get suggestions for an invoice
const getSuggestions = async (invoiceId) => {
  const response = await fetch(`/api/matches/suggestions/${invoiceId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const suggestions = await response.json();
  
  // Categorize by confidence
  const highConfidence = suggestions.filter(s => s.matchScore >= 70);
  const mediumConfidence = suggestions.filter(s => s.matchScore >= 50 && s.matchScore < 70);
  
  return { highConfidence, mediumConfidence, all: suggestions };
};

// 2. Auto-match with custom threshold
const autoMatchInvoice = async (invoiceId, minConfidence = 70) => {
  const response = await fetch(
    `/api/matches/auto-match/${invoiceId}?minConfidence=${minConfidence}`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  if (response.ok) {
    const result = await response.json();
    console.log(`✅ Matched! Score: ${result.matchScore}`);
    return result;
  } else {
    const error = await response.json();
    console.log(`❌ No match: ${error.message}`);
    return null;
  }
};

// 3. Batch auto-match entire company
const batchAutoMatch = async (companyId) => {
  const response = await fetch(
    `/api/matches/auto-match-batch/${companyId}?minConfidence=70`,
    {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const result = await response.json();
  console.log(`Matched: ${result.successfulMatches}/${result.totalProcessed}`);
  console.log(`Review needed: ${result.suggestionsForReview.length}`);
  
  return result;
};

// 4. Manual match creation
const createManualMatch = async (invoiceId, transactionId, amount) => {
  const response = await fetch('/api/matches', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      invoiceId,
      transactionId,
      matchedAmount: amount,
      matchMethod: 'manual',
      matchType: 'full',
      matchReason: 'Manually verified by user'
    })
  });
  
  return await response.json();
};
```

### UI Component Suggestions

```jsx
// Match Confidence Badge Component
const ConfidenceBadge = ({ score }) => {
  if (score >= 70) return <Badge color="green">High ({score}%)</Badge>;
  if (score >= 50) return <Badge color="yellow">Medium ({score}%)</Badge>;
  if (score >= 30) return <Badge color="orange">Low ({score}%)</Badge>;
  return <Badge color="red">Very Low ({score}%)</Badge>;
};

// Suggestion List Item
const SuggestionItem = ({ suggestion, onMatch }) => (
  <div className="suggestion-item">
    <div>
      <strong>{suggestion.description}</strong>
      <p>${suggestion.amount.toFixed(2)} on {formatDate(suggestion.transactionDate)}</p>
      <p>Difference: ${Math.abs(suggestion.amountDifference).toFixed(2)}</p>
    </div>
    <div>
      <ConfidenceBadge score={suggestion.matchScore} />
      <button onClick={() => onMatch(suggestion.id)}>
        Match
      </button>
    </div>
  </div>
);
```

---

## Recommended Workflow

### For Accountants

1. **Initial Bulk Matching:**
   ```
   POST /api/matches/auto-match-batch/{companyId}?minConfidence=70
   ```
   - Matches high-confidence invoices automatically
   - Returns list of invoices needing review

2. **Review Medium-Confidence Matches:**
   ```
   GET /api/matches/suggestions/{invoiceId}
   ```
   - For each invoice in "suggestionsForReview"
   - Show user the top suggestions
   - Let them manually confirm or skip

3. **Manual Matching:**
   ```
   POST /api/matches
   ```
   - For invoices with no good matches
   - Or complex scenarios requiring judgment

4. **Verification:**
   ```
   GET /api/matches/company/{companyId}
   ```
   - Review all created matches
   - Delete and re-match if needed

### For Business Owners

1. **Quick Auto-Match:**
   ```
   POST /api/matches/auto-match-batch/{companyId}?minConfidence=80
   ```
   - Use higher threshold (80) for safety
   - Review suggestions manually

---

## Error Handling

```javascript
const handleMatchError = (error) => {
  if (error.status === 400) {
    // No suitable match found
    return "No matching transaction found. Try manual matching.";
  }
  if (error.status === 401) {
    // Unauthorized
    return "Please log in again.";
  }
  if (error.status === 404) {
    // Invoice not found
    return "Invoice not found.";
  }
  return "An unexpected error occurred.";
};
```

---

**See Also:**
- [MATCHING_ALGORITHM.md](./MATCHING_ALGORITHM.md) - Detailed algorithm explanation
- [Controllers/MatchesController.cs](./Controllers/MatchesController.cs) - API implementation
- [BL/MatchService.cs](./BL/MatchService.cs) - Business logic
