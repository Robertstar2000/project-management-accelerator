
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { parseMarkdown } from '../utils/markdownParser';
import { GRAPHICAL_ARTIFACTS } from '../constants/projectData';
import { Project, PhaseBlocker } from '../types';
import { RunningManAnimation } from './RunningManAnimation';
import { getPhaseBlockers, savePhaseBlockers, updateBlockerStatus } from '../utils/phaseBlockers';

interface PhaseCardProps {
    phase: { id: string; title: string; description: string; originalPhaseId: string; };
    project: Project;
    phaseData: string | undefined;
    images?: string[];
    selectedArtifacts?: string[];
    attachments: Array<{ name: string, data: string }>;
    updatePhaseData: (phaseId: string, content: string) => void;
    isLocked: boolean;
    lockReason: string | null;
    onGenerate: (phaseId: string, currentContent: string) => void;
    onGenerateImages: (phaseId: string, artifacts: string[], content: string) => void;
    onChatToChange: (phaseId: string, instruction: string) => void;
    onComplete: (phaseId: string) => void;
    onAttachFile: (phaseId: string, fileData: { name: string, data: string }) => void;
    onRemoveAttachment: (phaseId: string, fileName: string) => void;
    onAutoResolve?: (phaseId: string, blockerDescription: string, blockerId: string) => void;
    onMitigateBlocker?: (phaseId: string, blockerId: string) => void;
    status: 'locked' | 'completed' | 'todo' | 'failed';
    isLoading: boolean;
    loadingStep: 'generating' | 'compacting' | 'imaging' | null;
    isOpen: boolean;
    onToggleOpen: () => void;
}

