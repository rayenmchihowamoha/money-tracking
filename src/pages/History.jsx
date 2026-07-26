import React, { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import TransactionDetailModal from '../components/TransactionDetailModal.jsx';
import EditTransactionModal from '../components/EditTransactionModal.jsx';

export default function History() {
  const [wallets, setWallets] = useState([]);
  const [txns, setTxns] = useState([]);
  const [walletFilter, setWalletFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [detailTxn, setDetailTxn] = useState(null);
  const [editTxn, setEditTxn] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const w = await api.listWallets();
    setWallets(w);
    const t = await api.listTransactions();
    setTxns(t);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const walletMap = useMemo(() => Object.fromEntries(wallets.map((w) => [w.id, w])), [wallets]);

  async function handleDelete(txnId) {
    if (!confirm('Delete this entry? The wallet balance will update.')) return;
    await api.deleteTransaction(txnId);
    load();
  }

  const filtered = txns
    .filter((t) => walletFilter === 'all' || t.wallet_id === walletFilter)
    .filter((t) => typeFilter === 'all' || t.type === typeFilter)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (loading) return <div className="empty-state">Loading history…</div>;

  return (
    <div>
      <h1 className="page-title">All activity</h1>
      <p className="page-sub">Every deposit and withdrawal across every wallet.</p>

      <div className="field-row" style={{ marginBottom: 20, maxWidth: 480 }}>
        <label>
          Wallet
          <select value={walletFilter} onChange={(e) => setWalletFilter(e.target.value)}>
            <option value="all">All wallets</option>
            {wallets.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </label>
        <label>
          Type
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 && <div className="empty-state">No matching activity.</div>}

      {filtered.map((t) => (
        <div className="txn-row" key={t.id}>
          <div>
            <div className={`amount txn-amount ${t.type}`}>
              {t.type === 'deposit' ? '+' : '−'}{Number(t.amount).toLocaleString()} {walletMap[t.wallet_id]?.currency}
            </div>
            <div className="txn-meta">
              {walletMap[t.wallet_id]?.name} · {t.date} {t.reason ? `· ${t.reason}` : ''} {t.source_or_target ? `· ${t.source_or_target}` : ''}
              {t.linked_debt_id ? ' · linked to a debt' : ''}
              {t.linked_transfer_id ? ' · transfer' : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm" onClick={() => setDetailTxn(t)}>View</button>
            {!t.linked_debt_id && !t.linked_transfer_id && (
              <button className="btn btn-outline btn-sm" onClick={() => setEditTxn(t)}>Edit</button>
            )}
            {!t.linked_debt_id && (
              <button className="btn btn-outline btn-sm" onClick={() => handleDelete(t.id)}>Delete</button>
            )}
          </div>
        </div>
      ))}

      {detailTxn && (
        <TransactionDetailModal txn={detailTxn} wallet={walletMap[detailTxn.wallet_id]} onClose={() => setDetailTxn(null)} />
      )}
      {editTxn && (
        <EditTransactionModal
          txn={editTxn}
          wallet={walletMap[editTxn.wallet_id]}
          onClose={() => setEditTxn(null)}
          onDone={() => { setEditTxn(null); load(); }}
        />
      )}
    </div>
  );
}
