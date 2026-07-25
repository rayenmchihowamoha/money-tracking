import React, { useEffect, useState } from 'react';
import { api, setToken } from '../api.js';

export default function Login({ onLoggedIn }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // profile or 'new'
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listProfiles().then(setProfiles).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { token } = await api.login(selected.id, pin);
      setToken(token);
      onLoggedIn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    if (!name.trim() || pin.length < 4) {
      setError('Name and a PIN of at least 4 digits are required.');
      return;
    }
    setBusy(true);
    try {
      const { token } = await api.createProfile(name.trim(), pin);
      setToken(token);
      onLoggedIn();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-shell">
      <div className="login-mark">Ledger<span>.</span></div>

      {!selected && (
        <div className="profile-grid">
          {loading && <p>Loading profiles…</p>}
          {!loading && profiles.map((p) => (
            <button
              key={p.id}
              className="profile-tile"
              onClick={() => { setSelected(p); setPin(''); setError(''); }}
            >
              <div className="profile-avatar">{p.name.charAt(0).toUpperCase()}</div>
              <div>{p.name}</div>
            </button>
          ))}
          <button
            className="profile-tile new"
            onClick={() => { setSelected('new'); setPin(''); setName(''); setError(''); }}
          >
            <div className="profile-avatar">+</div>
            <div>New profile</div>
          </button>
        </div>
      )}

      {selected === 'new' && (
        <form className="pin-form" onSubmit={handleCreate}>
          <h2 style={{ fontSize: 18 }}>Create a profile</h2>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </label>
          <label>
            PIN (4+ digits)
            <input type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value)} />
          </label>
          {error && <div className="error-text">{error}</div>}
          <button className="btn btn-primary btn-block" disabled={busy}>Create & continue</button>
          <button type="button" className="btn btn-outline btn-block" onClick={() => setSelected(null)}>Back</button>
        </form>
      )}

      {selected && selected !== 'new' && (
        <form className="pin-form" onSubmit={handleLogin}>
          <h2 style={{ fontSize: 18 }}>Hi, {selected.name}</h2>
          <label>
            PIN
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
            />
          </label>
          {error && <div className="error-text">{error}</div>}
          <button className="btn btn-primary btn-block" disabled={busy}>Unlock</button>
          <button type="button" className="btn btn-outline btn-block" onClick={() => setSelected(null)}>Back</button>
        </form>
      )}
    </div>
  );
}
