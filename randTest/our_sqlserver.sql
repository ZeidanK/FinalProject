

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'address', 'column', 'street';
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'address', 'column', 'city';
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'address', 'column', 'country';
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'address', 'column', 'zip';
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'address', 'column', 'state';
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'address', 'column', 'id';
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'address', 'column', 'companies_id';
GO

CREATE TABLE ai_feedback
(
  id                     BIGINT                                                                           NOT NULL IDENTITY(1,1),
  company_id             BIGINT                                                                           NOT NULL,
  user_id                BIGINT                                                                           NOT NULL,
  feedback_type VARCHAR(50) NOT NULL,
  related_invoice_id     BIGINT                                                                          ,
  related_transaction_id BIGINT                                                                          ,
  related_match_id       BIGINT                                                                          ,
  related_anomaly_id     BIGINT                                                                          ,
  ai_suggestion          VARCHAR(MAX)                                                                            ,
  ai_confidence          DECIMAL(5,4)                                                                    ,
  user_correction        VARCHAR(MAX)                                                                            ,
  was_correct            BIT                                                                          NOT NULL,
  feedback_notes         VARCHAR(MAX)                                                                            ,
  created_at             DATETIME2                                                                        NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_ai_feedback PRIMARY KEY (id)
)
GO

CREATE TABLE anomalies
(
  id                     BIGINT                                                                                                                                                                                                                                   NOT NULL IDENTITY(1,1),
  company_id             BIGINT                                                                                                                                                                                                                                   NOT NULL,
  anomaly_type VARCHAR(50) NOT NULL,
  severity VARCHAR(50)                                                                                                                                                                                                              NOT NULL DEFAULT 'warning',
  title                  VARCHAR(255)                                                                                                                                                                                                                             NOT NULL,
  description            VARCHAR(MAX)                                                                                                                                                                                                                                     NOT NULL,
  suggested_action       VARCHAR(MAX)                                                                                                                                                                                                                                    ,
  related_invoice_id     BIGINT                                                                                                                                                                                                                                  ,
  related_transaction_id BIGINT                                                                                                                                                                                                                                  ,
  related_match_id       BIGINT                                                                                                                                                                                                                                  ,
  amount                 DECIMAL(15,2)                                                                                                                                                                                                                           ,
  status VARCHAR(50)                                                                                                                                                                                 NOT NULL DEFAULT 'open',
  resolved_by_user_id    BIGINT                                                                                                                                                                                                                                  ,
  resolved_at            DATETIME2                                                                                                                                                                                                                               ,
  resolution_notes       VARCHAR(MAX)                                                                                                                                                                                                                                    ,
  detection_method VARCHAR(50)                                                                                                                                                                                                       NOT NULL DEFAULT 'ai',
  detection_confidence   DECIMAL(5,4)                                                                                                                                                                                                                            ,
  created_at             DATETIME2                                                                                                                                                                                                                                NOT NULL DEFAULT GETDATE(),
  updated_at             DATETIME2                                                                                                                                                                                                                                NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_anomalies PRIMARY KEY (id)
)
GO

CREATE TABLE audit_logs
(
  id          BIGINT                                                                                                                          NOT NULL IDENTITY(1,1),
  user_id     BIGINT                                                                                                                         ,
  company_id  BIGINT                                                                                                                         ,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50)                                                                                                                    ,
  entity_id   BIGINT                                                                                                                         ,
  description VARCHAR(MAX)                                                                                                                           ,
  old_values  NVARCHAR(MAX)                                                                                                                           ,
  new_values  NVARCHAR(MAX)                                                                                                                           ,
  ip_address  VARCHAR(45)                                                                                                                    ,
  user_agent  VARCHAR(MAX)                                                                                                                           ,
  session_id  VARCHAR(100)                                                                                                                   ,
  created_at  DATETIME2                                                                                                                       NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_audit_logs PRIMARY KEY (id)
)
GO

CREATE TABLE categories
(
  id                 BIGINT                               NOT NULL IDENTITY(1,1),
  company_id         BIGINT                              ,
  category_name      VARCHAR(100)                         NOT NULL,
  description        VARCHAR(MAX)                                ,
  parent_category_id BIGINT                              ,
  category_type VARCHAR(50) NOT NULL,
  tax_code           VARCHAR(50)                         ,
  tax_deductible     BIT                              NOT NULL DEFAULT 0,
  is_active          BIT                              NOT NULL DEFAULT 1,
  is_system          BIT                              NOT NULL DEFAULT 0,
  created_at         DATETIME2                            NOT NULL DEFAULT GETDATE(),
  updated_at         DATETIME2                            NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_categories PRIMARY KEY (id)
)
GO

