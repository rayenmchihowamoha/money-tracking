import React from 'react';
import Modal from './Modal.jsx';

const NOTES = [2000, 1000, 500, 200, 100, 50, 20, 10, 5];

function computeInventory(txns) {
  const totals = {};
  let knownNet = 0;
  let unknownNet = 0;
  for (const t of txns) {
    const sign = t.type === 'deposit' ? 1 : -1;
    if (t.denomination_breakdown && typeof t.denomination_breakdown === 'object') {
      for (const [denom, qty] of Object.entries(t.denomination_breakdown)) {
        totals[denom] = (totals[denom] || 0) + sign * Number(qty);
      }
      knownNet += sign * Number(t.amount);
    } else {
      unknownNet += sign * Number(t.amount);
    }
  }
  return { totals, knownNet, unknownNet };
}

export default function WalletBillsModal({ wallet, txns, onClose }) {
  const { totals, knownNet, unknownNet } = computeInventory(txns);
  const rows = NOTES
    .map((denom) => ({ denom, qty: totals[denom] || 0 }))
    .filter((r) => r.qty !== 0);

  return (
    <Modal title={`Bills in "${wallet.name}"`} onClose={onClose}>
      <div>
        {rows.length === 0 && (
          <div className="empty-state" style={{ padding: '20px 0' }}>
            No specified bills yet — deposits/withdrawals here didn't record which notes were used.
          </div>
        )}
        {rows.map(({ denom, qty }) => (
          <div className="txn-row" key={denom}>
            <span>{denom} DA × {qty}</span>
            <span className="amount">{(Number(denom) * qty).toLocaleString()} DA</span>
          </div>
        ))}
        {rows.length > 0 && (
          <div className="txn-row" style={{ fontWeight: 700 }}>
            <span>Specified total</span>
            <span className="amount">{knownNet.toLocaleString()} DA</span>
          </div>
        )}
        {unknownNet !== 0 && (
          <div className="txn-meta" style={{ marginTop: 10 }}>
            + {unknownNet.toLocaleString()} DA from entries where bills weren't specified.
          </div>
        )}
        <button className="btn btn-outline btn-block" style={{ marginTop: 20 }} onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
