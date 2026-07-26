import React from 'react';
import Modal from './Modal.jsx';

function Row({ label, value }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--hairline, #eee)' }}>
      <span style={{ color: 'var(--ink-soft)' }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

export default function TransactionDetailModal({ txn, wallet, onClose }) {
  const isDeposit = txn.type === 'deposit';
  const denoms = txn.denomination_breakdown;

  let whoLabel = 'To / who';
  if (isDeposit) whoLabel = 'Source';
  if (txn.linked_transfer_id) whoLabel = isDeposit ? 'Transferred from' : 'Transferred to';
  if (txn.linked_debt_id) whoLabel = 'Person';

  return (
    <Modal title="Transaction details" onClose={onClose}>
      <div>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div className={`amount txn-amount ${txn.type}`} style={{ fontSize: 28 }}>
            {isDeposit ? '+' : '−'}{Number(txn.amount).toLocaleString()} {wallet?.currency}
          </div>
          <div className="txn-meta">{txn.date}</div>
        </div>

        <Row label="Type" value={isDeposit ? 'Deposit' : 'Withdrawal'} />
        <Row label="Reason" value={txn.reason} />
        <Row label={whoLabel} value={txn.source_or_target} />
        {txn.linked_debt_id && <Row label="Linked to" value="A debt entry" />}
        {txn.linked_transfer_id && <Row label="Linked to" value="A wallet transfer" />}

        {denoms && Object.keys(denoms).length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Cash breakdown</div>
            <div className="denom-grid">
              {Object.entries(denoms)
                .sort((a, b) => Number(b[0]) - Number(a[0]))
                .map(([denom, qty]) => (
                  <div className="denom-chip" key={denom}>
                    <span>{denom} DA × {qty}</span>
                    <span style={{ fontWeight: 600 }}>{Number(denom) * Number(qty)}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
        {denoms === null && (
          <div className="txn-meta" style={{ marginTop: 12 }}>Cash breakdown was recorded as "unknown".</div>
        )}

        <button className="btn btn-outline btn-block" style={{ marginTop: 20 }} onClick={onClose}>Close</button>
      </div>
    </Modal>
  );
}
