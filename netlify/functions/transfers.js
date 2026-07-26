import { sql, json, pathSegmentsAfter } from './_db.js';
import { getProfileId, unauthorized } from './_auth.js';

export async function handler(event) {
  const profileId = await getProfileId(event);
  if (!profileId) return unauthorized();

  const segments = pathSegmentsAfter(event, 'transfers'); // [] | [transferId]

  if (event.httpMethod === 'POST' && segments.length === 0) {
    const { fromWalletId, toWalletId, amount, date, note, denominationBreakdown } = JSON.parse(event.body || '{}');

    if (!fromWalletId || !toWalletId || !amount || Number(amount) <= 0 || !date) {
      return json(400, { error: 'Source wallet, destination wallet, a positive amount, and a date are required.' });
    }
    if (fromWalletId === toWalletId) {
      return json(400, { error: 'Pick two different wallets.' });
    }

    const walletRows = await sql`
      SELECT id, name, currency, archived FROM wallets
      WHERE id IN (${fromWalletId}, ${toWalletId}) AND profile_id = ${profileId}
    `;
    const fromWallet = walletRows.find((w) => w.id === fromWalletId);
    const toWallet = walletRows.find((w) => w.id === toWalletId);
    if (!fromWallet || !toWallet) return json(404, { error: 'One of those wallets was not found.' });
    if (fromWallet.archived || toWallet.archived) return json(400, { error: 'Cannot transfer with an archived wallet.' });
    if (fromWallet.currency !== toWallet.currency) {
      return json(400, { error: 'Transfers must be between wallets with the same currency.' });
    }

    if (fromWallet.currency === 'DA') {
      if (!denominationBreakdown || Object.keys(denominationBreakdown).length === 0) {
        return json(400, { error: 'Specifying which bills are moving is required for a transfer.' });
      }
      const denomSum = Object.entries(denominationBreakdown).reduce(
        (acc, [denom, qty]) => acc + Number(denom) * Number(qty || 0), 0
      );
      if (denomSum !== Number(amount)) {
        return json(400, { error: `The bills you specified add up to ${denomSum}, not ${amount}. Adjust them to match.` });
      }
    }

    const [{ balance }] = await sql`
      SELECT COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount WHEN type = 'withdrawal' THEN -amount ELSE 0 END), 0) AS balance
      FROM transactions WHERE wallet_id = ${fromWalletId}
    `;
    if (Number(balance) < Number(amount)) {
      return json(400, { error: `"${fromWallet.name}" only has ${balance} ${fromWallet.currency} — not enough to transfer ${amount}.` });
    }

    const [transfer] = await sql`
      INSERT INTO transfers (profile_id, from_wallet_id, to_wallet_id, amount, currency, date, note)
      VALUES (${profileId}, ${fromWalletId}, ${toWalletId}, ${amount}, ${fromWallet.currency}, ${date}, ${note || null})
      RETURNING *
    `;

    const denomJson = fromWallet.currency === 'DA' && denominationBreakdown ? sql.json(denominationBreakdown) : null;

    await sql`
      INSERT INTO transactions (wallet_id, type, amount, date, reason, source_or_target, denomination_breakdown, linked_transfer_id)
      VALUES (${fromWalletId}, 'withdrawal', ${amount}, ${date}, ${'Transfer to ' + toWallet.name}, ${toWallet.name}, ${denomJson}, ${transfer.id})
    `;
    await sql`
      INSERT INTO transactions (wallet_id, type, amount, date, reason, source_or_target, denomination_breakdown, linked_transfer_id)
      VALUES (${toWalletId}, 'deposit', ${amount}, ${date}, ${'Transfer from ' + fromWallet.name}, ${fromWallet.name}, ${denomJson}, ${transfer.id})
    `;

    return json(200, transfer);
  }

  if (event.httpMethod === 'DELETE' && segments.length === 1) {
    const transferId = segments[0];
    const owned = await sql`SELECT id FROM transfers WHERE id = ${transferId} AND profile_id = ${profileId}`;
    if (owned.length === 0) return json(404, { error: 'Transfer not found.' });
    // ON DELETE CASCADE on transactions.linked_transfer_id removes both linked legs.
    await sql`DELETE FROM transfers WHERE id = ${transferId}`;
    return json(200, { ok: true });
  }

  return json(405, { error: 'Method not allowed' });
}
