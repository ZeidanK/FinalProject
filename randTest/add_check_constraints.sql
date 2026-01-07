-- SQL Server CHECK Constraints for ENUM replacement
-- Run this script AFTER creating the tables with our_sqlserver.sql
-- These constraints ensure data integrity for the converted VARCHAR columns

USE FP;
GO

-- ai_feedback table
ALTER TABLE ai_feedback
  ADD CONSTRAINT CK_ai_feedback_feedback_type 
  CHECK (feedback_type IN ('invoice_extraction','transaction_match','category_suggestion','anomaly_detection'));
GO

-- anomalies table
ALTER TABLE anomalies
  ADD CONSTRAINT CK_anomalies_anomaly_type 
  CHECK (anomaly_type IN ('duplicate_transaction','duplicate_invoice','amount_mismatch','missing_invoice','missing_transaction','date_discrepancy','unusual_amount','vat_calculation_error','vendor_mismatch','unmatched_for_long_time','low_confidence','currency_conversion','other'));
GO

ALTER TABLE anomalies
  ADD CONSTRAINT CK_anomalies_severity 
  CHECK (severity IN ('critical','warning','info'));
GO

ALTER TABLE anomalies
  ADD CONSTRAINT CK_anomalies_status 
  CHECK (status IN ('open','investigating','resolved','ignored','false_positive'));
GO

ALTER TABLE anomalies
  ADD CONSTRAINT CK_anomalies_detection_method 
  CHECK (detection_method IN ('ai','rule_engine','manual','system'));
GO

-- audit_logs table
ALTER TABLE audit_logs
  ADD CONSTRAINT CK_audit_logs_action 
  CHECK (action IN ('create','read','update','delete','login','logout','permission_change','upload','import','export','match','unmatch','verify','resolve_anomaly','system'));
GO

-- categories table
ALTER TABLE categories
  ADD CONSTRAINT CK_categories_category_type 
  CHECK (category_type IN ('income','expense','asset','liability'));
GO

-- exports table
ALTER TABLE exports
  ADD CONSTRAINT CK_exports_export_type 
  CHECK (export_type IN ('vat_report','consolidated_transactions','invoice_list','transaction_list','matching_report','anomaly_report','audit_trail','custom'));
GO

ALTER TABLE exports
  ADD CONSTRAINT CK_exports_file_format 
  CHECK (file_format IN ('csv','excel','pdf','json','xml'));
GO

ALTER TABLE exports
  ADD CONSTRAINT CK_exports_status 
  CHECK (status IN ('pending','processing','completed','failed'));
GO

-- file_uploads table
ALTER TABLE file_uploads
  ADD CONSTRAINT CK_file_uploads_upload_purpose 
  CHECK (upload_purpose IN ('invoice','transaction','document','profile','other'));
GO

ALTER TABLE file_uploads
  ADD CONSTRAINT CK_file_uploads_status 
  CHECK (status IN ('uploading','uploaded','processing','completed','error'));
GO

-- invoice_transaction_matches table
ALTER TABLE invoice_transaction_matches
  ADD CONSTRAINT CK_matches_match_type 
  CHECK (match_type IN ('full','partial','split_invoice','split_transaction'));
GO

ALTER TABLE invoice_transaction_matches
  ADD CONSTRAINT CK_matches_match_method 
  CHECK (match_method IN ('ai_automatic','ai_suggested','manual','rule_based'));
GO

ALTER TABLE invoice_transaction_matches
  ADD CONSTRAINT CK_matches_status 
  CHECK (status IN ('active','disputed','cancelled','confirmed'));
GO

-- invoices table
ALTER TABLE invoices
  ADD CONSTRAINT CK_invoices_status 
  CHECK (status IN ('uploaded','processing','processed','verified','matched','partially_matched','exported','error'));
GO

-- notifications table
ALTER TABLE notifications
  ADD CONSTRAINT CK_notifications_notification_type 
  CHECK (notification_type IN ('anomaly_detected','processing_complete','match_suggestion','access_granted','access_revoked','export_ready','system_alert','reminder'));
GO

ALTER TABLE notifications
  ADD CONSTRAINT CK_notifications_priority 
  CHECK (priority IN ('low','medium','high','urgent'));
GO

-- system_logs table
ALTER TABLE system_logs
  ADD CONSTRAINT CK_system_logs_log_level 
  CHECK (log_level IN ('debug','info','warning','error','critical'));
GO

-- transactions table
ALTER TABLE transactions
  ADD CONSTRAINT CK_transactions_transaction_type 
  CHECK (transaction_type IN ('debit','credit'));
GO

ALTER TABLE transactions
  ADD CONSTRAINT CK_transactions_status 
  CHECK (status IN ('pending','confirmed','disputed'));
GO

-- user_company_access table
ALTER TABLE user_company_access
  ADD CONSTRAINT CK_user_company_access_access_level 
  CHECK (access_level IN ('full_access','view_only'));
GO

ALTER TABLE user_company_access
  ADD CONSTRAINT CK_user_company_access_status 
  CHECK (status IN ('active','pending','revoked','expired'));
GO

-- users table
ALTER TABLE users
  ADD CONSTRAINT CK_users_role 
  CHECK (role IN ('accountant','business_owner','admin'));
GO

-- vat_reports table
ALTER TABLE vat_reports
  ADD CONSTRAINT CK_vat_reports_report_type 
  CHECK (report_type IN ('monthly','quarterly','annual'));
GO

PRINT 'Successfully added all CHECK constraints for data integrity';
GO
