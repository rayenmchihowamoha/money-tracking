import React, { useState } from 'react';
import Modal from './Modal.jsx';
import DenominationPicker from './DenominationPicker.jsx';
import { api } from '../api.js';

export default function TransferModal({ wallets, fromWallet, onClose, onDone }) {
  const activeWallets = wallets.filter((w) => !w.archived);
  const [fromWalletId, setFromWalletId] = useState(fromWallet?.id || '');
  const [toWalletId, setToWalletId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState('');
  const [denoms, setDenoms] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const selectedFrom = activeWallets.find((w) => w.id === fromWalletId);
  const isDA = selectedFrom?.currency === 'DA';
  const toOptions = activeWallets.filter((w) => w.id !== fromWalletId && (!selectedFrom || w.currency === selectedFrom.currency));

  const denomSum = Object.entries(denoms).reduce((acc, [d, q]) => acc + Number(d) * Number(q || 0), 0);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!fromWalletId || !toWalletId) {
      setError('Pick both a source and destination wallet.');
      return;
    }
    if (!amount || Number(amount) <= 0 || !date) {
      setError('Amount and date are required.');
      return;
    }
    if (Number(amount) > Number(selectedFrom.balance)) {
      setError(`"${selectedFrom.name}" only has ${Number(selectedFrom.balance).toLocaleString()} ${selectedFrom.currency} — not enough to transfer ${amount}.`);
      return;
    }
    if (isDA) {
      if (Object.keys(denoms).length === 0) {
        setError('Specifying which bills are moving is required for a transfer.');
        return;
      }
      if (denomSum !== Number(amount)) {
        setError(`The bills you specified add up to ${denomSum} DA, not ${amount} DA. Adjust them to match.`);
        return;
      }
    }
    setBusy(true);
    try {
      await api.createTransfer({
        fromWalletId,
        toWalletId,
        amount: Number(amount),
        date,
        note: note || null,
        denominationBreakdown: isDA ? denoms : null,
      });
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Transfer between wallets" onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="field-row">
          <label>
            From wallet *
            <select
              value={fromWalletId}
              onChange={(e) => { setFromWalletId(e.target.value); setToWalletId(''); setDenoms({}); }}
            >
              <option value="">Select a wallet…</option>
              {activeWallets.map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.currency}) — {Number(w.balance).toLocaleString()}</option>
              ))}
            </select>
          </label>
          <label>
            To wallet *
            <select value={toWalletId} onChange={(e) => setToWalletId(e.target.value)} disabled={!fromWalletId}>
              <option value="">Select a wallet…</option>
              {toOptions.map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.currency})</option>
              ))}
            </select>
          </label>
        </div>
        {fromWalletId && toOptions.length === 0 && (
          <div className="error-text">No other wallet with the same currency to transfer into.</div>
        )}
        <div className="field-row">
          <label>
            Amount {selectedFrom ? `(${selectedFrom.currency})` : ''} *
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          </label>
          <label>
            Date *
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>
        {selectedFrom && (
          <div className="txn-meta">Available in "{selectedFrom.name}": {Number(selectedFrom.balance).toLocaleString()} {selectedFrom.currency}</div>
        )}

        {isDA && (
          <DenominationPicker amount={amount} value={denoms} onChange={setDenoms} allowUnknown={false} label="Which bills are being moved" />
        )}

        <label>
          Note (optional)
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. moving savings around" />
        </label>
        {error && <div className="error-text">{error}</div>}
        <button className="btn btn-primary btn-block" disabled={busy}>Transfer</button>
      </form>
    </Modal>
  );
}
