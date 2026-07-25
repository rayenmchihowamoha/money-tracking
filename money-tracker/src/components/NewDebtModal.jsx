import React, { useState } from 'react';
import Modal from './Modal.jsx';
import { api } from '../api.js';

const CURRENCIES = ['DA', 'USD', 'EUR', 'USDT'];

export default function NewDebtModal({ onClose, onDone }) {
  const [person, setPerson] = useState('');
  const [currency, setCurrency] = useState('DA');
  const [amount, setAmount] = useState('');
  const [dateCreated, setDateCreated] = useState(new Date().toISOString().slice(0, 10));
  const [dueType, setDueType] = useState('soon');
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!person.trim() || !amount || Number(amount) <= 0) {
      setError('Who you owe and the amount are required.');
      return;
    }
    if (dueType === 'date' && !dueDate) {
      setError('Pick a due date, or choose soon/unsure/later.');
      return;
    }
    setBusy(true);
    try {
      await api.createDebt({
        direction: 'i_owe',
        person: person.trim(),
        currency,
        totalAmount: Number(amount),
        dateCreated,
        dueType,
        dueDate: dueType === 'date' ? dueDate : null,
        note: note || null,
      });
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Log money you owe" onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <label>
          Who / what it's for *
          <input value={person} onChange={(e) => setPerson(e.target.value)} placeholder="e.g. Amine, phone repair" autoFocus />
        </label>
        <div className="field-row">
          <label>
            Amount *
            <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <label>
            Currency
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
        </div>
        <label>
          When you took it on
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
