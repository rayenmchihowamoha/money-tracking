-- ============================================================
-- Family Money Tracker — Case-insensitive unique profile names
--
-- Prevents "moha" and "Moha" (or any other capitalization variant)
-- from existing as two separate profiles.
--
-- NOTE: if two profiles already differ only by capitalization, this
-- migration will fail with a unique-violation error. If that happens,
-- rename one of them first (directly in the database), then re-deploy.
-- ============================================================

CREATE UNIQUE INDEX idx_profiles_name_lower ON profiles (lower(name));
