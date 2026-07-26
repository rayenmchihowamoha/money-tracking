const BASE = '/api';

function getToken() {
  return localStorage.getItem('mt_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    throw new Error(body?.error || `Request failed (${res.status})`);
  }
  return body;
}

export const api = {
  // profiles / auth
  listProfiles: () => request('/profiles'),
  createProfile: (name, pin) =>
    request('/profiles', { method: 'POST', body: JSON.stringify({ name, pin }) }),
  login: (profileId, pin) =>
    request('/login', { method: 'POST', body: JSON.stringify({ profileId, pin }) }),

  // wallets
  listWallets: () => request('/wallets'),
  createWallet: (name, currency) =>
    request('/wallets', { method: 'POST', body: JSON.stringify({ name, currency }) }),
  archiveWallet: (id) => request(`/wallets/${id}`, { method: 'DELETE' }),
  deleteWallet: (id) => request(`/wallets/${id}?hard=true`, { method: 'DELETE' }),

  // transactions
  listTransactions: (walletId) =>
    request(walletId ? `/transactions?walletId=${walletId}` : '/transactions'),
  addTransaction: (payload) =>
    request('/transactions', { method: 'POST', body: JSON.stringify(payload) }),
  updateTransaction: (id, payload) =>
    request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),

  // transfers
  createTransfer: (payload) =>
    request('/transfers', { method: 'POST', body: JSON.stringify(payload) }),

  // debts
  listDebts: () => request('/debts'),
  createDebt: (payload) =>
    request('/debts', { method: 'POST', body: JSON.stringify(payload) }),
  payDebt: (debtId, payload) =>
    request(`/debts/${debtId}/payments`, { method: 'POST', body: JSON.stringify(payload) }),
  deleteDebt: (id) => request(`/debts/${id}`, { method: 'DELETE' }),
};

export function setToken(token) {
  localStorage.setItem('mt_token', token);
}
export function clearToken() {
  localStorage.removeItem('mt_token');
}
export function isLoggedIn() {
  return !!getToken();
}
