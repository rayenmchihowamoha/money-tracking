import { sql, json, pathSegmentsAfter } from './_db.js';
import { getProfileId, unauthorized } from './_auth.js';

const CURRENCIES = ['DA', 'USD', 'EUR', 'USDT'];

export async function handler(event) {
  const profileId = await getProfileId(event);
  if (!profileId) return unauthorized();

  const segments = pathSegmentsAfter(event, 'wallets'); // e.g. [] or [walletId]

  if (event.httpMethod === 'GET' && segments.length === 0) {
    const rows = await sql`
      SELECT w.id, w.name, w.currency, w.archived,
        COALESCE(SUM(CASE WHEN t.type = 'deposit' THEN t.amount WHEN t.type = 'withdrawal' THEN -t.amount ELSE 0 END), 0) AS balance
      FROM wallets w
      LEFT JOIN transactions t ON t.wallet_id = w.id
      WHERE w.profile_id = ${profileId}
      GROUP BY w.id
      ORDER BY w.created_at ASC
    `;
    return json(200, rows);
  }

  if (event.httpMethod === 'POST' && segments.length === 0) {
    const { name, currency } = JSON.parse(event.body || '{}');
    if (!name || !CURRENCIES.includes(currency)) {
      return json(400, { error: 'A wallet name and valid currency are required.' });
    }
    const [wallet] = await sql`
      INSERT INTO wallets (profile_id, name, currency) VALUES (${profileId}, ${name}, ${currency})
      RETURNING id, name, currency, archived
    `;
    return json(200, { ...wallet, balance: 0 });
  }

  if (event.httpMethod === 'DELETE' && segments.length === 1) {
    const walletId = segments[0];
    const qs = event.queryStringParameters || {};

    if (qs.hard === 'true') {
      const rows = await sql`
        DELETE FROM wallets WHERE id = ${walletId} AND profile_id = ${profileId} RETURNING id
      `;
      if (rows.length === 0) return json(404, { error: 'Wallet not found.' });
      return json(200, { ok: true });
    }

    const rows = await sql`
      UPDATE wallets SET archived = true
      WHERE id = ${walletId} AND profile_id = ${profileId}
      RETURNING id
    `;
    if (rows.length === 0) return json(404, { error: 'Wallet not found.' });
    return json(200, { ok: true });
  }

  return json(405, { error: 'Method not allowed' });
}
