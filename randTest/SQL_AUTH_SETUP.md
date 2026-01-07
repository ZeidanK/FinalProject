# Enable SQL Server Authentication and Create User

## Quick Setup

1. **Open SSMS as Administrator**
   - Right-click SQL Server Management Studio
   - Select "Run as administrator"

2. **Connect to SQL Server**
   - Server: `localhost\SQLEXPRESS`
   - Authentication: Windows Authentication

3. **Open and Execute Script**
   - File → Open → File
   - Select `enable_sql_auth.sql`
   - Click Execute (F5)

4. **Restart SQL Server (REQUIRED)**
   
   **Option A: Services.msc**
   - Press `Win+R`, type `services.msc`
   - Find "SQL Server (SQLEXPRESS)"
   - Right-click → Restart

   **Option B: PowerShell as Administrator**
   ```powershell
   Restart-Service -Name "MSSQL$SQLEXPRESS" -Force
   ```

   **Option C: SQL Server Configuration Manager**
   - Open SQL Server Configuration Manager
   - SQL Server Services → SQL Server (SQLEXPRESS)
   - Right-click → Restart

5. **Test Connection**
   ```powershell
   sqlcmd -S localhost,50115 -U fpuser -P "FP2024!Dev" -Q "SELECT @@VERSION"
   ```

6. **Start Your Application**
   ```bash
   npm run dev
   ```

## Connection Details

After setup, your application will use:
- **Server**: localhost:50115
- **Database**: FP
- **Username**: fpuser
- **Password**: FP2024!Dev
- **Authentication**: SQL Server Authentication

## Troubleshooting

### "Login failed for user 'fpuser'"
- SQL Server was not restarted after enabling Mixed Auth
- Restart SQL Server service (see step 4)

### "Cannot restart SQL Server"
- Run PowerShell as Administrator
- Or use Services.msc with admin rights

### Still having issues?
Run this diagnostic query in SSMS:
```sql
-- Check authentication mode
EXEC xp_loginconfig 'login mode';

-- Check if login exists
SELECT name, is_disabled, create_date 
FROM sys.server_principals 
WHERE name = 'fpuser';

-- Check server roles
SELECT r.name as RoleName
FROM sys.server_role_members m
JOIN sys.server_principals r ON m.role_principal_id = r.principal_id
JOIN sys.server_principals u ON m.member_principal_id = u.principal_id
WHERE u.name = 'fpuser';
```

## Alternative: Use Windows Authentication

If you prefer to keep using Windows Authentication:

1. Update `.env`:
   ```env
   DB_TRUSTED_CONNECTION=true
   DB_USER=
   DB_PASSWORD=
   ```

2. The application will connect using your Windows credentials
   - Requires your Windows user to have SQL Server permissions
   - No restart needed
