-- ============================================================
-- Reconciles invoice ledger entries with imported bank transactions.
-- Returns one summary result set followed by detailed rows.
-- Date boundaries are inclusive. A matched pair is included when either
-- side falls inside the selected range so its counterpart remains visible.
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Reports_GetReconciliationReport', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Reports_GetReconciliationReport;
GO

CREATE PROCEDURE dbo.FP26_sp_Reports_GetReconciliationReport
    @CompanyId BIGINT,
    @StartDate DATE = NULL,
    @EndDate DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CompanyCurrency VARCHAR(3) = (
        SELECT TOP 1 currency
        FROM dbo.FP26_companies
        WHERE id = @CompanyId
    );

    SET @CompanyCurrency = ISNULL(@CompanyCurrency, 'USD');

    CREATE TABLE #ReconciliationRows
    (
        reconciliation_status VARCHAR(30) NOT NULL,
        invoice_id BIGINT NULL,
        invoice_number VARCHAR(100) NULL,
        vendor_name VARCHAR(255) NULL,
        invoice_date DATE NULL,
        due_date DATE NULL,
        invoice_amount DECIMAL(15,2) NULL,
        invoice_currency VARCHAR(3) NULL,
        invoice_status VARCHAR(50) NULL,
        invoice_matched_amount DECIMAL(15,2) NULL,
        outstanding_amount DECIMAL(15,2) NULL,
        match_id BIGINT NULL,
        matched_amount DECIMAL(15,2) NULL,
        match_method VARCHAR(50) NULL,
        match_confidence DECIMAL(5,4) NULL,
        transaction_id BIGINT NULL,
        transaction_date DATE NULL,
        transaction_description VARCHAR(MAX) NULL,
        transaction_amount DECIMAL(15,2) NULL,
        transaction_currency VARCHAR(3) NULL,
        original_transaction_amount DECIMAL(15,2) NULL,
        original_transaction_currency VARCHAR(10) NULL,
        transaction_type VARCHAR(50) NULL
    );

    -- Matched pairs. One invoice may intentionally appear more than once
    -- when installments or partial payments use multiple transactions.
    INSERT INTO #ReconciliationRows
    SELECT
        CASE
            WHEN ISNULL(valid_matches.matched_amount, 0) >= i.total_amount THEN 'fully_matched'
            ELSE 'partially_matched'
        END,
        i.id,
        i.invoice_number,
        i.vendor_name,
        i.invoice_date,
        i.due_date,
        i.total_amount,
        i.currency,
        i.status,
        ISNULL(valid_matches.matched_amount, 0),
        CASE
            WHEN i.total_amount - ISNULL(valid_matches.matched_amount, 0) > 0
                THEN i.total_amount - ISNULL(valid_matches.matched_amount, 0)
            ELSE 0
        END,
        m.id,
        m.matched_amount,
        m.match_method,
        m.match_confidence,
        t.id,
        t.transaction_date,
        t.description,
        t.amount,
        @CompanyCurrency,
        t.charge_amount,
        COALESCE(t.charge_currency, t.original_currency),
        t.transaction_type
    FROM dbo.FP26_invoice_transaction_matches m
    INNER JOIN dbo.FP26_invoices i ON i.id = m.invoice_id
    INNER JOIN dbo.FP26_transactions t ON t.id = m.transaction_id
    OUTER APPLY
    (
        SELECT SUM(m2.matched_amount) AS matched_amount
        FROM dbo.FP26_invoice_transaction_matches m2
        INNER JOIN dbo.FP26_transactions t2 ON t2.id = m2.transaction_id
        WHERE m2.invoice_id = i.id
          AND t2.company_id = @CompanyId
          AND ISNULL(t2.is_duplicate, 0) = 0
    ) valid_matches
    WHERE i.company_id = @CompanyId
      AND t.company_id = @CompanyId
      AND i.status <> 'deleted'
      AND ISNULL(i.is_duplicate, 0) = 0
      AND ISNULL(t.is_duplicate, 0) = 0
      AND (
            ((@StartDate IS NULL OR i.invoice_date >= @StartDate)
              AND (@EndDate IS NULL OR i.invoice_date <= @EndDate))
         OR ((@StartDate IS NULL OR t.transaction_date >= @StartDate)
              AND (@EndDate IS NULL OR t.transaction_date <= @EndDate))
      );

    -- Ledger entries with no valid bank match.
    INSERT INTO #ReconciliationRows
    SELECT
        'ledger_only',
        i.id,
        i.invoice_number,
        i.vendor_name,
        i.invoice_date,
        i.due_date,
        i.total_amount,
        i.currency,
        i.status,
        0,
        i.total_amount,
        NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
    FROM dbo.FP26_invoices i
    WHERE i.company_id = @CompanyId
      AND i.status <> 'deleted'
      AND ISNULL(i.is_duplicate, 0) = 0
      AND (@StartDate IS NULL OR i.invoice_date >= @StartDate)
      AND (@EndDate IS NULL OR i.invoice_date <= @EndDate)
      AND NOT EXISTS
      (
          SELECT 1
          FROM dbo.FP26_invoice_transaction_matches m
          INNER JOIN dbo.FP26_transactions t ON t.id = m.transaction_id
          WHERE m.invoice_id = i.id
            AND t.company_id = @CompanyId
            AND ISNULL(t.is_duplicate, 0) = 0
      );

    -- Bank transactions with no valid ledger match.
    INSERT INTO #ReconciliationRows
    SELECT
        'bank_only',
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, NULL,
        t.id,
        t.transaction_date,
        t.description,
        t.amount,
        @CompanyCurrency,
        t.charge_amount,
        COALESCE(t.charge_currency, t.original_currency),
        t.transaction_type
    FROM dbo.FP26_transactions t
    WHERE t.company_id = @CompanyId
      AND ISNULL(t.is_duplicate, 0) = 0
      AND (@StartDate IS NULL OR t.transaction_date >= @StartDate)
      AND (@EndDate IS NULL OR t.transaction_date <= @EndDate)
      AND NOT EXISTS
      (
          SELECT 1
          FROM dbo.FP26_invoice_transaction_matches m
          INNER JOIN dbo.FP26_invoices i ON i.id = m.invoice_id
          WHERE m.transaction_id = t.id
            AND i.company_id = @CompanyId
            AND i.status <> 'deleted'
            AND ISNULL(i.is_duplicate, 0) = 0
      );

    SELECT
        @StartDate AS start_date,
        @EndDate AS end_date,
        @CompanyCurrency AS company_currency,
        (SELECT COUNT(DISTINCT invoice_id) FROM #ReconciliationRows WHERE invoice_id IS NOT NULL) AS ledger_entry_count,
        (SELECT COUNT(DISTINCT transaction_id) FROM #ReconciliationRows WHERE transaction_id IS NOT NULL) AS bank_transaction_count,
        (SELECT COUNT(DISTINCT invoice_id) FROM #ReconciliationRows WHERE reconciliation_status = 'fully_matched') AS fully_matched_ledger_count,
        (SELECT COUNT(DISTINCT invoice_id) FROM #ReconciliationRows WHERE reconciliation_status = 'partially_matched') AS partially_matched_ledger_count,
        (SELECT COUNT(DISTINCT invoice_id) FROM #ReconciliationRows WHERE reconciliation_status = 'ledger_only') AS unmatched_ledger_count,
        (SELECT COUNT(DISTINCT transaction_id) FROM #ReconciliationRows WHERE reconciliation_status IN ('fully_matched', 'partially_matched')) AS matched_bank_transaction_count,
        (SELECT COUNT(DISTINCT transaction_id) FROM #ReconciliationRows WHERE reconciliation_status = 'bank_only') AS unmatched_bank_transaction_count;

    SELECT *
    FROM #ReconciliationRows
    ORDER BY COALESCE(transaction_date, invoice_date) DESC,
             COALESCE(invoice_id, transaction_id) DESC;
END
GO
