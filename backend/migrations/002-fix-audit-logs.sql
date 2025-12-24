-- Drop and recreate audit_logs table with correct structure

DROP TABLE IF EXISTS audit_logs CASCADE;

-- Create ENUM types
DROP TYPE IF EXISTS audit_action CASCADE;
CREATE TYPE audit_action AS ENUM (
  'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
  'PASSWORD_RESET', 'PASSWORD_CHANGED', 'MFA_ENABLED', 'MFA_DISABLED',
  'MARKS_APPROVED', 'MARKS_REJECTED', 'REPORT_GENERATED',
  'FILE_UPLOADED', 'FILE_DELETED', 'USER_ACTIVATED', 'USER_DEACTIVATED',
  'ROLE_CHANGED'
);

DROP TYPE IF EXISTS audit_status CASCADE;
CREATE TYPE audit_status AS ENUM ('SUCCESS', 'FAILURE');

-- Create audit_logs table
CREATE TABLE audit_logs (
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
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_status ON audit_logs(status);
CREATE INDEX idx_audit_logs_ip_address ON audit_logs(ip_address);

COMMENT ON TABLE audit_logs IS 'Tracks all critical actions in the system';
