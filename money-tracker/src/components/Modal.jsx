import React from 'react';

export default function Modal({ title, onClose, children }) {
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div className="modal-head">
          <h3 style={{ fontSize: 18 }}>{title}</h3>
          <button className="close-x" onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
