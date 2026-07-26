import React, { useState } from 'react';
import Modal from './Modal.jsx';
import DenominationPicker from './DenominationPicker.jsx';
import { api } from '../api.js';

const CURRENCIES = ['DA', 'USD', 'EUR', 'USDT'];

export default function NewDebtModal({ direction, wallets, onClose, onDone }) {
  const isIOwe = direction === 'i_owe';
  const activeWallets = (wallets || []).filter((w) => !w.archived);

  const [person, setPerson] = useState('');
  const [walletId, setWalletId] = useState(''); // only relevant for owed_to_me
  const [currency, setCurrency] = useState('DA');
  const [amount, setAmount] = useState('');
  const [dateCreated, setDateCreated] = useState(new Date().toISOString().slice(0, 10));
  const [dueType, setDueType] = useState('soon');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [denoms, setDenoms] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const selectedWallet = activeWallets.find((w) => w.id === walletId);
  const effectiveCurrency = !isIOwe && selectedWallet ? selectedWallet.currency : currency;

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!person.trim() || !amount || Number(amount) <= 0) {
      setError(`Who ${isIOwe ? 'you owe' : 'owes you'} and the amount are required.`);
      return;
    }
    if (dueType === 'date' && !dueDate) {
      setError('Pick a due date, or choose soon/unsure/later.');
      return;
    }
    setBusy(true);
    try {
      await api.createDebt({
        direction,
        person: person.trim(),
        currency: effectiveCurrency,
        totalAmount: Number(amount),
        dateCreated,
        dueType,
        dueDate: dueType === 'date' ? dueDate : null,
        originWalletId: !isIOwe && walletId ? walletId : null,
        note: note || null,
        denominationBreakdown: !isIOwe && selectedWallet?.currency === 'DA' ? denoms : null,
      });
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={isIOwe ? 'Log money you owe' : 'Log money owed to you'} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label>
          {isIOwe ? "Who / what it's for *" : 'Who owes you *'}
          <input value={person} onChange={(e) => setPerson(e.target.value)} placeholder={isIOwe ? 'e.g. Amine, phone repair' : 'e.g. Khaled'} autoFocus />
        </label>

        {!isIOwe && (
          <label>
            Which wallet did the money leave from? (optional)
            <select value={walletId} onChange={(e) => setWalletId(e.target.value)}>
              <option value="">No wallet — cash that wasn't tracked</option>
              {activeWallets.map((w) => (
                <option key={w.id} value={w.id}>{w.name} ({w.currency})</option>
              ))}
            </select>
          </label>
        )}

        <div className="field-row">
          <label>
            Amount *
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label>
            Currency
            <select
              value={effectiveCurrency}
              onChange={(e) => setCurrency(e.target.value)}
              disabled={!isIOwe && !!selectedWallet}
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>

        {!isIOwe && selectedWallet?.currency === 'DA' && (
          <DenominationPicker amount={amount} value={denoms} onChange={setDenoms} />
        )}

        <label>
          When {isIOwe ? 'you took it on' : 'you lent it'}
          <input type="date" value={dateCreated} onChange={(e) => setDateCreated(e.target.value)} />
        </label>
        <div className="field-row">
          <label>
            Pay back
            <select value={dueType} onChange={(e) => setDueType(e.target.value)}>
              <option value="date">Specific date</option>
              <option value="soon">Soon</option>
              <option value="unsure">Unsure</option>
              <option value="later">Later</option>
            </select>
          </label>
          {dueType === 'date' && (
            <label>
              Due date
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </label>
          )}
        </div>
        <label>
          Note (optional)
          <input value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        {error && <div className="error-text">{error}</div>}
        <button className="btn btn-primary btn-block" disabled={busy}>Save debt</button>
      </form>
    </Modal>
  );
}
