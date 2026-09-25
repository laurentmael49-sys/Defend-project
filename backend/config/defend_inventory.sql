-- ============================================================
--  DEFEND PROJECT - Full Database Schema & Sample Data
--  Import this file via: phpMyAdmin > Import > defend_inventory.sql
--  Or run: mysql -u root -p < defend_inventory.sql
-- ============================================================

-- 1. Create and select database
CREATE DATABASE IF NOT EXISTS defend_inventory
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE defend_inventory;

-- ============================================================
--  TABLES
-- ============================================================

-- Users
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100)  NOT NULL,
  email      VARCHAR(150)  NOT NULL UNIQUE,
  password   VARCHAR(255)  NOT NULL,
  phone      VARCHAR(20)   DEFAULT NULL,
  role       ENUM('Admin','IT Manager','Employee') NOT NULL DEFAULT 'Employee',
  status     ENUM('Active','Suspended') NOT NULL DEFAULT 'Active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id   INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

-- Assets
CREATE TABLE IF NOT EXISTS assets (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  category    VARCHAR(100) NOT NULL,
  status      ENUM('available','loaned','maintenance') NOT NULL DEFAULT 'available',
  price       DECIMAL(10,2) DEFAULT 0.00,
  description TEXT,
  serial_no   VARCHAR(100),
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Requests
CREATE TABLE IF NOT EXISTS requests (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  asset_id   INT NOT NULL,
  start_date DATE NOT NULL,
  end_date   DATE NOT NULL,
  reason     TEXT,
  status     ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- Loans
CREATE TABLE IF NOT EXISTS loans (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT NOT NULL,
  asset_id   INT NOT NULL,
  start_date DATE NOT NULL,
  end_date   DATE,
  reason     TEXT,
  returned   TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT,
  action     VARCHAR(100) NOT NULL,
  details    TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================================
--  SAMPLE DATA
-- ============================================================

-- Categories
INSERT INTO categories (name) VALUES
  ('Computer'),
  ('Monitor'),
  ('Phone'),
  ('Network'),
  ('Peripheral'),
  ('Furniture');

-- Users
-- Passwords are bcrypt hashes of "password123"
INSERT INTO users (name, email, password, role, status) VALUES
  ('Admin User',    'admin@defend.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin',      'Active'),
  ('IT Manager',    'manager@defend.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'IT Manager', 'Active'),
  ('Alice Williams','alice@defend.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Employee',   'Active'),
  ('David Chen',    'david@defend.com',   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Employee',   'Active'),
  ('Jean Martin',   'jean@defend.com',    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Employee',   'Suspended');

-- Assets
INSERT INTO assets (name, category, status, price, description, serial_no) VALUES
  ('MacBook Pro 16"',      'Computer',   'loaned',       1500000, 'Apple MacBook Pro 16-inch, M3 chip', 'SN-MBP-001'),
  ('Dell XPS 15',          'Computer',   'available',    1200000, 'Dell XPS 15 9530, Intel i9',         'SN-XPS-002'),
  ('ThinkPad X1 Carbon',   'Computer',   'available',    1100000, 'Lenovo ThinkPad X1, 14-inch',        'SN-TPX-003'),
  ('HP EliteBook 840',     'Computer',   'maintenance',  900000,  'HP EliteBook 840 G10',               'SN-HPE-004'),
  ('iPhone 15 Pro',        'Phone',      'loaned',       750000,  'Apple iPhone 15 Pro, 256GB',         'SN-IPH-005'),
  ('Samsung Galaxy S24',   'Phone',      'available',    650000,  'Samsung Galaxy S24 Ultra',           'SN-SGS-006'),
  ('Dell UltraSharp 27"',  'Monitor',    'available',    350000,  'Dell UltraSharp 27" 4K Monitor',     'SN-DUM-007'),
  ('LG 32UN880',           'Monitor',    'loaned',       400000,  'LG 32" 4K UHD Ergo Monitor',         'SN-LGM-008'),
  ('Cisco SG350-28',       'Network',    'available',    550000,  'Cisco 28-port Gigabit Switch',       'SN-CSW-009'),
  ('TP-Link Deco XE75',    'Network',    'available',    280000,  'WiFi 6E Mesh System (3-pack)',       'SN-TPL-010'),
  ('Logitech MX Master 3', 'Peripheral', 'available',    75000,   'Logitech MX Master 3 Mouse',         'SN-LMX-011'),
  ('Keychron Q1 Pro',      'Peripheral', 'available',    95000,   'Keychron Q1 Pro Mechanical Keyboard','SN-KQP-012');

-- Loans (some active, one returned)
INSERT INTO loans (user_id, asset_id, start_date, end_date, reason, returned) VALUES
  (3, 1, '2026-08-01', '2026-08-31', 'Remote work project development',      0),
  (4, 8, '2026-08-05', '2026-08-25', 'Design team presentation needs',       0),
  (3, 5, '2026-07-15', '2026-08-15', 'Field sales work - client visits',     0),
  (4, 2, '2026-07-01', '2026-07-31', 'Training period laptop',               1);

-- Requests
INSERT INTO requests (user_id, asset_id, start_date, end_date, reason, status) VALUES
  (3, 3,  '2026-08-20', '2026-09-20', 'Need laptop for upcoming project sprint',  'Pending'),
  (4, 11, '2026-08-22', '2026-09-30', 'Mouse for new workstation setup',          'Pending'),
  (3, 6,  '2026-07-10', '2026-07-30', 'Demo device for client meeting',           'Approved'),
  (4, 9,  '2026-07-01', '2026-07-15', 'Network setup for new office floor',       'Rejected');

-- Audit Logs
INSERT INTO audit_logs (user_id, action, details) VALUES
  (1, 'System Startup',   'Application initialized successfully'),
  (1, 'Add Asset',        'Added MacBook Pro 16" to inventory'),
  (1, 'Add Asset',        'Added Dell XPS 15 to inventory'),
  (2, 'Approve Request',  'Approved loan request #3 for Alice Williams'),
  (2, 'Reject Request',   'Rejected loan request #4 - Network device not available'),
  (2, 'Create Loan',      'Issued MacBook Pro 16" to Alice Williams (Loan #1)'),
  (2, 'Create Loan',      'Issued LG 32" Monitor to David Chen (Loan #2)'),
  (3, 'Submit Request',   'Employee Alice submitted request for ThinkPad X1 Carbon'),
  (4, 'Submit Request',   'Employee David submitted request for Logitech MX Master 3'),
  (2, 'Process Return',   'Dell XPS 15 returned by David Chen - Loan #4 closed');