CREATE TABLE companies
(
  id                  BIGINT       NOT NULL IDENTITY(1,1),
  registration_number VARCHAR(100),
  name                VARCHAR(255) NOT NULL,
  street              VARCHAR(MAX)        ,
  city                VARCHAR(100),
  state               VARCHAR(100),
  postal_code         VARCHAR(20) ,
  country             VARCHAR(100) NOT NULL DEFAULT 'USA',
  email               VARCHAR(255),
  phone               VARCHAR(50) ,
  website             VARCHAR(255),
  tax_id              VARCHAR(100),
  vat_number          VARCHAR(100),
  fiscal_year_start   DATE        ,
  currency            VARCHAR(3)   NOT NULL DEFAULT 'USD',
  is_active           BIT      NOT NULL DEFAULT 1,
  created_by_user_id  BIGINT       NOT NULL,
  created_at          DATETIME2    NOT NULL DEFAULT GETDATE(),
  updated_at          DATETIME2    NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_companies PRIMARY KEY (id)
)
GO

ALTER TABLE companies
  ADD CONSTRAINT UQ_registration_number UNIQUE (registration_number)
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'companies', 'column', 'id'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'companies', 'column', 'registration_number'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'companies', 'column', 'name'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '?', 'user', dbo, 'table', 'companies', 'column', 'street'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '?', 'user', dbo, 'table', 'companies', 'column', 'city'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '?', 'user', dbo, 'table', 'companies', 'column', 'state'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '?', 'user', dbo, 'table', 'companies', 'column', 'postal_code'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '?', 'user', dbo, 'table', 'companies', 'column', 'country'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'companies', 'column', 'email'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'companies', 'column', 'phone'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'companies', 'column', 'website'
GO

CREATE TABLE exports
(
  id                 BIGINT                                                                                                                     NOT NULL IDENTITY(1,1),
  company_id         BIGINT                                                                                                                     NOT NULL,
  export_type VARCHAR(50) NOT NULL,
  file_format VARCHAR(50)                                                                                               NOT NULL,
  file_name          VARCHAR(255)                                                                                                               NOT NULL,
  file_path          VARCHAR(500)                                                                                                              ,
  file_size_kb       INT                                                                                                                       ,
  period_start       DATE                                                                                                                      ,
  period_end         DATE                                                                                                                      ,
  filters_applied    NVARCHAR(MAX)                                                                                                                      ,
  record_count       INT                                                                                                                       ,
  total_amount       DECIMAL(15,2)                                                                                                             ,
  status VARCHAR(50)                                                                                  NOT NULL DEFAULT 'pending',
  error_message      VARCHAR(MAX)                                                                                                                      ,
  created_by_user_id BIGINT                                                                                                                     NOT NULL,
  created_at         DATETIME2                                                                                                                  NOT NULL DEFAULT GETDATE(),
  completed_at       DATETIME2                                                                                                                 ,
  CONSTRAINT PK_exports PRIMARY KEY (id)
)
GO

CREATE TABLE file_uploads
(
  id                  BIGINT                                              NOT NULL IDENTITY(1,1),
  company_id          BIGINT                                              NOT NULL,
  uploaded_by_user_id BIGINT                                              NOT NULL,
  original_file_name  VARCHAR(255)                                        NOT NULL,
  stored_file_name    VARCHAR(255)                                        NOT NULL,
  file_path           VARCHAR(500)                                        NOT NULL,
  file_type           VARCHAR(50)                                         NOT NULL,
  file_size_kb        INT                                                 NOT NULL,
  mime_type           VARCHAR(100)                                       ,
  upload_purpose VARCHAR(50)    NOT NULL,
  related_entity_type VARCHAR(50)                                        ,
  related_entity_id   BIGINT                                             ,
  status VARCHAR(50) NOT NULL DEFAULT 'uploaded',
  created_at          DATETIME2                                           NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_file_uploads PRIMARY KEY (id)
)
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '?', 'user', dbo, 'table', 'file_uploads', 'column', 'related_entity_type'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '?', 'user', dbo, 'table', 'file_uploads', 'column', 'related_entity_id'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '?', 'user', dbo, 'table', 'file_uploads', 'column', 'status'
GO

