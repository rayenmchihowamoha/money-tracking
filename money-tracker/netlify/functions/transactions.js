import { sql, json, pathSegmentsAfter } from './_db.js';
import { getProfileId, unauthorized } from './_auth.js';

async function walletBelongsToProfile(walletId, profileId) {
  const rows = await sql`SELECT id FROM wallets WHERE id = ${walletId} AND profile_id = ${profileId}`;
  return rows.length > 0;
}

export async function handler(event) {
  const profileId = await getProfileId(event);
  if (!profileId) return unauthorized();

  const segments = pathSegmentsAfter(event, 'transactions'); // [] or [txnId]
  const qs = event.queryStringParameters || {};

  if (event.httpMethod === 'GET' && segments.length === 0) {
    if (qs.walletId) {
      if (!(await walletBelongsToProfile(qs.walletId, profileId))) return json(404, { error: 'Wallet not found.' });
      const rows = await sql`
        SELECT * FROM transactions WHERE wallet_id = ${qs.walletId} ORDER BY date DESC, created_at DESC
      `;
      return json(200, rows);
    }
    const rows = await sql`
      SELECT t.* FROM transactions t
      JOIN wallets w ON w.id = t.wallet_id
      WHERE w.profile_id = ${profileId}
      ORDER BY t.date DESC, t.created_at DESC
    `;
    return json(200, rows);
  }

  if (event.httpMethod === 'POST' && segments.length === 0) {
    const { walletId, type, amount, date, reason, sourceOrTarget, denominationBreakdown } = JSON.parse(event.body || '{}');
    if (!walletId || !['deposit', 'withdrawal'].includes(type) || !amount || Number(amount) <= 0 || !date) {
      return json(400, { error: 'Wallet, type, a positive amount, and a date are required.' });
    }
    if (!(await walletBelongsToProfile(walletId, profileId))) return json(404, { error: 'Wallet not found.' });

    const [txn] = await sql`
      INSERT INTO transactions (wallet_id, type, amount, date, reason, source_or_target, denomination_breakdown)
      VALUES (${walletId}, ${type}, ${amount}, ${date}, ${reason || null}, ${sourceOrTarget || null}, ${denominationBreakdown ? JSON.stringify(denominationBreakdown) : null})
      RETURNING *
    `;
    return json(200, txn);
  }

  if (event.httpMethod === 'PUT' && segments.length === 1) {
    const txnId = segments[0];
    const { amount, date, reason, sourceOrTarget } = JSON.parse(event.body || '{}');
    const rows = await sql`
      UPDATE transactions t SET
        amount = COALESCE(${amount}, t.amount),
        date = COALESCE(${date}, t.date),
        reason = ${reason ?? null},
        source_or_target = ${sourceOrTarget ?? null}
      FROM wallets w
      WHERE t.id = ${txnId} AND t.wallet_id = w.id AND w.profile_id = ${profileId}
      RETURNING t.*
    `;
    if (rows.length === 0) return json(404, { error: 'Transaction not found.' });
    return json(200, rows[0]);
  }

  if (event.httpMethod === 'DELETE' && segments.length === 1) {
    const txnId = segments[0];
    const existing = await sql`
      SELECT t.id, t.linked_debt_id FROM transactions t
      JOIN wallets w ON w.id = t.wallet_id
      WHERE t.id = ${txnId} AND w.profile_id = ${profileId}
    `;
    if (existing.length === 0) return json(404, { error: 'Transaction not found.' });
    if (existing[0].linked_debt_id) {
      return json(400, { error: 'This entry is linked to a debt and cannot be deleted directly. Delete the debt instead.' });
    }
    await sql`DELETE FROM transactions WHERE id = ${txnId}`;
    return json(200, { ok: true });
  }

  return json(405, { error: 'Method not allowed' });
}
