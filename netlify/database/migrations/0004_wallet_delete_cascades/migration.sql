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
