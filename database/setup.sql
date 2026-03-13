-- Autonomous Marketing/Sales Team Database Setup
-- Run: psql -U <user> -d <dbname> -f database/setup.sql

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    organization TEXT,
    contact_name TEXT,
    email TEXT,
    twitter TEXT,
    facebook TEXT,
    status TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Emails table
CREATE TABLE IF NOT EXISTS emails (
    id SERIAL PRIMARY KEY,
    lead_id INT REFERENCES leads(id),
    subject TEXT,
    body TEXT,
    sent_at TIMESTAMP,
    replied BOOLEAN DEFAULT FALSE
);

-- Social posts table
CREATE TABLE IF NOT EXISTS social_posts (
    id SERIAL PRIMARY KEY,
    platform TEXT,
    content TEXT,
    posted_at TIMESTAMP,
    likes INT,
    shares INT
);

-- GitHub tasks table (aligned with Projects board fields)
CREATE TABLE IF NOT EXISTS github_tasks (
    id SERIAL PRIMARY KEY,
    issue_number INT,
    project_item_id TEXT,
    title TEXT,
    agent TEXT CHECK (agent IN ('admin','assistant','content','email','ads','social','growth','leads')),
    status TEXT CHECK (status IN ('Backlog','This Week','In Progress','Review','Done')),
    priority TEXT CHECK (priority IN ('H','M','L')),
    category TEXT CHECK (category IN ('Campaign','Content','Email','Experiment','Lead','System','Report')),
    week TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    id SERIAL PRIMARY KEY,
    name TEXT,
    goal TEXT,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    notes TEXT
);

-- Agent decisions table
CREATE TABLE IF NOT EXISTS agent_decisions (
    id SERIAL PRIMARY KEY,
    agent_role TEXT,
    decision TEXT,
    context TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);
