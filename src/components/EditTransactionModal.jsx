import React, { useState } from 'react';
import Modal from './Modal.jsx';
import DenominationPicker from './DenominationPicker.jsx';
import { api } from '../api.js';

export default function EditTransactionModal({ txn, wallet, onClose, onDone }) {
  const [type, setType] = useState(txn.type);
  const [amount, setAmount] = useState(String(txn.amount));
  const [date, setDate] = useState(txn.date.slice(0, 10));
  const [reason, setReason] = useState(txn.reason || '');
  const [target, setTarget] = useState(txn.source_or_target || '');
  const [denoms, setDenoms] = useState(txn.denomination_breakdown ?? null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!amount || Number(amount) <= 0 || !date) {
      setError('Amount and date are required.');
      return;
    }
    setBusy(true);
    try {
      await api.updateTransaction(txn.id, {
        type,
        amount: Number(amount),
        date,
        reason: reason || null,
        sourceOrTarget: target || null,
        denominationBreakdown: wallet.currency === 'DA' ? denoms : null,
      });
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Edit entry" onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="deposit">Deposit (+)</option>
            <option value="withdrawal">Withdrawal (−)</option>
          </select>
        </label>
        <div className="field-row">
          <label>
            Amount ({wallet.currency}) *
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          </label>
          <label>
            Date *
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>
        <label>
          Reason
          <input value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        <label>
          {type === 'deposit' ? 'Source' : 'To / who'}
          <input value={target} onChange={(e) => setTarget(e.target.value)} />
        </label>

        {wallet.currency === 'DA' && (
          <DenominationPicker amount={amount} value={denoms} onChange={setDenoms} />
        )}

        {error && <div className="error-text">{error}</div>}
        <button className="btn btn-primary btn-block" disabled={busy}>Save changes</button>
      </form>
    </Modal>
  );
}
