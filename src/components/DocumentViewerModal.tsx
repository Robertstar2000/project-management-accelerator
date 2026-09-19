
import React from 'react';
import { parseMarkdown } from '../utils/markdownParser';

interface DocumentViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
    type?: 'text' | 'image';
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ isOpen, onClose, title, content, type = 'text' }) => {
    if (!isOpen) return null;

    const isImage = type === 'image' || content.startsWith('data:image');
    const parsedContent = isImage ? null : parseMarkdown(content || 'No content available for this document.');

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" style={{ maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0}}>
                    <h2 id="document-viewer-title">{title}</h2>
                    <button onClick={onClose} className="button-close" aria-label="Close">&times;</button>
                </div>
                
                <div className="display-content" style={{ flexGrow: 1, overflowY: 'auto', background: 'var(--background-color)', padding: '1.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', textAlign: isImage ? 'center' : 'left'}}>
                    {isImage ? (
                        <img 
                            src={content} 
                            alt={title} 
                            style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', border: '1px solid var(--card-border)' }} 
                        />
                    ) : (
                        parsedContent
                    )}
                </div>
                
                <div className="modal-actions" style={{justifyContent: 'flex-end', flexShrink: 0, paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)'}}>
                    <button type="button" className="button button-primary" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>←</span> Return
                    </button>
                </div>
            </div>
        </div>
    );
};
