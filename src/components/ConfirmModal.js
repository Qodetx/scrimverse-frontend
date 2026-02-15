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
        <div className="modal-header">
          <h2 className="gradient-text">{title}</h2>
          <button type="button" className="close-btn" onClick={onClose}>
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
