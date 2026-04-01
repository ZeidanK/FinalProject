-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Advanced invoice-transaction matching with weighted scoring:
-- - Amount similarity (40% weight)
-- - Date proximity (25% weight)
-- - Vendor name matching (20% weight)
-- - Reference number matching (10% weight)
-- - Card digits matching (5% weight)
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Matches_GetSuggestionsForInvoice', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Matches_GetSuggestionsForInvoice;
GO

CREATE PROCEDURE dbo.FP26_sp_Matches_GetSuggestionsForInvoice
    @InvoiceId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @InvoiceAmount DECIMAL(15,2);
    DECLARE @InvoiceDate DATE;
    DECLARE @VendorName VARCHAR(255);
    DECLARE @InvoiceNumber VARCHAR(100);
    DECLARE @LastFourDigits VARCHAR(4);
    DECLARE @CompanyId BIGINT;

    -- Get invoice details
    SELECT 
        @InvoiceAmount = total_amount,
        @InvoiceDate = invoice_date,
        @VendorName = vendor_name,
        @InvoiceNumber = invoice_number,
        @LastFourDigits = last_four_digits_card,
        @CompanyId = company_id
    FROM dbo.FP26_invoices
    WHERE id = @InvoiceId;

    IF @CompanyId IS NULL
        RETURN;

    -- Find potential matches with scoring
    WITH MatchCandidates AS (
        SELECT
            t.id,
            t.transaction_date,
            t.description,
            t.amount,
            t.transaction_type,
            t.reference_number,
            ABS(t.amount - @InvoiceAmount) AS amount_difference,
            
            -- Calculate match score (0-100)
            (
                -- Amount Score (40 points): Perfect match = 40, within 1% = 35, within 5% = 25, within 10% = 15
                CASE 
                    WHEN t.amount = @InvoiceAmount THEN 40
                    WHEN ABS(t.amount - @InvoiceAmount) / NULLIF(@InvoiceAmount, 0) <= 0.01 THEN 35
                    WHEN ABS(t.amount - @InvoiceAmount) / NULLIF(@InvoiceAmount, 0) <= 0.05 THEN 25
                    WHEN ABS(t.amount - @InvoiceAmount) / NULLIF(@InvoiceAmount, 0) <= 0.10 THEN 15
                    ELSE 0
                END
                +
                -- Date Score (25 points): Same day = 25, within 7 days = 20, within 30 days = 10, within 60 days = 5
                CASE 
                    WHEN t.transaction_date = @InvoiceDate THEN 25
                    WHEN ABS(DATEDIFF(DAY, t.transaction_date, @InvoiceDate)) <= 7 THEN 20
                    WHEN ABS(DATEDIFF(DAY, t.transaction_date, @InvoiceDate)) <= 30 THEN 10
                    WHEN ABS(DATEDIFF(DAY, t.transaction_date, @InvoiceDate)) <= 60 THEN 5
                    ELSE 0
                END
                +
                -- Vendor Name Score (20 points): Check if vendor appears in transaction description
                CASE 
                    WHEN @VendorName IS NOT NULL AND t.description LIKE '%' + @VendorName + '%' THEN 20
                    WHEN @VendorName IS NOT NULL AND t.description LIKE '%' + 
                        (SELECT TOP 1 value FROM STRING_SPLIT(@VendorName, ' ') WHERE LEN(value) > 3) + '%' THEN 10
                    ELSE 0
                END
                +
                -- Reference Number Score (10 points): Invoice number appears in transaction reference
                CASE 
                    WHEN @InvoiceNumber IS NOT NULL AND t.reference_number IS NOT NULL 
                         AND t.reference_number LIKE '%' + @InvoiceNumber + '%' THEN 10
                    WHEN @InvoiceNumber IS NOT NULL AND t.description LIKE '%' + @InvoiceNumber + '%' THEN 8
                    ELSE 0
                END
                +
                -- Card Digits Score (5 points): Last 4 digits match
                CASE 
                    WHEN @LastFourDigits IS NOT NULL AND t.reference_number IS NOT NULL 
                         AND t.reference_number LIKE '%' + @LastFourDigits + '%' THEN 5
                    WHEN @LastFourDigits IS NOT NULL AND t.description LIKE '%' + @LastFourDigits + '%' THEN 3
                    ELSE 0
                END
            ) AS match_score,
            
            ABS(DATEDIFF(DAY, t.transaction_date, @InvoiceDate)) AS days_difference
            
        FROM dbo.FP26_transactions t
        WHERE t.company_id = @CompanyId
          AND t.is_matched = 0
          AND t.transaction_type IN ('debit', 'withdrawal', 'payment')  -- Only outgoing transactions
          AND ABS(t.amount - @InvoiceAmount) / NULLIF(@InvoiceAmount, 0) <= 0.20  -- Within 20% of invoice amount
          AND ABS(DATEDIFF(DAY, t.transaction_date, @InvoiceDate)) <= 90  -- Within 90 days
    )
    SELECT 
        id,
        transaction_date,
        description,
        amount,
        transaction_type,
        reference_number,
        amount_difference,
        match_score,
        days_difference
    FROM MatchCandidates
    WHERE match_score >= 15  -- Only suggest matches with reasonable confidence (15+ out of 100)
    ORDER BY match_score DESC, amount_difference ASC, days_difference ASC;
END
GO
