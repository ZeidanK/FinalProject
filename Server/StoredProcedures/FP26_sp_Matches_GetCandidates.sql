IF OBJECT_ID('dbo.FP26_sp_Matches_GetCandidates', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Matches_GetCandidates;
GO

CREATE PROCEDURE dbo.FP26_sp_Matches_GetCandidates
    @CompanyId BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT id, transaction_date, posted_date, description, amount, charge_amount,
           transaction_type, reference_number, vendor_name
    FROM dbo.FP26_transactions
    WHERE company_id = @CompanyId AND is_matched = 0;
END
GO
