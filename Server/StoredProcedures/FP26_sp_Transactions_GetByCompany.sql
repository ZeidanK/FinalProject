-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Updated with pagination, sorting, and additional filters
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Transactions_GetByCompany', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Transactions_GetByCompany;
GO

CREATE PROCEDURE dbo.FP26_sp_Transactions_GetByCompany
    @CompanyId       BIGINT,
    @Type            VARCHAR(50)  = NULL,
    @IsMatched       BIT          = NULL,
    @StartDate       DATE         = NULL,
    @EndDate         DATE         = NULL,
    @PageNumber      INT          = 1,
    @PageSize        INT          = 10000,
    @SortBy          VARCHAR(50)  = 'transaction_date',
    @SortDirection   VARCHAR(4)   = 'DESC',
    @SearchTerm      NVARCHAR(255) = NULL,
    @RequiresInvoice BIT         = NULL,
    @Category        VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    -- Total count result set
    SELECT COUNT(*)
    FROM dbo.FP26_transactions t
    LEFT JOIN dbo.FP26_users u ON u.id = t.created_by_user_id
    WHERE t.company_id = @CompanyId
      AND (@Type           IS NULL OR t.transaction_type  = @Type)
      AND (@IsMatched      IS NULL OR t.is_matched        = @IsMatched)
      AND (@StartDate      IS NULL OR t.transaction_date >= @StartDate)
      AND (@EndDate        IS NULL OR t.transaction_date <= @EndDate)
      AND (@RequiresInvoice IS NULL OR t.requires_invoice = @RequiresInvoice)
      AND (@Category       IS NULL OR t.category          = @Category)
      AND (@SearchTerm     IS NULL OR t.vendor_name     LIKE '%' + @SearchTerm + '%'
                                   OR t.description     LIKE '%' + @SearchTerm + '%'
                                   OR CAST(t.amount AS NVARCHAR) LIKE '%' + @SearchTerm + '%');

    -- Data result set
    SELECT
        t.id,
        t.company_id,
        t.transaction_date,
        t.posted_date,
        t.description,
        t.vendor_name,
        t.card_last4,
        t.amount,
        t.transaction_type,
        t.category,
        t.reference_number,
        t.charge_amount,
        t.charge_currency,
        t.original_currency,
        t.exchange_rate,
        t.requires_invoice,
        t.is_matched,
        t.is_anomaly,
        t.is_duplicate,
        t.status,
        t.created_by_user_id,
        u.name AS created_by_name,
        t.created_at,
        t.updated_at
    FROM dbo.FP26_transactions t
    LEFT JOIN dbo.FP26_users u ON u.id = t.created_by_user_id
    WHERE t.company_id = @CompanyId
      AND (@Type           IS NULL OR t.transaction_type  = @Type)
      AND (@IsMatched      IS NULL OR t.is_matched        = @IsMatched)
      AND (@StartDate      IS NULL OR t.transaction_date >= @StartDate)
      AND (@EndDate        IS NULL OR t.transaction_date <= @EndDate)
      AND (@RequiresInvoice IS NULL OR t.requires_invoice = @RequiresInvoice)
      AND (@Category       IS NULL OR t.category          = @Category)
      AND (@SearchTerm     IS NULL OR t.vendor_name     LIKE '%' + @SearchTerm + '%'
                                   OR t.description     LIKE '%' + @SearchTerm + '%'
                                   OR CAST(t.amount AS NVARCHAR) LIKE '%' + @SearchTerm + '%')
    ORDER BY
        CASE WHEN @SortBy = 'transaction_date' AND @SortDirection = 'ASC'  THEN t.transaction_date END ASC,
        CASE WHEN @SortBy = 'transaction_date' AND @SortDirection = 'DESC' THEN t.transaction_date END DESC,
        CASE WHEN @SortBy = 'amount'           AND @SortDirection = 'ASC'  THEN t.amount END ASC,
        CASE WHEN @SortBy = 'amount'           AND @SortDirection = 'DESC' THEN t.amount END DESC,
        CASE WHEN @SortBy = 'vendor_name'      AND @SortDirection = 'ASC'  THEN t.vendor_name END ASC,
        CASE WHEN @SortBy = 'vendor_name'      AND @SortDirection = 'DESC' THEN t.vendor_name END DESC,
        CASE WHEN @SortBy = 'transaction_type' AND @SortDirection = 'ASC'  THEN t.transaction_type END ASC,
        CASE WHEN @SortBy = 'transaction_type' AND @SortDirection = 'DESC' THEN t.transaction_type END DESC,
        CASE WHEN @SortBy = 'category'         AND @SortDirection = 'ASC'  THEN t.category END ASC,
        CASE WHEN @SortBy = 'category'         AND @SortDirection = 'DESC' THEN t.category END DESC,
        CASE WHEN @SortBy = 'is_matched'       AND @SortDirection = 'ASC'  THEN CAST(t.is_matched AS INT) END ASC,
        CASE WHEN @SortBy = 'is_matched'       AND @SortDirection = 'DESC' THEN CAST(t.is_matched AS INT) END DESC,
        t.transaction_date DESC
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO
