import React, { useState } from 'react';
import Modal from './Modal.jsx';
import DenominationPicker from './DenominationPicker.jsx';
import { api } from '../api.js';

export default function WithdrawModal({ wallet, onClose, onDone }) {
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState('');
  const [target, setTarget] = useState('');
  const [denoms, setDenoms] = useState(null);
  const [isLoan, setIsLoan] = useState(false);
  const [dueType, setDueType] = useState('soon');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!amount || Number(amount) <= 0 || !date) {
      setError('Amount and date are required.');
      return;
    }
    if (isLoan && !target.trim()) {
      setError('Who you are lending to is required for a loan.');
      return;
    }
    if (isLoan && dueType === 'date' && !dueDate) {
      setError('Pick a due date, or choose soon/unsure/later.');
      return;
    }
    setBusy(true);
    try {
      if (isLoan) {
        await api.createDebt({
          direction: 'owed_to_me',
          person: target.trim(),
          currency: wallet.currency,
          totalAmount: Number(amount),
          dateCreated: date,
          dueType,
          dueDate: dueType === 'date' ? dueDate : null,
          originWalletId: wallet.id,
          note: reason || null,
          denominationBreakdown: wallet.currency === 'DA' ? denoms : null,
        });
      } else {
        await api.addTransaction({
          walletId: wallet.id,
          type: 'withdrawal',
          amount: Number(amount),
          date,
          reason: reason || null,
          sourceOrTarget: target || null,
          denominationBreakdown: wallet.currency === 'DA' ? denoms : null,
        });
      }
      onDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Take money out — ${wallet.name}`} onClose={onClose}>
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
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. groceries" />
        </label>
        <label>
          {isLoan ? 'Lending to (who) *' : 'To / who (optional)'}
          <input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="e.g. Khaled" />
        </label>

        {wallet.currency === 'DA' && (
          <DenominationPicker amount={amount} value={denoms} onChange={setDenoms} />
        )}

        <label style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" style={{ width: 'auto' }} checked={isLoan} onChange={(e) => setIsLoan(e.target.checked)} />
          <span>This is a loan — someone will pay it back</span>
        </label>

        {isLoan && (
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
        )}

        {error && <div className="error-text">{error}</div>}
        <button className="btn btn-primary btn-block" disabled={busy}>
          {isLoan ? 'Withdraw & log loan' : 'Take money out'}
        </button>
      </form>
    </Modal>
  );
}
