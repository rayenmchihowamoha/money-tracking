import React, { useState } from 'react';
import Modal from './Modal.jsx';
import DenominationPicker from './DenominationPicker.jsx';
import { api } from '../api.js';

export default function DepositModal({ wallet, onClose, onDone }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const [source, setSource] = useState('');
  const [denoms, setDenoms] = useState(null);
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
      await api.addTransaction({
        walletId: wallet.id,
        type: 'deposit',
        amount: Number(amount),
        date,
        reason: reason || null,
        sourceOrTarget: source || null,
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
    <Modal title={`Add money — ${wallet.name}`} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
          Reason (optional)
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Eid gift" />
        </label>
        <label>
          Source (optional)
          <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Mom, freelance job" />
        </label>
        {wallet.currency === 'DA' && (
          <DenominationPicker amount={amount} value={denoms} onChange={setDenoms} />
        )}
        {error && <div className="error-text">{error}</div>}
        <button className="btn btn-primary btn-block" disabled={busy}>Add money</button>
      </form>
    </Modal>
  );
}