CREATE TABLE invoice_line_items
(
  id                  BIGINT        NOT NULL IDENTITY(1,1),
  invoice_id          BIGINT        NOT NULL,
  line_number         INT           NOT NULL,
  description         VARCHAR(MAX)          NOT NULL,
  category            VARCHAR(100) ,
  quantity            DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit_price          DECIMAL(15,2) NOT NULL,
  vat_rate            DECIMAL(5,2) ,
  total_amount        DECIMAL(15,2) NOT NULL,
  ai_confidence_score DECIMAL(5,4) ,
  created_at          DATETIME2     NOT NULL DEFAULT GETDATE(),
  updated_at          DATETIME2     NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_invoice_line_items PRIMARY KEY (id)
)
GO

CREATE TABLE invoice_transaction_matches
(
  id                   BIGINT                                             NOT NULL IDENTITY(1,1),
  invoice_id           BIGINT                                             NOT NULL,
  transaction_id       BIGINT                                             NOT NULL,
  match_type VARCHAR(50) NOT NULL DEFAULT 'full',
  matched_amount       DECIMAL(15,2)                                      NOT NULL,
  match_method VARCHAR(50)  NOT NULL,
  match_confidence     DECIMAL(5,4)                                      ,
  match_reason         VARCHAR(MAX)                                              ,
  status VARCHAR(50)          NOT NULL DEFAULT 'active',
  matched_by_user_id   BIGINT                                             NOT NULL,
  confirmed_by_user_id BIGINT                                            ,
  confirmed_at         DATETIME2                                         ,
  created_at           DATETIME2                                          NOT NULL DEFAULT GETDATE(),
  updated_at           DATETIME2                                          NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_invoice_transaction_matches PRIMARY KEY (id)
)
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '?', 'user', dbo, 'table', 'invoice_transaction_matches', 'column', 'match_reason'
GO

CREATE TABLE invoices
(
  id                       BIGINT                                                                                NOT NULL IDENTITY(1,1),
  company_id               BIGINT                                                                                NOT NULL,
  invoice_number           VARCHAR(100)                                                                          NOT NULL,
  vendor_name              VARCHAR(255)                                                                          NOT NULL,
  vendor_tax_id            VARCHAR(100)                                                                         ,
  invoice_date             DATE                                                                                  NOT NULL,
  due_date                 DATE                                                                                 ,
  payment_date             DATE                                                                                 ,
  subtotal                 DECIMAL(15,2)                                                                         NOT NULL,
  vat_rate                 DECIMAL(5,2)                                                                         ,
  vat_amount               DECIMAL(15,2)                                                                        ,
  total_amount             DECIMAL(15,2)                                                                         NOT NULL,
  currency                 VARCHAR(3)                                                                            NOT NULL DEFAULT 'USD',
  original_file_name       VARCHAR(255)                                                                         ,
  file_path                VARCHAR(500)                                                                         ,
  file_type                VARCHAR(50)                                                                          ,
  file_size_kb             INT                                                                                  ,
  status VARCHAR(50) NOT NULL DEFAULT 'uploaded',
  ai_extraction_confidence DECIMAL(5,4)                                                                         ,
  ai_processed             BIT                                                                               NOT NULL DEFAULT 0,
  ai_processed_at          DATETIME2                                                                            ,
  is_verified              BIT                                                                               NOT NULL DEFAULT 0,
  verified_by_user_id      BIGINT                                                                               ,
  verified_at              DATETIME2                                                                            ,
  is_matched               BIT                                                                               NOT NULL DEFAULT 0,
  matched_amount           DECIMAL(15,2)                                                                         NOT NULL DEFAULT 0,
  last_four_digits_card    VARCHAR(4)                                                                           ,
  internal_reference       VARCHAR(100)                                                                         ,
  notes                    VARCHAR(MAX)                                                                                 ,
  uploaded_by_user_id      BIGINT                                                                                NOT NULL,
  created_at               DATETIME2                                                                             NOT NULL DEFAULT GETDATE(),
  updated_at               DATETIME2                                                                             NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_invoices PRIMARY KEY (id)
)
GO

ALTER TABLE invoices
  ADD CONSTRAINT UQ_company_id UNIQUE (company_id)
GO

ALTER TABLE invoices
  ADD CONSTRAINT UQ_invoice_number UNIQUE (invoice_number)
GO

