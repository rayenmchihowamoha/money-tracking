import React from 'react';

const NOTES = [2000, 1000, 500, 200, 100, 50, 20, 10, 5];

// value shape: null (unknown) OR { [denom]: qty, ... }
export default function DenominationPicker({ amount, value, onChange, allowUnknown = true, label = 'Cash breakdown' }) {
  const isUnknown = allowUnknown && value === null;

  const sum = isUnknown
    ? 0
    : Object.entries(value || {}).reduce((acc, [denom, qty]) => acc + Number(denom) * Number(qty || 0), 0);

  function setQty(denom, qty) {
    const next = { ...(value || {}) };
    if (!qty || Number(qty) === 0) {
      delete next[denom];
    } else {
      next[denom] = Number(qty);
    }
    onChange(next);
  }

  const amountNum = Number(amount || 0);
  const matches = amountNum > 0 && sum === amountNum;

  return (
    <div>
      <label style={{ marginBottom: 8 }}>
        <span>{label}{!allowUnknown ? ' *' : ' (optional)'}</span>
      </label>
      {allowUnknown && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button
            type="button"
            className={`btn btn-sm ${isUnknown ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onChange(null)}
          >
            Unknown
          </button>
          <button
            type="button"
            className={`btn btn-sm ${!isUnknown ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => onChange(value || {})}
          >
            Specify bills
          </button>
        </div>
      )}

      {!isUnknown && (
        <>
          <div className="denom-grid">
            {NOTES.map((denom) => (
              <div className="denom-chip" key={denom}>
                <span>{denom} DA</span>
                <input
                  type="number"
                  min="0"
                  value={value?.[denom] || ''}
                  onChange={(e) => setQty(denom, e.target.value)}
                />
              </div>
            ))}
          </div>
          <div className={`denom-sum ${amountNum ? (matches ? 'match' : 'mismatch') : ''}`}>
            Sum: {sum} DA {amountNum ? (matches ? '✓ matches amount' : `— amount is ${amountNum} DA`) : ''}
          </div>
        </>
      )}
    </div>
  );
}
