
import React, { useState, useEffect, useMemo } from 'react';
import { parseMarkdown } from '../utils/markdownParser';
import { downloadLogs } from '../utils/logging';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('helpme.md')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.text();
            })
            .then(text => {
                setContent(text);
                setIsLoading(false);
            })
            .catch(error => {
                console.error('Error fetching help content:', error);
                setContent('Could not load help content. Please try again later.');
                setIsLoading(false);
            });
    }, []);

    const parsedContent = useMemo(() => parseMarkdown(content), [content]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content help-modal-content" onClick={(e) => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Mission Support</h2>
                    <button className="button-close" onClick={onClose} aria-label="Close help">&times;</button>
                </div>
                
                <div className="help-modal-body">
                    {isLoading ? <p>Loading help...</p> : parsedContent}
                </div>
                
                <div className="modal-actions" style={{justifyContent: 'space-between', marginTop: '2rem', borderTop: '1px solid var(--card-border)', paddingTop: '1.5rem'}}>
                    <button type="button" className="button" onClick={downloadLogs} style={{borderColor: 'var(--warning-color)', color: 'var(--warning-color)', fontSize: '0.9rem'}}>
                        Download Debug Logs
                    </button>
                    <button type="button" className="button button-primary" onClick={onClose}>Return to App</button>
                </div>
            </div>
        </div>
    );
};
