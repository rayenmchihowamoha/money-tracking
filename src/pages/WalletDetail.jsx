import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import DepositModal from '../components/DepositModal.jsx';
import WithdrawModal from '../components/WithdrawModal.jsx';
import TransferModal from '../components/TransferModal.jsx';
import TransactionDetailModal from '../components/TransactionDetailModal.jsx';

export default function WalletDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(null);
  const [wallets, setWallets] = useState([]);
  const [txns, setTxns] = useState([]);
  const [modal, setModal] = useState(null);
  const [detailTxn, setDetailTxn] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const w = await api.listWallets();
    setWallets(w);
    setWallet(w.find((x) => x.id === id));
    const t = await api.listTransactions(id);
    setTxns(t);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function handleDelete(txnId) {
    if (!confirm('Delete this entry? The wallet balance will update.')) return;
    await api.deleteTransaction(txnId);
    load();
  }

  async function handleArchive() {
    if (!confirm(`Archive "${wallet.name}"? It will be hidden from the dashboard but history is kept.`)) return;
    await api.archiveWallet(wallet.id);
    navigate('/');
  }

  if (loading) return <div className="empty-state">Loading…</div>;
  if (!wallet) return <div className="empty-state">Wallet not found.</div>;

  return (
    <div>
      <div className="section-head">
        <div>
          <h1 className="page-title">{wallet.name}</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            {wallet.currency} · Balance: <span className="amount">{Number(wallet.balance).toLocaleString()}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-outline" onClick={() => setModal('deposit')}>+ Add</button>
          <button className="btn btn-outline" onClick={() => setModal('withdraw')}>− Take out</button>
          <button className="btn btn-outline" onClick={() => setModal('transfer')}>⇄ Transfer</button>
          <button className="btn btn-outline" onClick={handleArchive}>Archive</button>
        </div>
      </div>

      {txns.length === 0 && <div className="empty-state">No activity yet in this wallet.</div>}

      {txns.map((t) => (
        <div className="txn-row" key={t.id}>
          <div>
            <div className={`amount txn-amount ${t.type}`}>
              {t.type === 'deposit' ? '+' : '−'}{Number(t.amount).toLocaleString()} {wallet.currency}
            </div>
            <div className="txn-meta">
              {t.date} {t.reason ? `· ${t.reason}` : ''} {t.source_or_target ? `· ${t.source_or_target}` : ''}
              {t.linked_debt_id ? ' · linked to a debt' : ''}
              {t.linked_transfer_id ? ' · transfer' : ''}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm" onClick={() => setDetailTxn(t)}>View details</button>
            {!t.linked_debt_id && (
              <button className="btn btn-outline btn-sm" onClick={() => handleDelete(t.id)}>Delete</button>
            )}
          </div>
        </div>
      ))}

      {modal === 'deposit' && (
        <DepositModal wallet={wallet} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />
      )}
      {modal === 'withdraw' && (
        <WithdrawModal wallet={wallet} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />
      )}
      {modal === 'transfer' && (
        <TransferModal wallets={wallets} fromWallet={wallet} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />
      )}
      {detailTxn && (
        <TransactionDetailModal txn={detailTxn} wallet={wallet} onClose={() => setDetailTxn(null)} />
      )}
    </div>
  );
}
