-- Initialize database for BlueBit application

-- Drop tables if they exist (use with caution in production)
DROP TABLE IF EXISTS job_interaction_stats;
DROP TABLE IF EXISTS jobs;
DROP TABLE IF EXISTS users;

-- Create users table with updated authentication fields
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(200) NOT NULL,
    phone_number VARCHAR(20),
    email_verified BOOLEAN DEFAULT FALSE,
    reset_token VARCHAR(200),
    reset_token_expires DATE,
    preferences JSONB,
    recommended_job_ids JSONB,
    interested_job_ids JSONB,
    not_interested_job_ids JSONB,
    saved_jobs_ids JSONB,
    is_pro BOOLEAN DEFAULT FALSE,
    resume_text TEXT,
    resume_path VARCHAR(500),
    resume_keywords JSONB,
    pro_expiration_date DATE,
    preferred_address VARCHAR(500),
    bookmarks JSONB,
    autofill_limit FLOAT DEFAULT 50
);

-- Create jobs table
CREATE TABLE jobs (
    id VARCHAR(100) PRIMARY KEY,
    site VARCHAR(50) NOT NULL,
    job_url VARCHAR(500) NOT NULL,
    job_url_direct VARCHAR(500),
    title VARCHAR(200) NOT NULL,
    company VARCHAR(200) NOT NULL,
    location VARCHAR(200),
    date_posted DATE,
    job_type VARCHAR(50),
    salary_source VARCHAR(50),
    interval VARCHAR(50),
    min_amount FLOAT,
    max_amount FLOAT,
    currency VARCHAR(10),
    is_remote BOOLEAN,
    description TEXT,
    last_updated DATE DEFAULT CURRENT_DATE,
    company_logo VARCHAR(500)
);

-- Create job_interaction_stats table
CREATE TABLE job_interaction_stats (
    job_id VARCHAR(100) PRIMARY KEY REFERENCES jobs(id),
    like_count INTEGER DEFAULT 0,
    dislike_count INTEGER DEFAULT 0,
    bookmark_count INTEGER DEFAULT 0,
    last_updated DATE DEFAULT CURRENT_DATE
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_jobs_company ON jobs(company);
CREATE INDEX idx_jobs_title ON jobs(title);
CREATE INDEX idx_jobs_date_posted ON jobs(date_posted);

-- Insert a default admin user (password: admin123)
INSERT INTO users (
    email, username, password_hash, email_verified, is_pro, autofill_limit
) VALUES (
    'admin@bluebit.com', 
    'admin', 
    '$2b$12$7yRt0REy5XQD1Z8mJ8k6xexCO3t0njNUG4m1xMPxI6ZCrDsrS1tHe', 
    TRUE, 
    TRUE, 
    100
);
