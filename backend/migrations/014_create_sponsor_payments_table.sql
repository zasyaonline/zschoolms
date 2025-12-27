-- Migration: Create sponsor_payments table for payment recording
-- Part of Flow 8: Sponsorship Renewal Process

-- Create sponsor_payments table
CREATE TABLE IF NOT EXISTS sponsor_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relationship to sponsorship
    sponsorship_id UUID NOT NULL REFERENCES student_sponsor_mapping(id) ON DELETE RESTRICT,
    sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE RESTRICT,
    
    -- Payment details
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    payment_date DATE NOT NULL,
    transaction_reference VARCHAR(100),
    payment_method VARCHAR(50), -- bank_transfer, cheque, cash, online, etc.
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'rejected', 'refunded')),
    
    -- Receipt information
    receipt_number VARCHAR(50) UNIQUE,
    receipt_generated_at TIMESTAMP WITH TIME ZONE,
    receipt_s3_key VARCHAR(500),
    
    -- Notes and metadata
    notes TEXT,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- Renewal tracking
    is_renewal_payment BOOLEAN DEFAULT true,
    previous_end_date DATE,
    new_end_date DATE,
    
    -- Audit fields
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_sponsor_payments_sponsorship ON sponsor_payments(sponsorship_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_payments_sponsor ON sponsor_payments(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_sponsor_payments_date ON sponsor_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_sponsor_payments_status ON sponsor_payments(status);
CREATE INDEX IF NOT EXISTS idx_sponsor_payments_receipt ON sponsor_payments(receipt_number);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_sponsor_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sponsor_payments_updated_at ON sponsor_payments;
CREATE TRIGGER trigger_sponsor_payments_updated_at
    BEFORE UPDATE ON sponsor_payments
    FOR EACH ROW
    EXECUTE FUNCTION update_sponsor_payments_updated_at();

-- Add comment
COMMENT ON TABLE sponsor_payments IS 'Records sponsor payments for renewals with receipt generation';
