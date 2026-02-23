-- 1. Create the database
CREATE DATABASE FP;
GO

-- 2. Create the server-level login
USE master;
GO
CREATE LOGIN fpapp
  WITH PASSWORD = 'FPApp2024!',
       DEFAULT_DATABASE = FP,
       CHECK_EXPIRATION = OFF,
       CHECK_POLICY = OFF;
GO

-- 3. Create the database user mapped to that login
USE FP;
GO
CREATE USER fpapp FOR LOGIN fpapp;
GO

-- 4. Grant full ownership (needed to create tables, indexes, etc.)
ALTER ROLE db_owner ADD MEMBER fpapp;
GO