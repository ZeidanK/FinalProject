IF OBJECT_ID('dbo.FP26_sp_UploadJobs_Delete', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_UploadJobs_Delete;
GO

CREATE PROCEDURE dbo.FP26_sp_UploadJobs_Delete
    @Id BIGINT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.FP26_upload_jobs WHERE id = @Id;
    SELECT @@ROWCOUNT;
END
GO
