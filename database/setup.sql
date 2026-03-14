-- RinkLink Database Setup (Supabase / PostgreSQL)
-- Run against Supabase SQL Editor or: psql -f database/setup.sql

-- ============================================================
-- ACTIVE TABLES (currently written to by tools)
-- ============================================================

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
    nurture_status TEXT DEFAULT 'new',
    nurture_step INT DEFAULT 0,
    last_email_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Migration: add nurture columns if table already exists
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS nurture_status TEXT DEFAULT 'new';
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS nurture_step INT DEFAULT 0;
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_email_at TIMESTAMP;

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

-- ============================================================
-- CONTEXT TABLES (for agents to reference history)
-- ============================================================

-- Social posts log — tracks posts made via x_post.sh and meta_post.sh
CREATE TABLE IF NOT EXISTS social_posts (
    id SERIAL PRIMARY KEY,
    platform TEXT NOT NULL CHECK (platform IN ('x', 'facebook', 'instagram')),
    action TEXT NOT NULL,
    content TEXT,
    media_url TEXT,
    platform_post_id TEXT,
    agent TEXT DEFAULT 'social',
    metadata JSONB,
    posted_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns — ad and marketing campaigns managed by Ads agent
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    platform TEXT CHECK (platform IN ('meta', 'x', 'email', 'organic')),
    goal TEXT,
    audience TEXT,
    budget_cents INT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed')),
    start_date DATE,
    end_date DATE,
    metrics JSONB,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Growth experiments — A/B tests run by Growth agent
CREATE TABLE IF NOT EXISTS experiments (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    hypothesis TEXT,
    channel TEXT,
    variable_tested TEXT,
    variants JSONB,
    kpi TEXT,
    outcome TEXT,
    status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'running', 'completed', 'cancelled')),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Agent decisions — audit log of autonomous decisions for transparency
CREATE TABLE IF NOT EXISTS agent_decisions (
    id SERIAL PRIMARY KEY,
    agent TEXT NOT NULL CHECK (agent IN ('admin', 'assistant', 'content', 'email', 'ads', 'social', 'growth', 'leads')),
    decision TEXT NOT NULL,
    reasoning TEXT,
    context JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
