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
