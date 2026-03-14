-- RinkLink Database Setup (Supabase / PostgreSQL)
-- Schema reflecting actual tool usage as of 2026-03-13

-- Leads table (used by lead_insert.js)
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    role TEXT,
    association TEXT,
    organization_name TEXT,
    organization_url TEXT,
    source_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Emails table (used by email_send.js)
CREATE TABLE IF NOT EXISTS emails (
    id SERIAL PRIMARY KEY,
    to_email TEXT NOT NULL,
    subject TEXT,
    status TEXT DEFAULT 'sent',
    sent_at TIMESTAMP,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
