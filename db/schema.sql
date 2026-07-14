-- 1. Dimension Tables

CREATE TABLE IF NOT EXISTS dim_district (
    district_id SERIAL PRIMARY KEY,
    district_name VARCHAR(100) UNIQUE NOT NULL,
    range_name VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS dim_crime_category (
    category_id SERIAL PRIMARY KEY,
    major_head VARCHAR(100) NOT NULL,
    minor_head VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS dim_time (
    time_id SERIAL PRIMARY KEY,
    year INT NOT NULL,
    month INT NOT NULL,
    UNIQUE(year, month)
);

-- 2. Fact Tables

CREATE TABLE IF NOT EXISTS fact_crime_stats (
    stat_id SERIAL PRIMARY KEY,
    district_id INT REFERENCES dim_district(district_id) ON DELETE CASCADE,
    category_id INT REFERENCES dim_crime_category(category_id) ON DELETE CASCADE,
    time_id INT REFERENCES dim_time(time_id) ON DELETE CASCADE,
    reported_cases INT DEFAULT 0,
    UNIQUE(district_id, category_id, time_id)
);

CREATE TABLE IF NOT EXISTS fact_administrative_stats (
    admin_stat_id SERIAL PRIMARY KEY,
    district_id INT REFERENCES dim_district(district_id) ON DELETE CASCADE,
    time_id INT REFERENCES dim_time(time_id) ON DELETE CASCADE,
    sakala_receipts INT DEFAULT 0,
    sakala_disposals INT DEFAULT 0,
    sakala_pendency INT DEFAULT 0,
    fir_registered INT DEFAULT 0,
    fir_esign INT DEFAULT 0,
    chargesheet_registered INT DEFAULT 0,
    chargesheet_esign INT DEFAULT 0,
    UNIQUE(district_id, time_id)
);

-- 3. Required Tables for RBAC & Synthetic Features (To be populated later)

CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role_id INT REFERENCES roles(role_id) ON DELETE SET NULL,
    district_id INT REFERENCES dim_district(district_id) ON DELETE SET NULL, -- Data scoping
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fact_crime_stats_district ON fact_crime_stats(district_id);
CREATE INDEX IF NOT EXISTS idx_fact_crime_stats_time ON fact_crime_stats(time_id);
CREATE INDEX IF NOT EXISTS idx_fact_crime_stats_category ON fact_crime_stats(category_id);
