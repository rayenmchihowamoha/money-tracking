import React, { useState } from 'react';
import Modal from './Modal.jsx';
import { api } from '../api.js';

const CURRENCIES = ['DA', 'USD', 'EUR', 'USDT'];

export default function NewWalletModal({ onClose, onDone }) {
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('DA');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Give the wallet a name.');
      return;
    }
    setBusy(true);
    try {
      await api.createWallet(name.trim(), currency);
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="New wallet" onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label>
          Name *
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Money with Mom" autoFocus />
        </label>
        <label>
          Currency
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        {error && <div className="error-text">{error}</div>}
        <button className="btn btn-primary btn-block" disabled={busy}>Create wallet</button>
      </form>
    </Modal>
  );
}