CREATE TABLE notifications
(
  id                  BIGINT                                                                                                                       NOT NULL IDENTITY(1,1),
  user_id             BIGINT                                                                                                                       NOT NULL,
  company_id          BIGINT                                                                                                                      ,
  notification_type VARCHAR(50) NOT NULL,
  priority VARCHAR(50)                                                                                                 NOT NULL DEFAULT 'medium',
  title               VARCHAR(255)                                                                                                                 NOT NULL,
  message             VARCHAR(MAX)                                                                                                                         NOT NULL,
  related_entity_type VARCHAR(50)                                                                                                                 ,
  related_entity_id   BIGINT                                                                                                                      ,
  action_url          VARCHAR(500)                                                                                                                ,
  is_read             BIT                                                                                                                      NOT NULL DEFAULT 0,
  read_at             DATETIME2                                                                                                                   ,
  is_dismissed        BIT                                                                                                                      NOT NULL DEFAULT 0,
  dismissed_at        DATETIME2                                                                                                                   ,
  email_sent          BIT                                                                                                                      NOT NULL DEFAULT 0,
  email_sent_at       DATETIME2                                                                                                                   ,
  created_at          DATETIME2                                                                                                                    NOT NULL DEFAULT GETDATE(),
  expires_at          DATETIME2                                                                                                                   ,
  CONSTRAINT PK_notifications PRIMARY KEY (id)
)
GO

CREATE TABLE password_reset_tokens
(
  id         BIGINT       NOT NULL IDENTITY(1,1),
  user_id    BIGINT       NOT NULL,
  token      VARCHAR(255) NOT NULL,
  expires_at DATETIME2    NOT NULL,
  used_at    DATETIME2   ,
  created_at DATETIME2    NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_password_reset_tokens PRIMARY KEY (id)
)
GO

ALTER TABLE password_reset_tokens
  ADD CONSTRAINT UQ_token UNIQUE (token)
GO

CREATE TABLE system_logs
(
  id                  BIGINT                                  NOT NULL IDENTITY(1,1),
  log_level VARCHAR(50) NOT NULL,
  category            VARCHAR(50)                             NOT NULL,
  message             VARCHAR(MAX)                                    NOT NULL,
  company_id          BIGINT                                 ,
  user_id             BIGINT                                 ,
  related_entity_type VARCHAR(50)                            ,
  related_entity_id   BIGINT                                 ,
  stack_trace         VARCHAR(MAX)                                   ,
  error_code          VARCHAR(50)                            ,
  metadata            NVARCHAR(MAX)                                   ,
  created_at          DATETIME2                               NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_system_logs PRIMARY KEY (id)
)
GO

CREATE TABLE transactions
(
  id                  BIGINT                           NOT NULL IDENTITY(1,1),
  company_id          BIGINT                           NOT NULL,
  bank_account_id     BIGINT                           NOT NULL,
  transaction_date    DATE                             NOT NULL,
  posted_date         DATE                            ,
  description         VARCHAR(MAX)                             NOT NULL,
  amount              DECIMAL(15,2)                    NOT NULL,
  balance_after       DECIMAL(15,2)                   ,
  transaction_type VARCHAR(50)               NOT NULL,
  category            VARCHAR(100)                    ,
  category_confidence DECIMAL(5,4)                    ,
  reference_number    VARCHAR(100)                    ,
  is_matched          BIT                          NOT NULL DEFAULT 0,
  is_duplicate        BIT                          NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
  notes               VARCHAR(MAX)                            ,
  imported_from_file  BIGINT                          ,
  created_by_user_id  BIGINT                           NOT NULL,
  created_at          DATETIME2                        NOT NULL DEFAULT GETDATE(),
  updated_at          DATETIME2                        NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_transactions PRIMARY KEY (id)
)
GO

CREATE TABLE user_company_access
(
  id                 BIGINT                               NOT NULL IDENTITY(1,1),
  user_id            BIGINT                               NOT NULL,
  company_id         BIGINT                               NOT NULL,
  access_level VARCHAR(50)          NOT NULL DEFAULT 'view_only',
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  granted_at         DATETIME2                           ,
  granted_by_user_id BIGINT                              ,
  revoked_at         DATETIME2                           ,
  revoked_by_user_id BIGINT                              ,
  expires_at         DATETIME2                           ,
  notes              VARCHAR(MAX)                                ,
  created_at         DATETIME2                            NOT NULL DEFAULT GETDATE(),
  updated_at         DATETIME2                            NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_user_company_access PRIMARY KEY (id)
)
GO

ALTER TABLE user_company_access
  ADD CONSTRAINT UQ_user_id UNIQUE (user_id)
GO

ALTER TABLE user_company_access
  ADD CONSTRAINT UQ_company_id UNIQUE (company_id)
GO

