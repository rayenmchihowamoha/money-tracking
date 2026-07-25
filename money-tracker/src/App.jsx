import React, { useState } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import WalletDetail from './pages/WalletDetail.jsx';
import Debts from './pages/Debts.jsx';
import History from './pages/History.jsx';
import { isLoggedIn, clearToken } from './api.js';

function TopBar() {
  const location = useLocation();
  return (
    <div className="topbar">
      <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
        <span className="brand-mark">Ledger</span>
        <span className="brand-sub">family accounts</span>
      </Link>
      <div style={{ display: 'flex', gap: 18, alignItems: 'center', fontSize: 14 }}>
        <Link to="/" style={{ fontWeight: location.pathname === '/' ? 600 : 400 }}>Dashboard</Link>
        <Link to="/history" style={{ fontWeight: location.pathname === '/history' ? 600 : 400 }}>History</Link>
        <Link to="/debts" style={{ fontWeight: location.pathname === '/debts' ? 600 : 400 }}>Debts</Link>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => { clearToken(); window.location.reload(); }}
        >
          Switch profile
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());

  if (!loggedIn) {
    return <Login onLoggedIn={() => setLoggedIn(true)} />;
  }

  return (
    <HashRouter>
      <div className="app-shell">
        <TopBar />
        <div className="container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/wallet/:id" element={<WalletDetail />} />
            <Route path="/debts" element={<Debts />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </div>
      </div>
    </HashRouter>
  );
}
