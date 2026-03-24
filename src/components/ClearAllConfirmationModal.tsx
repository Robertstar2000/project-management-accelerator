import React, { useState, useEffect, useRef } from 'react';

interface ClearAllConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const ClearAllConfirmationModal: React.FC<ClearAllConfirmationModalProps> = ({ isOpen, onClose, onConfirm }) => {
    const [confirmationInput, setConfirmationInput] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const CONFIRMATION_TEXT = 'DELETE ALL PROJECTS';

    const isConfirmed = confirmationInput === CONFIRMATION_TEXT;

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="clear-all-modal-title">
                <h2 id="clear-all-modal-title" style={{ color: 'var(--error-color)' }}>Warning: Clear All Data</h2>
                <p className="modal-warning-text">
                    You are about to permanently delete <strong>ALL</strong> projects and their associated data. This action cannot be undone.
                </p>
                <p style={{ color: 'var(--secondary-text)', marginBottom: '1.5rem' }}>
                    To proceed, please type &quot;<strong>{CONFIRMATION_TEXT}</strong>&quot; below to confirm.
                </p>
                <div className="form-group">
                    <label htmlFor="clearAllConfirmationInput">Confirmation Text</label>
                    <input
                        id="clearAllConfirmationInput"
                        ref={inputRef}
                        type="text"
                        value={confirmationInput}
                        onChange={(e) => setConfirmationInput(e.target.value)}
                        placeholder={CONFIRMATION_TEXT}
                        autoComplete="off"
                    />
                </div>
                <div className="modal-actions">
                    <button type="button" className="button" onClick={onClose}>Cancel</button>
                    <button
                        type="button"
                        className="button button-danger"
                        onClick={onConfirm}
                        disabled={!isConfirmed}
                    >
                        Clear All Data
                    </button>
                </div>
            </div>
        </div>
    );
};