CREATE TABLE user_notification_settings
(
  user_id           BIGINT    NOT NULL,
  email_alerts      BIT   NOT NULL DEFAULT 1,
  anomaly_alerts    BIT   NOT NULL DEFAULT 1,
  match_suggestions BIT   NOT NULL DEFAULT 1,
  weekly_reports    BIT   NOT NULL DEFAULT 1,
  monthly_reports   BIT   NOT NULL DEFAULT 0,
  marketing_emails  BIT   NOT NULL DEFAULT 0,
  updated_at        DATETIME2 NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_user_notification_settings PRIMARY KEY (user_id)
)
GO

ALTER TABLE user_notification_settings
  ADD CONSTRAINT UQ_user_id UNIQUE (user_id)
GO

CREATE TABLE user_sessions
(
  id               BIGINT       NOT NULL IDENTITY(1,1),
  user_id          BIGINT       NOT NULL,
  session_token    VARCHAR(255) NOT NULL,
  ip_address       VARCHAR(45) ,
  user_agent       VARCHAR(MAX)        ,
  device_type      VARCHAR(50) ,
  browser          VARCHAR(50) ,
  created_at       DATETIME2    NOT NULL DEFAULT GETDATE(),
  last_activity_at DATETIME2    NOT NULL DEFAULT GETDATE(),
  expires_at       DATETIME2    NOT NULL,
  logged_out_at    DATETIME2   ,
  CONSTRAINT PK_user_sessions PRIMARY KEY (id)
)
GO

ALTER TABLE user_sessions
  ADD CONSTRAINT UQ_session_token UNIQUE (session_token)
GO

CREATE TABLE users
(
  id                BIGINT                                NOT NULL IDENTITY(1,1),
  email             VARCHAR(255)                          NOT NULL,
  password_hash     VARCHAR(255)                          NOT NULL,
  name              VARCHAR(255)                          NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'business_owner',
  phone             VARCHAR(50)                          ,
  profile_picture   VARCHAR(500)                         ,
  is_active         BIT                               NOT NULL DEFAULT 1,
  email_verified    BIT                               NOT NULL DEFAULT 0,
  email_verified_at DATETIME2                            ,
  last_login_at     DATETIME2                            ,
  created_at        DATETIME2                             NOT NULL DEFAULT GETDATE(),
  updated_at        DATETIME2                             NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_users PRIMARY KEY (id)
)
GO

ALTER TABLE users
  ADD CONSTRAINT UQ_email UNIQUE (email)
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'users', 'column', 'id'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'users', 'column', 'email'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'users', 'column', 'password_hash'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'users', 'column', 'name'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'users', 'column', 'role'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'users', 'column', 'phone'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'users', 'column', 'profile_picture'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'users', 'column', 'is_active'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'users', 'column', 'email_verified'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'users', 'column', 'email_verified_at'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'users', 'column', 'last_login_at'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'users', 'column', 'created_at'
GO

EXECUTE sys.sp_addextendedproperty 'MS_Description',
  '1', 'user', dbo, 'table', 'users', 'column', 'updated_at'
GO

CREATE TABLE vat_reports
(
  id                 BIGINT                         NOT NULL IDENTITY(1,1),
  company_id         BIGINT                         NOT NULL,
  export_id          BIGINT                        ,
  period_start       DATE                           NOT NULL,
  period_end         DATE                           NOT NULL,
  report_type VARCHAR(50) NOT NULL,
  vat_rate           DECIMAL(5,2)                   NOT NULL,
  taxable_amount     DECIMAL(15,2)                  NOT NULL,
  vat_amount         DECIMAL(15,2)                  NOT NULL,
  currency           VARCHAR(3)                     NOT NULL DEFAULT 'USD',
  transaction_count  INT                            NOT NULL DEFAULT 0,
  created_by_user_id BIGINT                         NOT NULL,
  created_at         DATETIME2                      NOT NULL DEFAULT GETDATE(),
  CONSTRAINT PK_vat_reports PRIMARY KEY (id)
)
GO

ALTER TABLE password_reset_tokens
  ADD CONSTRAINT FK_users_TO_password_reset_tokens
    FOREIGN KEY (user_id)
    REFERENCES users (id)
GO

ALTER TABLE user_sessions
  ADD CONSTRAINT FK_users_TO_user_sessions
    FOREIGN KEY (user_id)
    REFERENCES users (id)
GO

ALTER TABLE companies
  ADD CONSTRAINT FK_users_TO_companies
    FOREIGN KEY (created_by_user_id)
    REFERENCES users (id)
GO

ALTER TABLE user_company_access
  ADD CONSTRAINT FK_users_TO_user_company_access
    FOREIGN KEY (user_id)
    REFERENCES users (id)
GO