export const PhaseCard: React.FC<PhaseCardProps> = React.memo(({ 
    phase, 
    project,
    phaseData, 
    images = [], 
    selectedArtifacts = [], 
    attachments, 
    updatePhaseData, 
    isLocked, 
    lockReason, 
    onGenerate, 
    onGenerateImages, 
    onChatToChange, 
    onComplete, 
    onAttachFile, 
    onRemoveAttachment, 
    onAutoResolve,
    onMitigateBlocker,
    status, 
    isLoading, 
    loadingStep, 
    isOpen, 
    onToggleOpen 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(phaseData || '');
    const [chatInput, setChatInput] = useState('');
    const [localSelectedArtifacts, setLocalSelectedArtifacts] = useState<string[]>(selectedArtifacts);
    const descriptionFileInputRef = useRef<HTMLInputElement>(null);
    const attachmentFileInputRef = useRef<HTMLInputElement>(null);
    const approveButtonRef = useRef<HTMLButtonElement>(null);

    // Blockers state
    const [blockers, setBlockers] = useState<PhaseBlocker[]>(() => {
        return getPhaseBlockers(project.id, phase.id, phase.originalPhaseId);
    });
    const [newBlockerInput, setNewBlockerInput] = useState('');
    const [isAddingBlocker, setIsAddingBlocker] = useState(false);

    // Sync blockers if external update occurs
    useEffect(() => {
        const handleBlockerSync = (e: any) => {
            if (e.detail?.projectId === project.id && e.detail?.phaseId === phase.id) {
                setBlockers(e.detail.blockers);
            }
        };
        window.addEventListener('hmap-blocker-updated', handleBlockerSync);
        return () => window.removeEventListener('hmap-blocker-updated', handleBlockerSync);
    }, [project.id, phase.id]);

    const handleUserMitigate = (blockerId: string) => {
        const updated = updateBlockerStatus(project.id, phase.id, blockerId, 'user_mitigated', phase.originalPhaseId);
        setBlockers(updated);
        if (onMitigateBlocker) {
            onMitigateBlocker(phase.id, blockerId);
        }
    };

    const handleAutoResolveClick = (blockerId: string, description: string) => {
        if (onAutoResolve) {
            onAutoResolve(phase.id, description, blockerId);
        } else {
            onChatToChange(phase.id, `Please resolve the following blocker: ${description}. Update the phase specifications and deliverables accordingly to eliminate this blocker.`);
            const updated = updateBlockerStatus(project.id, phase.id, blockerId, 'auto_resolved', phase.originalPhaseId);
            setBlockers(updated);
        }
    };

    const handleAddBlocker = (e: React.FormEvent) => {
        e.preventDefault();
        if (newBlockerInput.trim()) {
            const newB: PhaseBlocker = {
                id: `BLK-${phase.id}-${Date.now()}`,
                description: newBlockerInput.trim(),
                severity: 'high',
                status: 'active',
                detectedAt: new Date().toISOString()
            };
            const updated = [newB, ...blockers];
            setBlockers(updated);
            savePhaseBlockers(project.id, phase.id, updated);
            setNewBlockerInput('');
            setIsAddingBlocker(false);
        }
    };
    
    // Scroll to approve button when generation finishes
    useEffect(() => {
        if (!isLoading && phaseData && !isEditing && status !== 'completed') {
            // Small timeout to ensure DOM is updated
            setTimeout(() => {
                approveButtonRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 500);
        }
    }, [isLoading, phaseData, isEditing, status]);
    
    // Memoize the expensive markdown parsing operation
    const parsedContent = useMemo(() => {
        if (phaseData && !isEditing) {
            return parseMarkdown(phaseData);
        }
        return null;
    }, [phaseData, isEditing]);

    useEffect(() => {
        setEditedContent(phaseData || '');
        if (isLoading) {
            setIsEditing(false);
        }
    }, [phaseData, isLoading]);

    useEffect(() => {
        setLocalSelectedArtifacts(selectedArtifacts);
    }, [selectedArtifacts]);
    
    const handleToggle = () => {
        if (!isLocked) {
            onToggleOpen();
        }
    };
    
    const handleSave = () => {
        updatePhaseData(phase.id, editedContent);
        setIsEditing(false);
    };

    const handleChatSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (chatInput.trim()) {
            onChatToChange(phase.id, chatInput);
            setChatInput('');
        }
    };

    const toggleArtifact = (artifact: string) => {
        setLocalSelectedArtifacts(prev => {
            if (prev.includes(artifact)) {
                return prev.filter(a => a !== artifact);
            }
            if (prev.length < 3) {
                return [...prev, artifact];
            }
            return prev;
        });
    };

    const handleGenerateGraphics = () => {
        if (localSelectedArtifacts.length > 0) {
            onGenerateImages(phase.id, localSelectedArtifacts, phaseData || editedContent);
        }
    };

    const handleDescriptionFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'text/plain') {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                updatePhaseData(phase.id, text);
            };
            reader.readAsText(file);
        } else if (file) {
            alert('Please select a .txt file.');
        }
        if (event.target) event.target.value = '';
    };

    const handleAttachmentFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = e.target?.result as string;
                onAttachFile(phase.id, { name: file.name, data });
            };
            reader.readAsDataURL(file);
        }
        if (event.target) event.target.value = '';
    };

    const placeholderText = phase.originalPhaseId === 'phase1'
        ? "Enter or paste here project expectations, then push Generate Content..."
        : `Content for ${phase.title} will appear here...`;

    const isHighlightable = phaseData && phaseData.trim().length > 100 && status !== 'completed' && !isLoading && images.length > 0;
        
    return (
        <div className={`phase-card ${isLocked ? 'locked' : ''} ${status}`}>
             <div className="phase-header" onClick={handleToggle} role="button" tabIndex={0} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleToggle()} aria-expanded={isOpen}>
                <div>
                    <h3 id={`phase-title-${phase.id}`}>{phase.title}</h3>
                    <p style={{color: 'var(--secondary-text)', fontSize: '0.9rem'}}>{phase.description}</p>
                    {isLocked && lockReason && <p className="lock-reason">{lockReason}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {isLoading && <RunningManAnimation compact={true} stepName="Synthesizing..." />}
                    <span className={`phase-status ${isLocked ? 'locked' : status}`}>
                        {isLocked ? 'Locked' : status}
                    </span>
                </div>
            </div>
            {!isLocked && isOpen && (
                <div className="phase-content" role="region" aria-labelledby={`phase-title-${phase.id}`}>
                    {isLoading && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <RunningManAnimation 
                                label={
                                    loadingStep === 'compacting' ? 'Compacting deliverable content...' : 
                                    loadingStep === 'imaging' ? 'Rendering graphical artifact(s)...' :
                                    'Synthesizing phase documentation and specifications...'
                                } 
                                stepName={phase.title} 
                            />
                        </div>
                    )}

                    {(!isLoading || phaseData) && (
                        <>
                            {isEditing ? (
                                <textarea 
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    placeholder={placeholderText}
                                    style={{ minHeight: '300px' }}
                                />
                            ) : phaseData ? (
                                <div className="display-content p-responsive" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                                    {parsedContent}
                                </div>
                            ) : !isLoading && (
                                <textarea 
                                    value={editedContent}
                                    onChange={(e) => setEditedContent(e.target.value)}
                                    placeholder={placeholderText}
                                    style={{ minHeight: '150px' }}
                                />
                            )}
                        </>
                    )}

                    {images.length > 0 && (
                        <div className="artifact-preview" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '2rem' }}>
                            {images.map((img, i) => (
                                <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--card-border)' }}>
                                    <img src={img} alt={`Artifact ${i+1}`} style={{ width: '100%', height: 'auto', display: 'block' }} />
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Phase Blockers Section */}
                    {!isLoading && !isEditing && (
                        <div className="phase-blockers-card" style={{
                            marginTop: '2rem',
                            padding: '1.25rem',
                            borderRadius: '10px',
                            background: blockers.some(b => b.status === 'active') ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.04)',
                            border: blockers.some(b => b.status === 'active') ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(16, 185, 129, 0.3)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '1.1rem' }}>
                                        {blockers.some(b => b.status === 'active') ? '🚨' : '🛡️'}
                                    </span>
                                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
                                        Phase Blockers & Technical Constraints
                                    </h4>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        padding: '2px 8px',
                                        borderRadius: '100px',
                                        fontWeight: 700,
                                        background: blockers.some(b => b.status === 'active') ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                        color: blockers.some(b => b.status === 'active') ? '#ef4444' : '#10b981'
                                    }}>
                                        {blockers.filter(b => b.status === 'active').length} Active
                                    </span>
                                </div>

                                <button
                                    onClick={() => setIsAddingBlocker(!isAddingBlocker)}
                                    className="button button-small"
                                    style={{ fontSize: '0.75rem', padding: '3px 10px' }}
                                >
                                    {isAddingBlocker ? 'Cancel' : '+ Add Blocker'}
                                </button>
                            </div>

                            {isAddingBlocker && (
                                <form onSubmit={handleAddBlocker} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Describe technical blocker or constraint..."
                                        value={newBlockerInput}
                                        onChange={(e) => setNewBlockerInput(e.target.value)}
                                        style={{ flex: 1, padding: '6px 10px', fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--card-border)', borderRadius: '4px', color: '#fff' }}
                                    />
                                    <button type="submit" className="button button-small button-primary">Add Blocker</button>
                                </form>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {blockers.map((blocker) => {
                                    const isActive = blocker.status === 'active';
                                    const isUserMitigated = blocker.status === 'user_mitigated';

                                    return (
                                        <div
                                            key={blocker.id}
                                            style={{
                                                padding: '0.85rem 1rem',
                                                borderRadius: '8px',
                                                background: isActive ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                                                border: isActive ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                flexWrap: 'wrap',
                                                gap: '0.75rem'
                                            }}
                                        >
                                            <div style={{ flex: 1, minWidth: '240px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                                    <span style={{
                                                        fontSize: '0.65rem',
                                                        padding: '1px 6px',
                                                        borderRadius: '3px',
                                                        fontWeight: 800,
                                                        background: blocker.severity === 'critical' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)',
                                                        color: blocker.severity === 'critical' ? '#ff5555' : '#f59e0b'
                                                    }}>
                                                        {blocker.severity ? blocker.severity.toUpperCase() : 'BLOCKER'}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        fontWeight: 700,
                                                        color: isActive ? '#ef4444' : isUserMitigated ? '#10b981' : '#00f2ff'
                                                    }}>
                                                        {isActive ? '● Active Blocker' : isUserMitigated ? '✓ User Mitigated' : '⚡ Auto Resolved'}
                                                    </span>
                                                </div>
                                                <div style={{ fontSize: '0.85rem', color: isActive ? '#fff' : '#94a3b8', lineHeight: 1.4 }}>
                                                    {blocker.description}
                                                </div>
                                                {blocker.resolutionNotes && (
                                                    <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '2px', fontStyle: 'italic' }}>
                                                        {blocker.resolutionNotes}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action buttons: User Mitigated (formerly Resolve) & Auto Resolve */}
                                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                {isActive ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleUserMitigate(blocker.id)}
                                                            className="button button-small"
                                                            title="Mark this blocker as resolved / mitigated by user"
                                                            style={{
                                                                background: 'rgba(16, 185, 129, 0.15)',
                                                                border: '1px solid #10b981',
                                                                color: '#10b981',
                                                                fontSize: '0.75rem',
                                                                fontWeight: 700,
                                                                padding: '6px 12px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            User Mitigated
                                                        </button>

                                                        <button
                                                            onClick={() => handleAutoResolveClick(blocker.id, blocker.description)}
                                                            disabled={isLoading}
                                                            className="button button-small button-generate"
                                                            title={`Re-run ${phase.title} inserting instructions to resolve this blocker`}
                                                            style={{
                                                                fontSize: '0.75rem',
                                                                fontWeight: 700,
                                                                padding: '6px 14px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            <span>⚡ Auto Resolve</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => {
                                                            const updated = updateBlockerStatus(project.id, phase.id, blocker.id, 'active', phase.originalPhaseId, 'Reopened');
                                                            setBlockers(updated);
                                                        }}
                                                        className="button button-small"
                                                        style={{ fontSize: '0.7rem', color: 'var(--secondary-text)', padding: '3px 8px' }}
                                                    >
                                                        Reopen
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {phaseData && !isLoading && !isEditing && (
                        <div className="p-responsive" style={{ marginTop: '2rem', background: 'rgba(0,242,255,0.03)', borderRadius: '8px', border: '1px dashed var(--accent-color)' }}>
                            <h4 style={{ marginBottom: '1rem', color: 'var(--accent-color)' }}>Graphical Artifacts (Select up to 3)</h4>
                            <div className="selection-group" style={{ marginBottom: '1.5rem' }}>
                                {GRAPHICAL_ARTIFACTS.map(artifact => (
                                    <button 
                                        key={artifact} 
                                        className={`button button-small ${localSelectedArtifacts.includes(artifact) ? 'button-primary' : ''}`}
                                        onClick={() => toggleArtifact(artifact)}
                                        style={{ textTransform: 'none' }}
                                    >
                                        {artifact}
                                    </button>
                                ))}
                            </div>
                            <button className="button button-generate" onClick={handleGenerateGraphics} disabled={localSelectedArtifacts.length === 0}>
                                Generate Graphics
                            </button>
                        </div>
                    )}
                    
                    <div className="phase-actions" style={{ marginTop: '2rem' }}>
                        <button className="button button-generate" onClick={() => onGenerate(phase.id, editedContent)} disabled={isLoading || status === 'completed'}>
                            {phaseData ? 'Regenerate Content' : 'Generate Content'}
                        </button>
                        
                        {phase.originalPhaseId === 'phase1' && (
                            <button className="button" onClick={() => descriptionFileInputRef.current?.click()} disabled={isLoading || status === 'completed'}>
                                Upload .txt
                            </button>
                        )}
                        
                        {!isLoading && (
                            <>
                                {phaseData && !isEditing && <button className="button" onClick={() => setIsEditing(true)}>Edit Text</button>}
                                {isEditing && <button className="button button-primary" onClick={handleSave}>Save & Sync Graphics</button>}
                            </>
                        )}
                        
                        <input type="file" ref={descriptionFileInputRef} style={{ display: 'none' }} onChange={handleDescriptionFileChange} accept=".txt" />
                    </div>

                    {phaseData && !isLoading && !isEditing && (
                        <form onSubmit={handleChatSubmit} style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                            <input 
                                type="text" 
                                value={chatInput} 
                                onChange={e => setChatInput(e.target.value)} 
                                placeholder="Chat to change: 'Make it more technical' or 'Focus on security'..."
                                style={{ flex: 1 }}
                            />
                            <button type="submit" className="button button-generate">Apply AI Changes</button>
                        </form>
                    )}
                    
                    <div className="attachments-section" style={{ marginTop: '2rem', paddingTop: '1.5rem' }}>
                        <h4 style={{ marginBottom: '0.75rem', color: 'var(--secondary-text)' }}>Support Documents</h4>
                        {attachments.length > 0 ? (
                            <ul className="attachment-list">
                                {attachments.map(file => (
                                    <li key={file.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '4px', marginBottom: '0.5rem' }}>
                                        <span>{file.name}</span>
                                        <button onClick={() => onRemoveAttachment(phase.id, file.name)} className="button button-small button-danger">&times;</button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p style={{ color: 'var(--secondary-text)', fontSize: '0.9rem', fontStyle: 'italic' }}>No files attached.</p>
                        )}
                        <button className="button button-small" onClick={() => attachmentFileInputRef.current?.click()} style={{ marginTop: '0.5rem' }}>📎 Attach File</button>
                        <input type="file" ref={attachmentFileInputRef} style={{ display: 'none' }} onChange={handleAttachmentFileChange} />
                    </div>

                    {phaseData && !isEditing && (
                        <div style={{ marginTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1rem' }}>
                                {(phaseData && images.length > 0) ? (
                                    <p style={{ color: 'var(--neon-yellow)', fontSize: '0.9rem', textAlign: 'right', maxWidth: '600px', opacity: 0.9 }}>
                                        When you have reviewed, edited, added graphics and made any Ai changes needed press the button, then please be patient while the next document and graphic is created
                                    </p>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                    <div className="spinner" style={{ width: '20px', height: '20px' }}></div>
                                        <span style={{ color: 'var(--secondary-text)', fontSize: '0.85rem' }}>Waiting for content and graphics to be finalized...</span>
                                    </div>
                                )}
                                <button 
                                    ref={approveButtonRef}
                                    className={`button ${isHighlightable ? 'button-highlight-approval' : ''}`} 
                                    onClick={() => onComplete(phase.id)} 
                                    disabled={status === 'completed' || isLoading || !phaseData || images.length === 0}
                                    style={{ 
                                        padding: '1.2rem 3rem',
                                        fontSize: '1.1rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.75rem'
                                    }}
                                >
                                    {(!phaseData || images.length === 0) && <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div>}
                                    Mark as Approved
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

PhaseCard.displayName = 'PhaseCard';