import React from 'react';
import './ConfirmModal.css';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  type = 'danger',
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content confirm-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header — matches mcm-header style */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid hsl(var(--border) / 0.2)',
          }}
        >
          <h2
            className="gradient-text"
            style={{ margin: 0, fontSize: '1.125rem', fontWeight: 700 }}
          >
            {title}
          </h2>
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: 'hsl(var(--muted-foreground))',
              fontSize: '1rem',
              cursor: 'pointer',
              width: '2rem',
              height: '2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '0.375rem',
              transition: 'all 0.2s',
            }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <p className="confirm-message">{message}</p>
          <div className="confirm-actions">
            <button className="confirm-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className={`confirm-btn-action ${type}`}
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
