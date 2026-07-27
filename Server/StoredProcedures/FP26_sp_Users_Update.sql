-- ============================================================
-- Run this script in SSMS against: igroup104_test2
-- Only updates the fields a user may edit from their profile.
-- Password changes are handled separately (not here).
-- ============================================================

IF OBJECT_ID('dbo.FP26_sp_Users_Update', 'P') IS NOT NULL
    DROP PROCEDURE dbo.FP26_sp_Users_Update;
GO

CREATE PROCEDURE dbo.FP26_sp_Users_Update
    @Id                BIGINT,
    @Name              VARCHAR(255)  = NULL,
    @Phone             VARCHAR(50)   = NULL,
    @ProfilePicture    VARCHAR(500)  = NULL,
    @Bio               NVARCHAR(MAX) = NULL,
    @YearsOfExperience INT           = NULL,
    @HourlyRate        DECIMAL(10,2) = NULL,
    @Location          NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.FP26_users
    SET
        name               = ISNULL(@Name,              name),
        phone              = ISNULL(@Phone,             phone),
        profile_picture    = ISNULL(@ProfilePicture,    profile_picture),
        bio                = ISNULL(@Bio,               bio),
        years_of_experience = ISNULL(@YearsOfExperience, years_of_experience),
        hourly_rate        = ISNULL(@HourlyRate,        hourly_rate),
        location           = ISNULL(@Location,          location),
        updated_at         = GETDATE()
    WHERE id = @Id;

    SELECT @@ROWCOUNT AS rows_affected;
END
GO