-- SQL Server Mixed Authentication Setup Script
-- Run this in SSMS as Administrator to enable SQL Server Authentication

-- Step 1: Enable Mixed Authentication Mode
EXEC xp_instance_regwrite 
    N'HKEY_LOCAL_MACHINE', 
    N'Software\Microsoft\MSSQLServer\MSSQLServer', 
    N'LoginMode', 
    REG_DWORD, 
    2;
GO

PRINT '✓ Mixed Authentication Mode enabled';
PRINT '⚠️  YOU MUST RESTART SQL SERVER SERVICE FOR THIS TO TAKE EFFECT';
PRINT '   Run in elevated PowerShell: Restart-Service -Name "MSSQL$SQLEXPRESS" -Force';
PRINT '';
GO

-- Step 2: Create SQL Server Login
IF EXISTS (SELECT 1 FROM sys.server_principals WHERE name = 'fpuser')
    DROP LOGIN fpuser;
GO

CREATE LOGIN fpuser 
WITH PASSWORD = 'FP2024!Dev', 
     CHECK_POLICY = OFF,
     CHECK_EXPIRATION = OFF;
GO

PRINT '✓ Login fpuser created';
GO

-- Step 3: Grant sysadmin role
ALTER SERVER ROLE sysadmin ADD MEMBER fpuser;
GO

PRINT '✓ fpuser added to sysadmin role';
GO

-- Step 4: Create database user
USE FP;
GO

IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'fpuser')
    DROP USER fpuser;
GO

CREATE USER fpuser FOR LOGIN fpuser;
GO

ALTER ROLE db_owner ADD MEMBER fpuser;
GO

PRINT '✓ Database user fpuser created in FP database';
PRINT '✓ fpuser added to db_owner role';
GO

-- Verify setup
PRINT '';
PRINT '=== VERIFICATION ===';
SELECT 
    'Login exists' as Status,
    name as LoginName,
    CASE WHEN is_disabled = 0 THEN 'Enabled' ELSE 'Disabled' END as State
FROM sys.server_principals 
WHERE name = 'fpuser';
GO

USE FP;
GO

SELECT 
    'User exists in FP' as Status,
    name as UserName,
    type_desc as UserType
FROM sys.database_principals 
WHERE name = 'fpuser';
GO

PRINT '';
PRINT '=== IMPORTANT ===';
PRINT 'After restarting SQL Server, test the connection:';
PRINT 'sqlcmd -S localhost,50115 -U fpuser -P "FP2024!Dev" -Q "SELECT @@VERSION"';
PRINT '';
