IF OBJECT_ID('dbo.FP26_sp_Transactions_GetFilterOptions', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Transactions_GetFilterOptions;
GO

CREATE PROCEDURE dbo.FP26_sp_Transactions_GetFilterOptions
    @CompanyId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT DISTINCT transaction_type AS Value
    FROM dbo.FP26_transactions
    WHERE company_id = @CompanyId AND transaction_type IS NOT NULL
    ORDER BY Value;

    SELECT DISTINCT category AS Value
    FROM dbo.FP26_transactions
    WHERE company_id = @CompanyId AND category IS NOT NULL
    ORDER BY Value;
END
GO
