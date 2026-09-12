-- Admin profile: persistent notification & privacy preferences
-- Adds JSONB preference columns to profiles so the /admin/profile page can
-- persist user-configurable settings server-side instead of relying on
-- ephemeral client state.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS notification_prefs JSONB
    NOT NULL DEFAULT '{"email":true,"push":true,"order_updates":true,"security_alerts":true}'::jsonb,
  ADD COLUMN IF NOT EXISTS privacy_prefs JSONB
    NOT NULL DEFAULT '{"profile_visible":true,"activity_visible":false,"show_email":false}'::jsonb;

COMMENT ON COLUMN profiles.notification_prefs IS 'Per-user notification channel toggles surfaced by the admin profile page.';
COMMENT ON COLUMN profiles.privacy_prefs IS 'Per-user privacy visibility toggles surfaced by the admin profile page.';

-- Row-level security already grants admin/superadmin roles full access to the
-- profiles table (see 20260905_auth_production_refinements.sql), so the new
-- columns inherit those same policies without additional configuration.
