import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import NewWalletModal from '../components/NewWalletModal.jsx';
import DepositModal from '../components/DepositModal.jsx';
import WithdrawModal from '../components/WithdrawModal.jsx';
import WalletPieChart from '../components/WalletPieChart.jsx';

export default function Dashboard() {
  const [wallets, setWallets] = useState([]);
  const [debts, setDebts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // 'new-wallet' | {type:'deposit'|'withdraw', wallet}

  async function load() {
    setLoading(true);
    const [w, d] = await Promise.all([api.listWallets(), api.listDebts()]);
    setWallets(w);
    setDebts(d);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  if (loading) return <div className="empty-state">Loading your accounts…</div>;

  const active = wallets.filter((w) => !w.archived);
  const grouped = active.reduce((acc, w) => {
    (acc[w.currency] = acc[w.currency] || []).push(w);
    return acc;
  }, {});

  const openIOwe = debts.filter((d) => d.direction === 'i_owe' && d.status !== 'paid');
  const openOwedToMe = debts.filter((d) => d.direction === 'owed_to_me' && d.status !== 'paid');
  const overdueCount = debts.filter((d) => d.status !== 'paid' && d.due_type === 'date' && d.due_date && new Date(d.due_date) < new Date()).length;

  return (
    <div>
      <div className="section-head">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>Every wallet, kept separate by currency.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new-wallet')}>+ New wallet</button>
      </div>

      {active.length === 0 && (
        <div className="empty-state">No wallets yet. Create your first one — "money in my pocket", "with mom", whatever fits.</div>
      )}

      {Object.entries(grouped).map(([currency, list]) => (
        <div className="currency-group" key={currency}>
          <div className="currency-group-label">{currency}</div>
          <div className="wallet-grid">
            {list.map((w) => (
              <div className="ledger-card" key={w.id}>
                <Link to={`/wallet/${w.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="wallet-name">{w.name}</div>
                  <div className="wallet-currency">{w.currency}</div>
                  <div className="wallet-balance amount">{Number(w.balance).toLocaleString()}</div>
                </Link>
                <div className="wallet-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => setModal({ type: 'deposit', wallet: w })}>+ Add</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setModal({ type: 'withdraw', wallet: w })}>− Take out</button>
                </div>
              </div>
            ))}
          </div>
          {list.length > 1 && <WalletPieChart wallets={list} />}
        </div>
      ))}

      <div className="section-head" style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 18 }}>Debts</h2>
        <Link to="/debts" className="btn btn-outline btn-sm">View all</Link>
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div className="chart-card" style={{ flex: 1, minWidth: 200 }}>
          <div className="wallet-currency">You owe</div>
          <div className="wallet-balance amount">{openIOwe.length} open</div>
        </div>
        <div className="chart-card" style={{ flex: 1, minWidth: 200 }}>
          <div className="wallet-currency">Owed to you</div>
          <div className="wallet-balance amount">{openOwedToMe.length} open</div>
        </div>
        <div className="chart-card" style={{ flex: 1, minWidth: 200 }}>
          <div className="wallet-currency">Overdue</div>
          <div className="wallet-balance amount" style={{ color: overdueCount ? 'var(--red)' : 'inherit' }}>{overdueCount}</div>
        </div>
      </div>

      {modal === 'new-wallet' && (
        <NewWalletModal onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />
      )}
      {modal?.type === 'deposit' && (
        <DepositModal wallet={modal.wallet} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />
      )}
      {modal?.type === 'withdraw' && (
        <WithdrawModal wallet={modal.wallet} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />
      )}
    </div>
  );
}