ALTER TABLE user_company_access
  ADD CONSTRAINT FK_companies_TO_user_company_access
    FOREIGN KEY (company_id)
    REFERENCES companies (id)
GO

ALTER TABLE user_company_access
  ADD CONSTRAINT FK_users_TO_user_company_access1
    FOREIGN KEY (granted_by_user_id)
    REFERENCES users (id)
GO

ALTER TABLE user_company_access
  ADD CONSTRAINT FK_users_TO_user_company_access2
    FOREIGN KEY (revoked_by_user_id)
    REFERENCES users (id)
GO

ALTER TABLE transactions
  ADD CONSTRAINT FK_companies_TO_transactions
    FOREIGN KEY (company_id)
    REFERENCES companies (id)
GO

ALTER TABLE transactions
  ADD CONSTRAINT FK_file_uploads_TO_transactions
    FOREIGN KEY (imported_from_file)
    REFERENCES file_uploads (id)
GO

ALTER TABLE transactions
  ADD CONSTRAINT FK_users_TO_transactions
    FOREIGN KEY (created_by_user_id)
    REFERENCES users (id)
GO

ALTER TABLE invoices
  ADD CONSTRAINT FK_companies_TO_invoices
    FOREIGN KEY (company_id)
    REFERENCES companies (id)
GO

ALTER TABLE invoices
  ADD CONSTRAINT FK_users_TO_invoices
    FOREIGN KEY (verified_by_user_id)
    REFERENCES users (id)
GO

ALTER TABLE invoices
  ADD CONSTRAINT FK_users_TO_invoices1
    FOREIGN KEY (uploaded_by_user_id)
    REFERENCES users (id)
GO

ALTER TABLE invoice_line_items
  ADD CONSTRAINT FK_invoices_TO_invoice_line_items
    FOREIGN KEY (invoice_id)
    REFERENCES invoices (id)
GO

ALTER TABLE invoice_transaction_matches
  ADD CONSTRAINT FK_invoices_TO_invoice_transaction_matches
    FOREIGN KEY (invoice_id)
    REFERENCES invoices (id)
GO

ALTER TABLE invoice_transaction_matches
  ADD CONSTRAINT FK_transactions_TO_invoice_transaction_matches
    FOREIGN KEY (transaction_id)
    REFERENCES transactions (id)
GO

ALTER TABLE invoice_transaction_matches
  ADD CONSTRAINT FK_users_TO_invoice_transaction_matches
    FOREIGN KEY (matched_by_user_id)
    REFERENCES users (id)
GO

ALTER TABLE invoice_transaction_matches
  ADD CONSTRAINT FK_users_TO_invoice_transaction_matches1
    FOREIGN KEY (confirmed_by_user_id)
    REFERENCES users (id)
GO

ALTER TABLE anomalies
  ADD CONSTRAINT FK_companies_TO_anomalies
    FOREIGN KEY (company_id)
    REFERENCES companies (id)
GO

ALTER TABLE anomalies
  ADD CONSTRAINT FK_invoices_TO_anomalies
    FOREIGN KEY (related_invoice_id)
    REFERENCES invoices (id)
GO

ALTER TABLE anomalies
  ADD CONSTRAINT FK_transactions_TO_anomalies
    FOREIGN KEY (related_transaction_id)
    REFERENCES transactions (id)
GO

ALTER TABLE anomalies
  ADD CONSTRAINT FK_invoice_transaction_matches_TO_anomalies
    FOREIGN KEY (related_match_id)
    REFERENCES invoice_transaction_matches (id)
GO

ALTER TABLE anomalies
  ADD CONSTRAINT FK_users_TO_anomalies
    FOREIGN KEY (resolved_by_user_id)
    REFERENCES users (id)
GO

ALTER TABLE exports
  ADD CONSTRAINT FK_companies_TO_exports
    FOREIGN KEY (company_id)
    REFERENCES companies (id)
GO

ALTER TABLE exports
  ADD CONSTRAINT FK_users_TO_exports
    FOREIGN KEY (created_by_user_id)
    REFERENCES users (id)
GO

ALTER TABLE vat_reports
  ADD CONSTRAINT FK_companies_TO_vat_reports
    FOREIGN KEY (company_id)
    REFERENCES companies (id)
GO

ALTER TABLE vat_reports
  ADD CONSTRAINT FK_exports_TO_vat_reports
    FOREIGN KEY (export_id)
    REFERENCES exports (id)
GO

ALTER TABLE vat_reports
  ADD CONSTRAINT FK_users_TO_vat_reports
    FOREIGN KEY (created_by_user_id)
    REFERENCES users (id)
GO

