-- Migration: Add authentication tables
-- Date: 2025-01-27
-- Description: Add RefreshToken and AuditLog tables, extend User table with MFA fields

-- Extend users table with MFA fields
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS mfa_secret TEXT,
ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS mfa_backup_codes TEXT[];

-- Create refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_revoked BOOLEAN DEFAULT FALSE NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for refresh_tokens
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked);

-- Create audit_logs table
CREATE TYPE audit_action AS ENUM (
  'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
  'PASSWORD_RESET', 'PASSWORD_CHANGED', 'MFA_ENABLED', 'MFA_DISABLED',
  'MARKS_APPROVED', 'MARKS_REJECTED', 'REPORT_GENERATED',
  'FILE_UPLOADED', 'FILE_DELETED', 'USER_ACTIVATED', 'USER_DEACTIVATED',
  'ROLE_CHANGED'
);

CREATE TYPE audit_status AS ENUM ('SUCCESS', 'FAILURE');

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE,
  action audit_action NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status audit_status DEFAULT 'SUCCESS' NOT NULL,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);

-- Create trigger for updated_at on refresh_tokens
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_refresh_tokens_updated_at ON refresh_tokens;
CREATE TRIGGER update_refresh_tokens_updated_at
  BEFORE UPDATE ON refresh_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE refresh_tokens IS 'Stores JWT refresh tokens for authentication';
COMMENT ON TABLE audit_logs IS 'Tracks all critical actions in the system';
COMMENT ON COLUMN users.mfa_secret IS 'TOTP secret for MFA (encrypted)';
COMMENT ON COLUMN users.mfa_enabled IS 'Whether MFA is enabled for this user';
COMMENT ON COLUMN users.mfa_backup_codes IS 'Array of backup codes for MFA recovery';

