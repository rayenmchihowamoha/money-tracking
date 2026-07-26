-- ============================================================
-- Family Money Tracker — Repair double-encoded denomination_breakdown
--
-- Older code did JSON.stringify(obj) in app code AND relied on the
-- jsonb driver encoding again, so some rows have denomination_breakdown
-- stored as a JSON *string* (e.g. "{\"100\":1,\"500\":2}") instead of a
-- real JSON *object* (e.g. {"100":1,"500":2}). This unwraps those rows.
-- Rows that are already proper objects (jsonb_typeof = 'object') are
-- left untouched, so this is safe to run more than once.
-- ============================================================

UPDATE transactions
SET denomination_breakdown = (denomination_breakdown #>> '{}')::jsonb
WHERE jsonb_typeof(denomination_breakdown) = 'string';