ALTER TABLE ai_feedback
  ADD CONSTRAINT FK_companies_TO_ai_feedback
    FOREIGN KEY (company_id)
    REFERENCES companies (id)
GO

ALTER TABLE ai_feedback
  ADD CONSTRAINT FK_users_TO_ai_feedback
    FOREIGN KEY (user_id)
    REFERENCES users (id)
GO

ALTER TABLE ai_feedback
  ADD CONSTRAINT FK_invoices_TO_ai_feedback
    FOREIGN KEY (related_invoice_id)
    REFERENCES invoices (id)
GO

ALTER TABLE ai_feedback
  ADD CONSTRAINT FK_transactions_TO_ai_feedback
    FOREIGN KEY (related_transaction_id)
    REFERENCES transactions (id)
GO

ALTER TABLE ai_feedback
  ADD CONSTRAINT FK_invoice_transaction_matches_TO_ai_feedback
    FOREIGN KEY (related_match_id)
    REFERENCES invoice_transaction_matches (id)
GO

ALTER TABLE ai_feedback
  ADD CONSTRAINT FK_anomalies_TO_ai_feedback
    FOREIGN KEY (related_anomaly_id)
    REFERENCES anomalies (id)
GO

ALTER TABLE categories
  ADD CONSTRAINT FK_companies_TO_categories
    FOREIGN KEY (company_id)
    REFERENCES companies (id)
GO

ALTER TABLE categories
  ADD CONSTRAINT FK_categories_TO_categories
    FOREIGN KEY (parent_category_id)
    REFERENCES categories (id)
GO

ALTER TABLE file_uploads
  ADD CONSTRAINT FK_companies_TO_file_uploads
    FOREIGN KEY (company_id)
    REFERENCES companies (id)
GO

ALTER TABLE file_uploads
  ADD CONSTRAINT FK_users_TO_file_uploads
    FOREIGN KEY (uploaded_by_user_id)
    REFERENCES users (id)
GO

ALTER TABLE notifications
  ADD CONSTRAINT FK_users_TO_notifications
    FOREIGN KEY (user_id)
    REFERENCES users (id)
GO

ALTER TABLE notifications
  ADD CONSTRAINT FK_companies_TO_notifications
    FOREIGN KEY (company_id)
    REFERENCES companies (id)
GO

ALTER TABLE user_notification_settings
  ADD CONSTRAINT FK_users_TO_user_notification_settings
    FOREIGN KEY (user_id)
    REFERENCES users (id)
GO

ALTER TABLE audit_logs
  ADD CONSTRAINT FK_users_TO_audit_logs
    FOREIGN KEY (user_id)
    REFERENCES users (id)
GO

ALTER TABLE audit_logs
  ADD CONSTRAINT FK_companies_TO_audit_logs
    FOREIGN KEY (company_id)
    REFERENCES companies (id)
GO

ALTER TABLE system_logs
  ADD CONSTRAINT FK_companies_TO_system_logs
    FOREIGN KEY (company_id)
    REFERENCES companies (id)
GO

ALTER TABLE system_logs
  ADD CONSTRAINT FK_users_TO_system_logs
    FOREIGN KEY (user_id)
    REFERENCES users (id)
GO


CREATE INDEX idx_users_email
  ON users (email ASC)
GO

CREATE INDEX idx_users_role
  ON users (role ASC)
GO

CREATE INDEX idx_users_active
  ON users (is_active ASC)
GO

CREATE INDEX idx_password_reset_tokens_token
  ON password_reset_tokens (token ASC)
GO

CREATE INDEX idx_password_reset_tokens_expires
  ON password_reset_tokens (expires_at ASC)
GO

CREATE INDEX idx_user_sessions_user_id
  ON user_sessions (user_id ASC)
GO

CREATE INDEX idx_user_sessions_token
  ON user_sessions (session_token ASC)
GO

CREATE INDEX idx_user_sessions_expires
  ON user_sessions (expires_at ASC)
GO

CREATE INDEX idx_companies_registration
  ON companies (registration_number ASC)
GO

CREATE INDEX idx_companies_name
  ON companies (name ASC)
GO

CREATE INDEX idx_companies_active
  ON companies (is_active ASC)
GO

CREATE INDEX idx_user_company_access_user_id
  ON user_company_access (user_id ASC)
GO

CREATE INDEX idx_user_company_access_company_id
  ON user_company_access (company_id ASC)
GO

CREATE INDEX idx_user_company_access_status
  ON user_company_access (status ASC)
GO

CREATE INDEX idx_transactions_company_id
  ON transactions (company_id ASC)
