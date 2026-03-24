
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { parseMarkdown } from '../utils/markdownParser';
import { GRAPHICAL_ARTIFACTS } from '../constants/projectData';
import { Project } from '../types';

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
    status: 'locked' | 'completed' | 'todo' | 'failed';
    isLoading: boolean;
    loadingStep: 'generating' | 'compacting' | 'imaging' | null;
    isOpen: boolean;
    onToggleOpen: () => void;
}

export const PhaseCard: React.FC<PhaseCardProps> = React.memo(({ phase, phaseData, images = [], selectedArtifacts = [], attachments, updatePhaseData, isLocked, lockReason, onGenerate, onGenerateImages, onChatToChange, onComplete, onAttachFile, onRemoveAttachment, status, isLoading, loadingStep, isOpen, onToggleOpen }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(phaseData || '');
    const [chatInput, setChatInput] = useState('');
    const [localSelectedArtifacts, setLocalSelectedArtifacts] = useState<string[]>(selectedArtifacts);
    const descriptionFileInputRef = useRef<HTMLInputElement>(null);
    const attachmentFileInputRef = useRef<HTMLInputElement>(null);
    const approveButtonRef = useRef<HTMLButtonElement>(null);
    
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
                <span className={`phase-status ${isLocked ? 'locked' : status}`}>
                    {isLocked ? 'Locked' : status}
                </span>
            </div>
            {!isLocked && isOpen && (
                <div className="phase-content" role="region" aria-labelledby={`phase-title-${phase.id}`}>
                    {isLoading && (
                        <div className="status-message loading" role="status" style={{ 
                            marginBottom: phaseData ? '1rem' : '2rem', 
                            padding: phaseData ? '1rem' : '0', 
                            background: phaseData ? 'rgba(255,255,255,0.05)' : 'transparent', 
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem'
                        }}>
                            <div className="spinner" style={phaseData ? { width: '24px', height: '24px' } : {}}></div>
                            <p style={phaseData ? { margin: 0, fontSize: '0.9rem' } : {}}>
                                {loadingStep === 'compacting' ? 'Compacting content...' : 
                                 loadingStep === 'imaging' ? 'Generating graphical artifacts...' :
                                 'Generating content...'}
                            </p>
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