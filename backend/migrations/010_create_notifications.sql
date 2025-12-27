-- Migration: Create notifications table for in-app notification system
-- Date: 2024-12-27
-- Description: Adds a notifications table to support in-app notifications
--              for teachers, principals, and other staff

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    
    -- Reference to related entity (optional)
    reference_type VARCHAR(50),
    reference_id UUID
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_reference ON notifications(reference_type, reference_id);

-- Add comment to table
COMMENT ON TABLE notifications IS 'In-app notifications for users';
COMMENT ON COLUMN notifications.type IS 'Notification type: marks_submitted, marks_approved, marks_rejected, attendance_reminder, etc.';
COMMENT ON COLUMN notifications.data IS 'JSON data with additional context (e.g., class name, subject, student count)';
COMMENT ON COLUMN notifications.reference_type IS 'Type of related entity (marksheet, attendance, etc.)';
COMMENT ON COLUMN notifications.reference_id IS 'ID of related entity';
