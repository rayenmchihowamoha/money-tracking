import React, { useState } from 'react';
import Modal from './Modal.jsx';
import { api } from '../api.js';

export default function PayDebtModal({ debt, wallets, onClose, onDone }) {
  const remaining = Number(debt.total_amount) - Number(debt.amount_settled);
  const [amount, setAmount] = useState(remaining);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const matchingWallets = wallets.filter((w) => w.currency === debt.currency && !w.archived);
  const [walletId, setWalletId] = useState(matchingWallets[0]?.id || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isIOwe = debt.direction === 'i_owe';

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!amount || Number(amount) <= 0 || !date) {
      setError('Amount and date are required.');
      return;
    }
    if (!walletId) {
      setError(`Pick which wallet the money ${isIOwe ? 'comes from' : 'goes into'}.`);
      return;
    }
    setBusy(true);
    try {
      await api.payDebt(debt.id, { amount: Number(amount), date, walletId });
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={isIOwe ? `Log a payment to ${debt.person}` : `Log payment received from ${debt.person}`} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
          Remaining: <span className="amount">{remaining} {debt.currency}</span>
        </p>
        <div className="field-row">
          <label>
            Amount *
            <input type="number" step="0.01" max={remaining} value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          </label>
          <label>
            Date *
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>
        <label>
          {isIOwe ? 'Pay from which wallet *' : 'Deposit into which wallet *'}
          <select value={walletId} onChange={(e) => setWalletId(e.target.value)}>
            <option value="">Select a wallet…</option>
            {matchingWallets.map((w) => (
              <option key={w.id} value={w.id}>{w.name} ({w.currency})</option>
            ))}
          </select>
        </label>
        {matchingWallets.length === 0 && (
          <div className="error-text">No {debt.currency} wallets found — create one first.</div>
        )}
        {error && <div className="error-text">{error}</div>}
        <button className="btn btn-primary btn-block" disabled={busy}>Log payment</button>
      </form>
    </Modal>
  );
}
