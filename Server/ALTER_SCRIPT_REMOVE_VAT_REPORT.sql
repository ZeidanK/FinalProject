-- Retires the VAT reporting API database dependency.
-- Invoice VAT columns remain in place because extraction still uses them.
IF OBJECT_ID('dbo.FP26_sp_Reports_GetVATReport', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Reports_GetVATReport;
GO
