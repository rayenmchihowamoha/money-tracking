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
