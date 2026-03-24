
import React, { useEffect, useRef } from 'react';
import { Project, User } from '../types';

interface NewProjectModalProps {
    isOpen: boolean;
    onClose: () => void;
    projects: Project[];
    onSelectProject: (project: Project) => void;
    onRequestDelete: (project: Project) => void;
    currentUser: User | null;
    initialTab?: 'select' | 'create';
    onCreateProject: (data: any) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ 
    isOpen, onClose, projects, onSelectProject, onRequestDelete
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (isOpen) {
        modalRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{maxWidth: '800px'}} onClick={(e) => e.stopPropagation()} ref={modalRef} tabIndex={-1}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '2.4rem' }}>Mission Database</h2>
            <button className="button-close" onClick={onClose}>&times;</button>
        </div>

        <div className="project-list-section">
            <p style={{ color: 'var(--secondary-text)', marginBottom: '2rem' }}>Choose an active project workspace to continue operations.</p>
            {projects.length > 0 ? (
                <ul style={{listStyle: 'none'}}>
                    {projects.map(p => (
                        <li key={p.id} style={{display: 'flex', justifyContent: 'space-between', padding: '2rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--card-border)', borderRadius: '12px', marginBottom: '1.5rem', alignItems: 'center'}}>
                            <div>
                                <h4 style={{fontSize: '1.8rem', marginBottom: '0.4rem'}}>{p.name}</h4>
                                <span className="chip-blue">{p.discipline}</span>
                            </div>
                            <div style={{display: 'flex', gap: '1rem'}}>
                                <button onClick={() => onSelectProject(p)} className="button button-primary">Open</button>
                                <button onClick={() => onRequestDelete(p)} className="button button-danger">Delete</button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div style={{ textAlign: 'center', padding: '4rem' }}>
                    <p style={{ fontSize: '1.2rem', opacity: 0.6 }}>No active missions found in database.</p>
                </div>
            )}
        </div>
        
        <div className="modal-actions" style={{ justifyContent: 'center', marginTop: '2rem' }}>
            <button className="button" onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>↩</span> Return to Command
            </button>
        </div>
      </div>
    </div>
  );
};
