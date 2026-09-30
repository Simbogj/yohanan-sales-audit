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
DROP TRIGGER IF EXISTS trigger_users_updated_at        ON users;
DROP TRIGGER IF EXISTS trigger_products_updated_at     ON products;
DROP TRIGGER IF EXISTS trigger_sales_updated_at        ON sales;
DROP TRIGGER IF EXISTS trigger_daily_audits_updated_at ON daily_audits;

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


-- =============================================================================
-- PURCHASES TABLE  (raw material / inventory purchases)
-- =============================================================================
CREATE TABLE IF NOT EXISTS purchases (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
    supplier_name VARCHAR(100),
    item_name     VARCHAR(100) NOT NULL,
    category      VARCHAR(30)  NOT NULL DEFAULT 'OTHER',
    quantity      NUMERIC(10, 2) NOT NULL CHECK (quantity > 0),
    unit          VARCHAR(20)  NOT NULL DEFAULT 'unit',
    unit_cost     NUMERIC(10, 2) NOT NULL CHECK (unit_cost >= 0),
    total_cost    NUMERIC(10, 2) NOT NULL CHECK (total_cost >= 0),
    recorded_by   UUID NOT NULL REFERENCES users(id),
    note          TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purchases_purchase_date ON purchases(purchase_date);
CREATE INDEX IF NOT EXISTS idx_purchases_recorded_by   ON purchases(recorded_by);

DROP TRIGGER IF EXISTS trigger_purchases_updated_at ON purchases;
CREATE TRIGGER trigger_purchases_updated_at
    BEFORE UPDATE ON purchases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- EXPENSES TABLE  (general operational expenses)
-- =============================================================================
CREATE TABLE IF NOT EXISTS expenses (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category     VARCHAR(50) NOT NULL DEFAULT 'OTHER',
    description  VARCHAR(200) NOT NULL,
    amount       NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    recorded_by  UUID NOT NULL REFERENCES users(id),
    note         TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_recorded_by  ON expenses(recorded_by);

DROP TRIGGER IF EXISTS trigger_expenses_updated_at ON expenses;
CREATE TRIGGER trigger_expenses_updated_at
    BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- OTHER_SALES TABLE  (manual / ad-hoc sales not in product catalogue)
-- =============================================================================
CREATE TABLE IF NOT EXISTS other_sales (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    item_name    VARCHAR(100) NOT NULL,
    quantity     INTEGER NOT NULL CHECK (quantity > 0),
    unit_price   NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0),
    total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
    waiter_id    UUID NOT NULL REFERENCES users(id),
    status       VARCHAR(10) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'DISPUTED')),
    note         TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_other_sales_sale_date  ON other_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_other_sales_waiter_id  ON other_sales(waiter_id);
CREATE INDEX IF NOT EXISTS idx_other_sales_status     ON other_sales(status);

DROP TRIGGER IF EXISTS trigger_other_sales_updated_at ON other_sales;
CREATE TRIGGER trigger_other_sales_updated_at
    BEFORE UPDATE ON other_sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- UNPAID_SALES TABLE  (credit / tab sales)
-- =============================================================================
CREATE TABLE IF NOT EXISTS unpaid_sales (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id        UUID REFERENCES sales(id) ON DELETE SET NULL,
    other_sale_id  UUID REFERENCES other_sales(id) ON DELETE SET NULL,
    customer_name  VARCHAR(100) NOT NULL,
    amount_owed    NUMERIC(10, 2) NOT NULL CHECK (amount_owed >= 0),
    sale_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date       DATE,
    paid           BOOLEAN NOT NULL DEFAULT FALSE,
    paid_at        TIMESTAMPTZ,
    recorded_by    UUID NOT NULL REFERENCES users(id),
    note           TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_unpaid_sales_sale_date     ON unpaid_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_unpaid_sales_paid          ON unpaid_sales(paid);
CREATE INDEX IF NOT EXISTS idx_unpaid_sales_recorded_by   ON unpaid_sales(recorded_by);

DROP TRIGGER IF EXISTS trigger_unpaid_sales_updated_at ON unpaid_sales;
CREATE TRIGGER trigger_unpaid_sales_updated_at
    BEFORE UPDATE ON unpaid_sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Extend DAILY_AUDITS with profit columns (safe — adds only if missing)
-- =============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'daily_audits' AND column_name = 'total_purchases'
    ) THEN
        ALTER TABLE daily_audits ADD COLUMN total_purchases  NUMERIC(10,2) NOT NULL DEFAULT 0;
        ALTER TABLE daily_audits ADD COLUMN total_expenses   NUMERIC(10,2) NOT NULL DEFAULT 0;
        ALTER TABLE daily_audits ADD COLUMN total_other_sales NUMERIC(10,2) NOT NULL DEFAULT 0;
        ALTER TABLE daily_audits ADD COLUMN total_unpaid     NUMERIC(10,2) NOT NULL DEFAULT 0;
        ALTER TABLE daily_audits ADD COLUMN net_profit       NUMERIC(10,2) NOT NULL DEFAULT 0;
    END IF;
END
$$;
