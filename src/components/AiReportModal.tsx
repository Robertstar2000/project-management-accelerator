import React, { useState } from 'react';
import { parseMarkdown } from '../utils/markdownParser';

interface AiReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
    onAddToDocuments: (title: string, content: string) => void;
}

export const AiReportModal: React.FC<AiReportModalProps> = ({ isOpen, onClose, title, content, onAddToDocuments }) => {
    const [copyButtonText, setCopyButtonText] = useState('Copy to Clipboard');

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(content).then(() => {
            setCopyButtonText('Copied!');
            setTimeout(() => setCopyButtonText('Copy to Clipboard'), 2000);
        }, (err) => {
            console.error('Could not copy text: ', err);
            setCopyButtonText('Copy Failed');
             setTimeout(() => setCopyButtonText('Copy to Clipboard'), 2000);
        });
    };
    
    const handleDownload = () => {
        const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    };
    
    const handleAddToProject = () => {
        onAddToDocuments(title, content);
        onClose(); // Close modal after adding
    };

    const parsedContent = parseMarkdown(content);

    return (
        <div className="modal-overlay" onClick={onClose} style={{ backdropFilter: 'blur(12px)', background: 'rgba(15, 23, 42, 0.85)' }}>
            <div className="modal-content glass-card" style={{ 
                maxWidth: '900px', 
                maxHeight: '85vh', 
                display: 'flex', 
                flexDirection: 'column', 
                padding: '2rem',
                border: '1px solid var(--accent-color)',
                boxShadow: '0 0 30px rgba(129, 140, 248, 0.2)',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                
                {/* Neon accent line at top */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'var(--primary-gradient)', boxShadow: '0 0 10px var(--accent-glow)' }}></div>

                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexShrink: 0}}>
                    <h2 id="ai-report-title" style={{ fontSize: '1.8rem', background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{title}</h2>
                    <button onClick={onClose} className="button-close" aria-label="Close" style={{ fontSize: '2rem' }}>&times;</button>
                </div>
                
                <div className="ai-report-body" style={{ 
                    flexGrow: 1, 
                    overflowY: 'auto', 
                    background: 'rgba(15, 23, 42, 0.4)', 
                    padding: '2rem', 
                    borderRadius: 'var(--radius-sm)', 
                    border: '1px solid var(--card-border)',
                    lineHeight: '1.8',
                    fontSize: '1rem',
                    color: 'var(--primary-text)',
                    marginBottom: '1.5rem',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'var(--accent-color) transparent'
                }}>
                    <div className="markdown-content">
                        {parsedContent}
                    </div>
                </div>
                
                <div className="modal-actions" style={{ 
                    justifyContent: 'space-between', 
                    flexShrink: 0, 
                    alignItems: 'center', 
                    flexWrap: 'wrap', 
                    gap: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--card-border)'
                }}>
                    <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                        <button type="button" className="button" onClick={handleCopy} style={{ minWidth: '160px' }}>{copyButtonText}</button>
                        <button type="button" className="button" onClick={handleDownload}>Download (.md)</button>
                    </div>
                    <div style={{display: 'flex', gap: '1rem', flexWrap: 'wrap'}}>
                        <button type="button" className="button button-primary" onClick={handleAddToProject}>Add to Project Documents</button>
                        <button type="button" className="button" onClick={onClose}>Dismiss</button>
                    </div>
                </div>
            </div>
        </div>
    );
};