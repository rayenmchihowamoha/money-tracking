import { sql, json, pathSegmentsAfter } from './_db.js';
import { getProfileId, unauthorized } from './_auth.js';

const CURRENCIES = ['DA', 'USD', 'EUR', 'USDT'];
const DUE_TYPES = ['date', 'soon', 'unsure', 'later'];

export async function handler(event) {
  const profileId = await getProfileId(event);
  if (!profileId) return unauthorized();

  const segments = pathSegmentsAfter(event, 'debts'); // [] | [debtId] | [debtId, 'payments']

  if (event.httpMethod === 'GET' && segments.length === 0) {
    const rows = await sql`
      SELECT * FROM debts WHERE profile_id = ${profileId} ORDER BY created_at DESC
    `;
    return json(200, rows);
  }

  if (event.httpMethod === 'POST' && segments.length === 0) {
    const {
      direction, person, currency, totalAmount, dateCreated, dueType, dueDate,
      originWalletId, note, denominationBreakdown,
    } = JSON.parse(event.body || '{}');

    if (!['i_owe', 'owed_to_me'].includes(direction) || !person || !CURRENCIES.includes(currency) ||
        !totalAmount || Number(totalAmount) <= 0 || !dateCreated || !DUE_TYPES.includes(dueType)) {
      return json(400, { error: 'Person, amount, currency, date, and a valid timeline are required.' });
    }
    if (dueType === 'date' && !dueDate) {
      return json(400, { error: 'A due date is required when timeline is "specific date".' });
    }
    if (direction === 'owed_to_me' && !originWalletId) {
      return json(400, { error: 'Which wallet the loan came from is required.' });
    }

    if (direction === 'owed_to_me') {
      const walletRows = await sql`SELECT id, currency FROM wallets WHERE id = ${originWalletId} AND profile_id = ${profileId}`;
      if (walletRows.length === 0) return json(404, { error: 'Origin wallet not found.' });
    }

    const [debt] = await sql`
      INSERT INTO debts (profile_id, direction, person, currency, total_amount, date_created, due_type, due_date, origin_wallet_id, note)
      VALUES (${profileId}, ${direction}, ${person}, ${currency}, ${totalAmount}, ${dateCreated}, ${dueType}, ${dueType === 'date' ? dueDate : null}, ${direction === 'owed_to_me' ? originWalletId : null}, ${note || null})
      RETURNING *
    `;

    if (direction === 'owed_to_me') {
      await sql`
        INSERT INTO transactions (wallet_id, type, amount, date, reason, source_or_target, denomination_breakdown, linked_debt_id)
        VALUES (${originWalletId}, 'withdrawal', ${totalAmount}, ${dateCreated}, ${'Loan to ' + person}, ${person}, ${denominationBreakdown ? JSON.stringify(denominationBreakdown) : null}, ${debt.id})
      `;
    }

    return json(200, debt);
  }

  if (event.httpMethod === 'DELETE' && segments.length === 1) {
    const debtId = segments[0];
    const owned = await sql`SELECT id FROM debts WHERE id = ${debtId} AND profile_id = ${profileId}`;
    if (owned.length === 0) return json(404, { error: 'Debt not found.' });
    // Unlink and remove any transactions tied to this debt (the original loan-out txn and payment txns)
    await sql`DELETE FROM transactions WHERE linked_debt_id = ${debtId}`;
    await sql`DELETE FROM debts WHERE id = ${debtId}`;
    return json(200, { ok: true });
  }

  if (event.httpMethod === 'POST' && segments.length === 2 && segments[1] === 'payments') {
    const debtId = segments[0];
    const { amount, date, walletId } = JSON.parse(event.body || '{}');
    if (!amount || Number(amount) <= 0 || !date || !walletId) {
      return json(400, { error: 'Amount, date, and wallet are required.' });
    }

    const debtRows = await sql`SELECT * FROM debts WHERE id = ${debtId} AND profile_id = ${profileId}`;
    const debt = debtRows[0];
    if (!debt) return json(404, { error: 'Debt not found.' });

    const walletRows = await sql`SELECT id, currency FROM wallets WHERE id = ${walletId} AND profile_id = ${profileId}`;
    if (walletRows.length === 0) return json(404, { error: 'Wallet not found.' });

    const remaining = Number(debt.total_amount) - Number(debt.amount_settled);
    if (Number(amount) > remaining + 0.0001) {
      return json(400, { error: `Amount exceeds remaining balance of ${remaining}.` });
    }

    const txnType = debt.direction === 'i_owe' ? 'withdrawal' : 'deposit';
    const reason = debt.direction === 'i_owe' ? `Debt payment to ${debt.person}` : `Debt received from ${debt.person}`;

    const [txn] = await sql`
      INSERT INTO transactions (wallet_id, type, amount, date, reason, source_or_target, linked_debt_id)
      VALUES (${walletId}, ${txnType}, ${amount}, ${date}, ${reason}, ${debt.person}, ${debt.id})
      RETURNING id
    `;

    await sql`
      INSERT INTO debt_payments (debt_id, amount, date, wallet_id, transaction_id)
      VALUES (${debt.id}, ${amount}, ${date}, ${walletId}, ${txn.id})
    `;

    const newSettled = Number(debt.amount_settled) + Number(amount);
    const newStatus = newSettled >= Number(debt.total_amount) - 0.0001 ? 'paid' : 'partial';

    const [updated] = await sql`
      UPDATE debts SET amount_settled = ${newSettled}, status = ${newStatus}
      WHERE id = ${debt.id}
      RETURNING *
    `;
    return json(200, updated);
  }

  return json(405, { error: 'Method not allowed' });
}
