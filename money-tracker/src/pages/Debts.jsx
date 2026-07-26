import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import NewDebtModal from '../components/NewDebtModal.jsx';
import PayDebtModal from '../components/PayDebtModal.jsx';

function dueLabel(debt) {
  if (debt.status === 'paid') return null;
  if (debt.due_type === 'date' && debt.due_date) {
    const overdue = new Date(debt.due_date) < new Date();
    return <span className={`pill ${overdue ? 'pill-overdue' : 'pill-open'}`}>{overdue ? 'Overdue' : `Due ${debt.due_date}`}</span>;
  }
  if (debt.due_type === 'soon') return <span className="pill pill-soon">Due soon</span>;
  if (debt.due_type === 'unsure') return <span className="pill pill-open">Unsure</span>;
  if (debt.due_type === 'later') return <span className="pill pill-open">Later</span>;
  return null;
}

function statusPill(debt) {
  if (debt.status === 'paid') return <span className="pill pill-paid">Paid</span>;
  if (debt.status === 'partial') return <span className="pill pill-partial">Partial</span>;
  return null;
}

export default function Debts() {
  const [debts, setDebts] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [tab, setTab] = useState('i_owe');
  const [modal, setModal] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const [d, w] = await Promise.all([api.listDebts(), api.listWallets()]);
    setDebts(d);
    setWallets(w);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this debt entry?')) return;
    await api.deleteDebt(id);
    load();
  }

  if (loading) return <div className="empty-state">Loading debts…</div>;

  const list = debts.filter((d) => d.direction === tab).sort((a, b) => (a.status === 'paid') - (b.status === 'paid'));

  return (
    <div>
      <div className="section-head">
        <h1 className="page-title">Debts</h1>
        <button className="btn btn-primary" onClick={() => setModal('new')}>+ Log money you owe</button>
      </div>
      <p className="page-sub">Lending money out is logged from the wallet's "Take out" form.</p>

      <div className="tabs">
        <button className={`tab ${tab === 'i_owe' ? 'active' : ''}`} onClick={() => setTab('i_owe')}>I owe</button>
        <button className={`tab ${tab === 'owed_to_me' ? 'active' : ''}`} onClick={() => setTab('owed_to_me')}>Owed to me</button>
      </div>

      {list.length === 0 && <div className="empty-state">Nothing here.</div>}

      {list.map((d) => {
        const pct = Math.min(100, (Number(d.amount_settled) / Number(d.total_amount)) * 100);
        return (
          <div className="debt-card" key={d.id}>
            <div className="debt-top">
              <div>
                <div style={{ fontWeight: 600 }}>{d.person}</div>
                <div className="txn-meta">
                  {d.note ? `${d.note} · ` : ''}{d.date_created}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {statusPill(d)}
                {dueLabel(d)}
              </div>
            </div>
            <div className="amount" style={{ marginTop: 8 }}>
              {Number(d.amount_settled).toLocaleString()} / {Number(d.total_amount).toLocaleString()} {d.currency}
            </div>
            <div className="debt-progress"><div className="debt-progress-bar" style={{ width: `${pct}%` }} /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              {d.status !== 'paid' && (
                <button className="btn btn-outline btn-sm" onClick={() => setModal({ type: 'pay', debt: d })}>
                  Log {d.direction === 'i_owe' ? 'payment' : 'money received'}
                </button>
              )}
              <button className="btn btn-outline btn-sm" onClick={() => handleDelete(d.id)}>Delete</button>
            </div>
          </div>
        );
      })}

      {modal === 'new' && (
        <NewDebtModal onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />
      )}
      {modal?.type === 'pay' && (
        <PayDebtModal debt={modal.debt} wallets={wallets} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />
      )}
    </div>
  );
}
