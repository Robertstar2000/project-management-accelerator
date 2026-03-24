
import React from 'react';

interface ProjectStateDownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    projectName: string;
}

export const ProjectStateDownloadModal: React.FC<ProjectStateDownloadModalProps> = ({ isOpen, onClose, onConfirm, projectName }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
                    <h2>Download Project State</h2>
                    <button onClick={onClose} className="button-close">&times;</button>
                </div>
                
                <p style={{marginBottom: '1.5rem', color: 'var(--secondary-text)'}}>
                    You are about to download a ZIP archive containing the current state of: <strong style={{color: 'var(--primary-text)'}}>{projectName}</strong>
                </p>

                <div style={{background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: 'var(--radius-sm)', marginBottom: '2rem'}}>
                    <p style={{fontSize: '0.9rem', marginBottom: '0.5rem', fontWeight: 600}}>Included in the archive:</p>
                    <ul style={{fontSize: '0.85rem', color: 'var(--secondary-text)', paddingLeft: '1.5rem'}}>
                        <li>Timeline (Gantt Chart Data)</li>
                        <li>Task List (Full details)</li>
                        <li>Kanban Board (Status-based)</li>
                        <li>Workload (Resource allocation)</li>
                        <li>Milestones (Critical path)</li>
                        <li>Team (Roles and assignments)</li>
                        <li>Resources (Budget and costs)</li>
                    </ul>
                </div>

                <div className="modal-actions" style={{justifyContent: 'flex-end'}}>
                    <button className="button" onClick={onClose}>Cancel</button>
                    <button className="button button-primary" onClick={onConfirm}>
                        Download ZIP Archive
                    </button>
                </div>
            </div>
        </div>
    );
};
