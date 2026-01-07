# SQL Server Database Setup Guide

This guide will walk you through setting up the local SQL Server database for the FinalProject application.

## Files Overview

- **our.sql** - Original MySQL schema (for reference)
- **our_sqlserver.sql** - Converted SQL Server schema (ready to execute)
- **add_check_constraints.sql** - CHECK constraints for data integrity (optional but recommended)
- **convert_to_sqlserver.py** - Python script used for conversion (for reference)

## Conversion Changes Made

The following MySQL syntax was converted to SQL Server T-SQL:

| MySQL Syntax | SQL Server Equivalent |
|-------------|----------------------|
| AUTO_INCREMENT | IDENTITY(1,1) |
| BOOLEAN | BIT |
| TIMESTAMP | DATETIME2 |
| DEFAULT CURRENT_TIMESTAMP | DEFAULT GETDATE() |
| DEFAULT TRUE/FALSE | DEFAULT 1/0 |
| ENUM(...) | VARCHAR(50) + CHECK constraints |
| JSON | NVARCHAR(MAX) |
| TEXT | VARCHAR(MAX) |
| `companies id` (space) | `companies_id` (underscore) |

## Database Schema

The database consists of **20 tables**:

### Core Tables
- **users** - User accounts with roles (accountant, business_owner, admin)
- **companies** - Business entities (multi-tenant)
- **user_company_access** - Access control for multi-tenancy

### Financial Tables
- **invoices** - Invoice documents with AI extraction
- **invoice_line_items** - Line items from invoices
- **transactions** - Bank transactions
- **invoice_transaction_matches** - Reconciliation matches

### Reports & Compliance
- **vat_reports** - VAT/tax reports
- **exports** - Export job tracking
- **anomalies** - Detected financial anomalies

### Configuration
- **categories** - Financial categories (hierarchical)
- **file_uploads** - Document management
- **notifications** - User notifications
- **user_notification_settings** - Notification preferences

### System
- **audit_logs** - Audit trail
- **system_logs** - System logging
- **user_sessions** - Session management
- **password_reset_tokens** - Password reset flow
- **ai_feedback** - AI model feedback
- **address** - Company addresses

## Prerequisites

