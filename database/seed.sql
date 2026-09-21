-- =============================================================================
-- Yohanan Coffee Sales Audit System - Seed Data
-- Development passwords (CHANGE BEFORE PRODUCTION):
--   owner    → password: owner123
--   hana     → password: waiter123
--   sara     → password: waiter123
--   abel     → password: waiter123
--
-- Passwords below are bcrypt hashes of the above strings.
-- Generate fresh hashes before deploying to production.
-- =============================================================================

-- Clear existing data (order matters due to FK constraints)
TRUNCATE TABLE audit_records CASCADE;
TRUNCATE TABLE daily_audits CASCADE;
TRUNCATE TABLE sales CASCADE;
TRUNCATE TABLE products CASCADE;
TRUNCATE TABLE users CASCADE;

-- =============================================================================
-- USERS
-- =============================================================================
INSERT INTO users (id, full_name, username, password_hash, role, active) VALUES
(
    uuid_generate_v4(),
    'Yohanan Owner',
    'owner',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj2NJb0/2hWm',
    'OWNER',
    TRUE
),
(
    uuid_generate_v4(),
    'Hana Girma',
    'hana',
    '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'WAITER',
    TRUE
),
(
    uuid_generate_v4(),
    'Sara Tadesse',
    'sara',
    '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'WAITER',
    TRUE
),
(
    uuid_generate_v4(),
    'Abel Bekele',
    'abel',
    '$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'WAITER',
    TRUE
);

-- =============================================================================
-- PRODUCTS
-- =============================================================================
INSERT INTO products (id, product_code, name, category, price, active) VALUES
(uuid_generate_v4(), 'COF-001', 'Espresso',       'COFFEE',     60.00, TRUE),
(uuid_generate_v4(), 'COF-002', 'Steamed Coffee',  'COFFEE',     50.00, TRUE),
(uuid_generate_v4(), 'COF-003', 'Macchiato',       'COFFEE',     80.00, TRUE),
(uuid_generate_v4(), 'COF-004', 'Spris',           'COFFEE',     60.00, TRUE),
(uuid_generate_v4(), 'NCF-001', 'Milk',            'NON_COFFEE', 80.00, TRUE),
(uuid_generate_v4(), 'NCF-002', 'Tea',             'NON_COFFEE', 35.00, TRUE),
(uuid_generate_v4(), 'NCF-003', 'Ginger Tea',      'NON_COFFEE', 50.00, TRUE),
(uuid_generate_v4(), 'NCF-004', 'Peanut Tea',      'NON_COFFEE', 60.00, TRUE),
(uuid_generate_v4(), 'NCF-005', 'Green Tea',       'NON_COFFEE', 60.00, TRUE),
(uuid_generate_v4(), 'NCF-006', 'Soft Drink',      'NON_COFFEE', 80.00, TRUE);
