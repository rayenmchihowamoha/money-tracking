-- ============================================================
-- Family Money Tracker — Database Schema
-- Target: Netlify Database (GA)
--
-- NOTE: This file is kept for reference only. The copy that actually
-- gets applied automatically on deploy lives at:
--   netlify/database/migrations/0001_initial_schema/migration.sql
-- Edit that one (and add new migration folders for future changes) —
-- editing this file alone does nothing.
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto; -- for gen_random_uuid()

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  token UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE currency_type AS ENUM ('DA', 'USD', 'EUR', 'USDT');

CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  currency currency_type NOT NULL,
  archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE transaction_type AS ENUM ('deposit', 'withdrawal');

CREATE TYPE debt_direction AS ENUM ('i_owe', 'owed_to_me');
CREATE TYPE debt_status AS ENUM ('open', 'partial', 'paid');
CREATE TYPE due_type AS ENUM ('date', 'soon', 'unsure', 'later');

CREATE TABLE debts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  direction debt_direction NOT NULL,
  person TEXT NOT NULL,
  currency currency_type NOT NULL,
  total_amount NUMERIC(14,2) NOT NULL,
  amount_settled NUMERIC(14,2) NOT NULL DEFAULT 0,
  status debt_status NOT NULL DEFAULT 'open',
  date_created DATE NOT NULL,
  due_type due_type NOT NULL,
  due_date DATE,
  origin_wallet_id UUID REFERENCES wallets(id),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type transaction_type NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  date DATE NOT NULL,
  reason TEXT,
  source_or_target TEXT,
  denomination_breakdown JSONB,
  linked_debt_id UUID REFERENCES debts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE debt_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL,
  date DATE NOT NULL,
  wallet_id UUID REFERENCES wallets(id),
  transaction_id UUID REFERENCES transactions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wallets_profile ON wallets(profile_id);
CREATE INDEX idx_transactions_wallet ON transactions(wallet_id);
CREATE INDEX idx_debts_profile ON debts(profile_id);
CREATE INDEX idx_debt_payments_debt ON debt_payments(debt_id);
CREATE INDEX idx_sessions_profile ON sessions(profile_id);
-- ============================================================
-- Family Money Tracker — Add wallet-to-wallet transfers
-- ============================================================

CREATE TABLE transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_wallet_id UUID NOT NULL REFERENCES wallets(id),
  to_wallet_id UUID NOT NULL REFERENCES wallets(id),
  amount NUMERIC(14,2) NOT NULL,
  currency currency_type NOT NULL,
  date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE transactions
  ADD COLUMN linked_transfer_id UUID REFERENCES transfers(id) ON DELETE CASCADE;

CREATE INDEX idx_transfers_profile ON transfers(profile_id);
CREATE INDEX idx_transactions_linked_transfer ON transactions(linked_transfer_id);

-- ============================================================
-- Repair double-encoded denomination_breakdown (see migration 0003)
-- ============================================================
UPDATE transactions
SET denomination_breakdown = (denomination_breakdown #>> '{}')::jsonb
WHERE jsonb_typeof(denomination_breakdown) = 'string';
-- ============================================================
-- Family Money Tracker — Allow permanently deleting a wallet
--
-- Previously wallets could only be archived (soft-hidden), never
-- actually removed, because deleting one would leave dangling
-- references in debts / debt_payments / transfers. This adjusts
-- those foreign keys so a hard delete works cleanly:
--   - debts.origin_wallet_id / debt_payments.wallet_id -> SET NULL
--     (the debt itself is kept, it just "forgets" which wallet the
--     money originally came from)
--   - transfers.from_wallet_id / to_wallet_id -> CASCADE
--     (a transfer record doesn't make sense if one of its two
--     wallets no longer exists, so it's removed along with its two
--     linked transaction rows, which already cascade from transfers)
-- ============================================================

ALTER TABLE debts DROP CONSTRAINT IF EXISTS debts_origin_wallet_id_fkey;
ALTER TABLE debts
  ADD CONSTRAINT debts_origin_wallet_id_fkey
  FOREIGN KEY (origin_wallet_id) REFERENCES wallets(id) ON DELETE SET NULL;

ALTER TABLE debt_payments DROP CONSTRAINT IF EXISTS debt_payments_wallet_id_fkey;
ALTER TABLE debt_payments
  ADD CONSTRAINT debt_payments_wallet_id_fkey
  FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE SET NULL;

ALTER TABLE transfers DROP CONSTRAINT IF EXISTS transfers_from_wallet_id_fkey;
ALTER TABLE transfers
  ADD CONSTRAINT transfers_from_wallet_id_fkey
  FOREIGN KEY (from_wallet_id) REFERENCES wallets(id) ON DELETE CASCADE;

ALTER TABLE transfers DROP CONSTRAINT IF EXISTS transfers_to_wallet_id_fkey;
ALTER TABLE transfers
  ADD CONSTRAINT transfers_to_wallet_id_fkey
  FOREIGN KEY (to_wallet_id) REFERENCES wallets(id) ON DELETE CASCADE;
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