1. **SQL Server** - Install one of:
   - SQL Server Express (free, 10GB limit) - [Download](https://www.microsoft.com/en-us/sql-server/sql-server-downloads)
   - SQL Server Developer Edition (free, full-featured) - Recommended

2. **SQL Server Management Studio (SSMS)** - [Download](https://docs.microsoft.com/en-us/sql/ssms/download-sql-server-management-studio-ssms)

## Setup Steps

### Step 1: Create Database in SSMS

1. Open **SQL Server Management Studio (SSMS)**
2. Connect to your local SQL Server instance (usually `localhost` or `(local)`)
3. Right-click on **Databases** in Object Explorer
4. Select **New Database...**
5. Enter database name: `FP`
6. Click **OK**

### Step 2: Execute Schema Script

1. In SSMS, ensure you're connected to `FP`
2. Click **File** > **Open** > **File...**
3. Browse to and select `our_sqlserver.sql`
4. Click **Execute** (or press F5)
5. Verify execution completed successfully:
   - Should see "Commands completed successfully" messages
   - Check for any errors in the Messages pane

### Step 3: Add CHECK Constraints (Optional but Recommended)

1. In SSMS, click **File** > **Open** > **File...**
2. Browse to and select `add_check_constraints.sql`
3. Click **Execute** (or press F5)
4. Verify: Should see "Successfully added all CHECK constraints for data integrity"

### Step 4: Verify Database Creation

Run this query to verify all tables were created:

```sql
USE FP;
GO

SELECT 
    TABLE_NAME,
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = t.TABLE_NAME) as ColumnCount
FROM 
    INFORMATION_SCHEMA.TABLES t
WHERE 
    TABLE_TYPE = 'BASE TABLE'
ORDER BY 
    TABLE_NAME;
GO
```

You should see **20 tables** listed.

## Authentication Options

Choose one of these connection methods for your Node.js backend:

### Option 1: Windows Authentication (Recommended for Local Dev)
```javascript
{
  server: 'localhost',
  database: 'FP',
  options: {
    trustedConnection: true,
    encrypt: false
  }
}
```

### Option 2: SQL Server Authentication
1. Enable SQL Server Authentication:
   - In SSMS, right-click server > Properties > Security
   - Select "SQL Server and Windows Authentication mode"
   - Restart SQL Server service

2. Create login:
```sql
CREATE LOGIN finalproject_user WITH PASSWORD = 'YourSecurePassword123!';
GO
USE FP;
GO
CREATE USER finalproject_user FOR LOGIN finalproject_user;
GO
ALTER ROLE db_owner ADD MEMBER finalproject_user;
GO
```

3. Connection config:
```javascript
{
  server: 'localhost',
  database: 'FP',
  user: 'finalproject_user',
  password: 'YourSecurePassword123!',
  options: {
    encrypt: false
  }
}
```

## Testing Connection

Test your database connection with this query:

```sql
USE FP;
GO

-- Check database info
SELECT 
    DB_NAME() as DatabaseName,
    COUNT(*) as TotalTables
FROM 
    INFORMATION_SCHEMA.TABLES 
WHERE 
    TABLE_TYPE = 'BASE TABLE';
GO

-- Check foreign keys
SELECT 
    COUNT(*) as TotalForeignKeys
FROM 
    sys.foreign_keys;
GO

-- Check indexes
SELECT 
    COUNT(*) as TotalIndexes
FROM 
    sys.indexes
WHERE 
    object_id IN (SELECT object_id FROM sys.tables);
GO
```

Expected results:
- **20 tables**
- **47 foreign keys**
- **60+ indexes**

## Troubleshooting

### Error: "Invalid object name"
- Ensure you've selected `FP` in the database dropdown
- Or add `USE FP;` at the beginning of your query

### Error: "Cannot insert duplicate key"
- The UNIQUE constraints are working correctly
- Check your INSERT statements for duplicate values

### Error: "The INSERT statement conflicted with the CHECK constraint"
- You're trying to insert invalid enum values
- Check the allowed values in `add_check_constraints.sql`
- Example: For `users.role`, only 'accountant', 'business_owner', or 'admin' are allowed

### Connection Issues from Node.js
- Verify SQL Server is running (SQL Server Configuration Manager)
- Check firewall settings allow local connections
- For Windows Auth, ensure the Node.js process runs under a valid Windows user
- Test connection string with SQL Server Configuration Manager

## Next Steps

After database setup:

1. ✅ Database created and verified
2. ⏭️ Set up Node.js/Express backend with mssql package
3. ⏭️ Create API routes for CRUD operations
4. ⏭️ Generate seed data
5. ⏭️ Connect React frontend

## Database Maintenance

### Backup Database
```sql
BACKUP DATABASE FP
TO DISK = 'C:\Backup\FP.bak'
WITH FORMAT;
GO
```

### Restore Database
```sql
USE master;
GO
RESTORE DATABASE FP
FROM DISK = 'C:\Backup\FP.bak'
WITH REPLACE;
GO
```

### Clear All Data (Keep Schema)
```sql
USE FP;
GO

-- Disable all foreign keys
EXEC sp_MSforeachtable 'ALTER TABLE ? NOCHECK CONSTRAINT ALL';
GO

-- Delete all data
EXEC sp_MSforeachtable 'DELETE FROM ?';
GO

-- Re-enable foreign keys
EXEC sp_MSforeachtable 'ALTER TABLE ? CHECK CONSTRAINT ALL';
GO

-- Reset identity columns
EXEC sp_MSforeachtable 'IF EXISTS(SELECT 1 FROM sys.identity_columns WHERE object_id = OBJECT_ID(''?'')) DBCC CHECKIDENT(''?'', RESEED, 0)';
GO
```

## Schema Modifications

If you need to modify the schema:

1. Create an ALTER script (don't modify the original)
2. Test on a copy of the database first
3. Document all changes
4. Update the schema version in your application

Example migration script:
```sql
USE FP;
GO

-- Add new column
ALTER TABLE users 
ADD middle_name VARCHAR(100) NULL;
GO

-- Add comment
EXEC sys.sp_addextendedproperty 
    @name = N'MS_Description',
    @value = N'User middle name',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'users',
    @level2type = N'COLUMN', @level2name = N'middle_name';
GO
```

## Support

For issues or questions:
- Check SSMS Messages pane for detailed error messages
- Review sys.messages table for SQL Server errors
- Consult SQL Server documentation: https://docs.microsoft.com/en-us/sql/
