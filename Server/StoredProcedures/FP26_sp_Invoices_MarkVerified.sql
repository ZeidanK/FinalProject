USE [igroup104_test2]
GO

IF OBJECT_ID('dbo.FP26_sp_Invoices_MarkVerified', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Invoices_MarkVerified;
GO

CREATE PROCEDURE dbo.FP26_sp_Invoices_MarkVerified
    @Id BIGINT,
    @VerifiedByUserId BIGINT
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.FP26_invoices
    SET is_verified = 1,
        verified_by_user_id = @VerifiedByUserId,
        status = CASE WHEN status = 'matched' THEN status ELSE 'verified' END,
        updated_at = GETDATE()
    WHERE id = @Id
      AND status <> 'deleted';

    SELECT @@ROWCOUNT;
END;
GO
