
import React from 'react';

interface DownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    zipBlob: Blob | null;
    projectName: string;
}

export const DownloadModal: React.FC<DownloadModalProps> = ({ isOpen, onClose, zipBlob, projectName }) => {
    if (!isOpen) return null;

    const handleDownload = () => {
        if (!zipBlob) return;
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${projectName.replace(/[^a-z0-9]/gi, '_')}_Basic_Plan.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content" style={{ textAlign: 'center', maxWidth: '500px' }}>
                <h2 className="subsection-title" style={{ color: 'var(--accent-color)', marginBottom: '1.5rem' }}>Basic Plan Ready</h2>
                <p style={{ color: 'var(--secondary-text)', marginBottom: '2rem' }}>
                    Your automated project documentation and technical artifacts have been generated and packaged.
                </p>
                
                <div style={{ 
                    background: 'rgba(255,255,255,0.03)', 
                    padding: '1.5rem', 
                    borderRadius: 'var(--radius-sm)', 
                    border: '1px solid var(--card-border)',
                    marginBottom: '2rem'
                }}>
                    <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Package Contents:</p>
                    <ul style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', listStyle: 'none', padding: 0 }}>
                        <li>✓ Full Project Documentation (.md)</li>
                        <li>✓ Technical Diagrams & Artifacts (.png)</li>
                        <li>✓ Project Structure & Metadata</li>
                    </ul>
                </div>

                <div className="modal-actions" style={{ justifyContent: 'center' }}>
                    <button className="button button-primary" onClick={handleDownload} style={{ padding: '1rem 2rem' }}>
                        Download ZIP Package
                    </button>
                </div>
            </div>
        </div>
    );
};