GO

CREATE INDEX idx_transactions_bank_account_id
  ON transactions (bank_account_id ASC)
GO

CREATE INDEX idx_transactions_date
  ON transactions (transaction_date ASC)
GO

CREATE INDEX idx_transactions_matched
  ON transactions (is_matched ASC)
GO

CREATE INDEX idx_transactions_company_date
  ON transactions (company_id ASC, transaction_date ASC)
GO

CREATE INDEX idx_invoices_company_id
  ON invoices (company_id ASC)
GO

CREATE INDEX idx_invoices_invoice_date
  ON invoices (invoice_date ASC)
GO

CREATE INDEX idx_invoices_vendor
  ON invoices (vendor_name ASC)
GO

CREATE INDEX idx_invoices_status
  ON invoices (status ASC)
GO

CREATE INDEX idx_invoices_company_status_date
  ON invoices (company_id ASC, status ASC, invoice_date ASC)
GO

CREATE INDEX idx_invoice_line_items_invoice_id
  ON invoice_line_items (invoice_id ASC)
GO

CREATE INDEX idx_matches_invoice_id
  ON invoice_transaction_matches (invoice_id ASC)
GO

CREATE INDEX idx_matches_transaction_id
  ON invoice_transaction_matches (transaction_id ASC)
GO

CREATE INDEX idx_matches_status
  ON invoice_transaction_matches (status ASC)
GO

CREATE INDEX idx_matches_invoice_status
  ON invoice_transaction_matches (invoice_id ASC, status ASC)
GO

CREATE INDEX idx_matches_transaction_status
  ON invoice_transaction_matches (transaction_id ASC, status ASC)
GO

CREATE INDEX idx_anomalies_company_id
  ON anomalies (company_id ASC)
GO

CREATE INDEX idx_anomalies_severity
  ON anomalies (severity ASC)
GO

CREATE INDEX idx_anomalies_status
  ON anomalies (status ASC)
GO

CREATE INDEX idx_anomalies_type
  ON anomalies (anomaly_type ASC)
GO

CREATE INDEX idx_anomalies_company_status_severity
  ON anomalies (company_id ASC, status ASC, severity ASC)
GO

CREATE INDEX idx_exports_company_id
  ON exports (company_id ASC)
GO

CREATE INDEX idx_exports_created_at
  ON exports (created_at ASC)
GO

CREATE INDEX idx_exports_status
  ON exports (status ASC)
GO

CREATE INDEX idx_vat_reports_company_id
  ON vat_reports (company_id ASC)
GO

CREATE INDEX idx_vat_reports_period
  ON vat_reports (period_end ASC)
GO

CREATE INDEX idx_ai_feedback_company_id
  ON ai_feedback (company_id ASC)
GO

CREATE INDEX idx_ai_feedback_was_correct
  ON ai_feedback (was_correct ASC)
GO

CREATE INDEX idx_ai_feedback_type
  ON ai_feedback (feedback_type ASC)
GO

CREATE INDEX idx_categories_company_id
  ON categories (company_id ASC)
GO

CREATE INDEX idx_categories_parent_id
  ON categories (parent_category_id ASC)
GO

CREATE INDEX idx_categories_type
  ON categories (category_type ASC)
GO

CREATE INDEX idx_file_uploads_company_id
  ON file_uploads (company_id ASC)
GO

CREATE INDEX idx_file_uploads_uploaded_by
  ON file_uploads (uploaded_by_user_id ASC)
GO

CREATE INDEX idx_file_uploads_purpose
  ON file_uploads (upload_purpose ASC)
GO

CREATE INDEX idx_notifications_user_id
  ON notifications (user_id ASC)
GO

CREATE INDEX idx_notifications_created_at
  ON notifications (created_at ASC)
GO

CREATE INDEX idx_notifications_is_read
  ON notifications (is_read ASC)
GO

CREATE INDEX idx_audit_logs_user_id
  ON audit_logs (user_id ASC)
GO

CREATE INDEX idx_audit_logs_company_id
  ON audit_logs (company_id ASC)
GO

CREATE INDEX idx_audit_logs_entity_type
  ON audit_logs (entity_type ASC)
GO

CREATE INDEX idx_audit_logs_created_at
  ON audit_logs (created_at ASC)
GO

CREATE INDEX idx_system_logs_log_level
  ON system_logs (log_level ASC)
GO

CREATE INDEX idx_system_logs_category
  ON system_logs (category ASC)
GO

CREATE INDEX idx_system_logs_created_at
  ON system_logs (created_at ASC)
GO
