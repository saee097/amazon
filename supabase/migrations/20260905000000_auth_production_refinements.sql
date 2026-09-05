-- Production refinements for the auth flow
-- Adds columns for production-level registration, last-login tracking,
-- and explicit admin policies on the profiles table.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Backfill display_name
UPDATE profiles
SET display_name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
WHERE display_name IS NULL OR display_name = '';

-- Helpful indexes for login lookups
CREATE INDEX IF NOT EXISTS idx_profiles_username_lower ON profiles (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON profiles (LOWER(email));

-- Allow admins/superadmins to read and update all profiles
DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;
CREATE POLICY "Admins read all profiles" ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
  );

DROP POLICY IF EXISTS "Admins update all profiles" ON profiles;
CREATE POLICY "Admins update all profiles" ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin', 'superadmin')
    )
  );

-- Backstop: allow a user to insert their own profile row if the trigger
-- didn't fire (some migration histories had a gap here).
DROP POLICY IF EXISTS "Users insert own profile" ON profiles;
CREATE POLICY "Users insert own profile" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
