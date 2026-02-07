-- ============================================
-- COMPLETE SETUP GUIDE FOR 4 FIXED USERS
-- ============================================
-- 
-- Step 1: Run this SQL in Supabase SQL Editor
-- Step 2: Create 4 Auth users in Authentication → Users
-- 
-- After this, the login will work with company info!
-- ============================================

-- STEP 1: Make sure companies table exists and has data
-- (This should already be done from 001_create_companies.sql)
-- Verify by running:
SELECT id, name FROM companies WHERE is_active = true ORDER BY name;

-- STEP 2: Make sure users table exists
-- (Run 002_create_users.sql if not already done)
-- This creates the users table and inserts 4 admin users

-- STEP 3: Verify the 4 users exist with company IDs
SELECT u.email, u.name, u.role, c.name as company_name
FROM users u
JOIN companies c ON u.company_id = c.id
ORDER BY c.name;

-- Expected output:
-- email               | name  | role  | company_name
-- --------------------|-------|-------|----------------------
-- admin@arfa.com      | Admin | admin | ARFA TRADING COMPANY
-- admin@qstraders.com | Admin | admin | Q.S TRADERS
-- admin@qasimsons.com | Admin | admin | QASIM & SONS
-- admin@qasim.com     | Admin | admin | QASIM SEWING MACHINE

-- ============================================
-- NOW GO TO SUPABASE DASHBOARD
-- ============================================
-- 
-- 1. Go to Authentication → Users → Add User
-- 2. Create these 4 users (emails must EXACTLY match above):
--
--    Email: admin@qasim.com
--    Password: Inventory@2024!
--    ✅ Auto Confirm User
--
--    Email: admin@qstraders.com
--    Password: Inventory@2024!
--    ✅ Auto Confirm User
--
--    Email: admin@arfa.com
--    Password: Inventory@2024!
--    ✅ Auto Confirm User
--
--    Email: admin@qasimsons.com
--    Password: Inventory@2024!
--    ✅ Auto Confirm User
--
-- ============================================
-- THAT'S IT! 
-- ============================================
-- 
-- The auth service automatically looks up company info from
-- the users table when you login. No metadata needed!
-- 
-- Test by logging in to your app with:
--   Email: admin@qasim.com
--   Password: Inventory@2024!
-- 
-- The system will:
-- 1. Authenticate with Supabase Auth ✓
-- 2. Look up company from users table ✓
-- 3. Return user with company_id and company_name ✓
-- ============================================
