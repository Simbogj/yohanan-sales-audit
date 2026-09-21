-- =============================================================================
-- Yohanan Coffee Sales Audit System - Database Schema
-- PostgreSQL
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- USERS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name     VARCHAR(100) NOT NULL,
    username      VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(10) NOT NULL CHECK (role IN ('OWNER', 'WAITER')),
    active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- PRODUCTS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS products (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_code VARCHAR(20) NOT NULL UNIQUE,
    name         VARCHAR(100) NOT NULL,
    category     VARCHAR(20) NOT NULL CHECK (category IN ('COFFEE', 'NON_COFFEE', 'BREAKFAST', 'FOOD', 'OTHER')),
    price        NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- SALES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS sales (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_number  VARCHAR(30) NOT NULL UNIQUE,
    waiter_id    UUID NOT NULL REFERENCES users(id),
    product_id   UUID NOT NULL REFERENCES products(id),
    sale_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    sale_time    TIME NOT NULL DEFAULT CURRENT_TIME,
    status       VARCHAR(10) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'DISPUTED')),
    quantity     INTEGER NOT NULL CHECK (quantity > 0),
    unit_price   NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- AUDIT RECORDS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit_records (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id     UUID NOT NULL REFERENCES sales(id),
    auditor_id  UUID NOT NULL REFERENCES users(id),
    result      VARCHAR(10) NOT NULL CHECK (result IN ('VERIFIED', 'DISPUTED')),
    note        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- DAILY AUDITS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS daily_audits (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_date      DATE NOT NULL UNIQUE,
    total_sales     INTEGER NOT NULL DEFAULT 0,
    total_amount    NUMERIC(10, 2) NOT NULL DEFAULT 0,
    verified_count  INTEGER NOT NULL DEFAULT 0,
    disputed_count  INTEGER NOT NULL DEFAULT 0,
    pending_count   INTEGER NOT NULL DEFAULT 0,
    closed_by       UUID REFERENCES users(id),
    closed_at       TIMESTAMPTZ,
    status          VARCHAR(6) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Sales indexes (frequently queried)
CREATE INDEX IF NOT EXISTS idx_sales_sale_date   ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_waiter_id   ON sales(waiter_id);
CREATE INDEX IF NOT EXISTS idx_sales_product_id  ON sales(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_status      ON sales(status);
CREATE INDEX IF NOT EXISTS idx_sales_created_at  ON sales(created_at);

-- Audit records indexes
CREATE INDEX IF NOT EXISTS idx_audit_records_sale_id    ON audit_records(sale_id);
CREATE INDEX IF NOT EXISTS idx_audit_records_auditor_id ON audit_records(auditor_id);

-- =============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach trigger to tables with updated_at
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_sales_updated_at
    BEFORE UPDATE ON sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_daily_audits_updated_at
    BEFORE UPDATE ON daily_audits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
