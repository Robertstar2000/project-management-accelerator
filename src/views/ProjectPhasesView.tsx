import React, { useState } from 'react';
import { PhaseCard } from '../components/PhaseCard';

export const ProjectPhasesView = ({ project, projectPhases, phasesData, documents, error, loadingPhase, handleUpdatePhaseData, handleCompletePhase, handleGenerateContent, handleGenerateImages, handleChatToChange, handleAttachFile, handleRemoveAttachment, generationMode, onSetGenerationMode, isAutoGenerating, onBasicPlan, isBasicPlanRunning }) => {
    const [openPhases, setOpenPhases] = useState(() => {
        try {
            const firstTodoDoc = documents.find(d => d.status !== 'Approved');
            const defaultOpen = firstTodoDoc ? [firstTodoDoc.id] : (projectPhases.length > 0 ? [projectPhases[0].id] : []);
            const saved = localStorage.getItem(`hmap-open-phases-${project.id}`);
            return saved ? JSON.parse(saved) : defaultOpen;
        } catch (e) {
            return [];
        }
    });

    const togglePhaseOpen = (docId: string) => {
        const newOpenPhases = openPhases.includes(docId)
            ? openPhases.filter(id => id !== docId)
            : [...openPhases, docId];
        setOpenPhases(newOpenPhases);
        localStorage.setItem(`hmap-open-phases-${project.id}`, JSON.stringify(newOpenPhases));
    };

    const onPhaseComplete = (docId) => {
        handleCompletePhase(docId);
        
        const currentIndex = projectPhases.findIndex(p => p.id === docId);
        if (currentIndex !== -1 && currentIndex < projectPhases.length - 1) {
            const nextPhaseId = projectPhases[currentIndex + 1].id;
            
            setOpenPhases(prev => {
                if (prev.includes(nextPhaseId)) return prev;
                const newOpen = [...prev, nextPhaseId];
                localStorage.setItem(`hmap-open-phases-${project.id}`, JSON.stringify(newOpen));
                return newOpen;
            });

            setTimeout(() => {
                const el = document.getElementById(`phase-title-${nextPhaseId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                // Auto-start generation for the next document
                handleGenerateContent(nextPhaseId, '');
            }, 100);
        }
    };

    const getLockStatus = (docId) => {
        const docIndex = projectPhases.findIndex(p => p.id === docId);
        if (docIndex <= 0) return { isLocked: false, lockReason: null };
        
        const prevDocInSequence = projectPhases[docIndex - 1];
        const prevDocData = documents.find(d => d.id === prevDocInSequence.id);
        const prevDocContent = phasesData[prevDocInSequence.id]?.content;
        
        // Unlocks if the previous document HAS content, even if not yet approved
        const isPrevDocSubstantiallyReady = prevDocData?.status === 'Approved' || (prevDocContent && prevDocContent.trim().length > 100);

        if (!isPrevDocSubstantiallyReady) {
            return { isLocked: true, lockReason: `Requires content generation for "${prevDocData.title}".` };
        }
        return { isLocked: false, lockReason: null };
    };

    const isPhase1Complete = documents.filter(d => d.phase === 1).every(d => d.status === 'Approved');

    const [isPlanSelected, setIsPlanSelected] = useState(false);

    return (
        <div>
            {error && <div className="status-message error" style={{marginBottom: '2rem'}}>{error}</div>}
            
            <p style={{ color: 'var(--neon-yellow)', fontSize: '0.9rem', marginBottom: '2rem', opacity: 0.9, lineHeight: '1.4' }}>
                Each document needs to be generated (written by AI) and then as the planner you need to review and edit. 
                You can do this by manual edits or by telling the chat what you want to change. 
                When satisfied, mark the document as complete to unlock the next document. 
                Start by entering what you want to do and then push Generate Content.
            </p>

            {projectPhases.map((phase) => {
                const doc = documents.find(d => d.id === phase.id);
                if (!doc) return null;
                const { isLocked, lockReason } = getLockStatus(phase.id);
                const status = isLocked ? 'locked' : doc?.status === 'Approved' ? 'completed' : 'todo';
                const pData = phasesData[phase.id];
                const isFirstPhase = phase.originalPhaseId === 'phase1';

                return (
                    <div key={phase.id}>
                        <PhaseCard
                            phase={phase}
                            project={project}
                            phaseData={pData?.content}
                            images={pData?.images || []}
                            selectedArtifacts={pData?.selectedArtifacts || []}
                            attachments={pData?.attachments || []}
                            updatePhaseData={handleUpdatePhaseData}
                            isLocked={isLocked}
                            lockReason={lockReason}
                            onGenerate={handleGenerateContent}
                            onGenerateImages={handleGenerateImages}
                            onChatToChange={handleChatToChange}
                            onComplete={onPhaseComplete}
                            onAttachFile={handleAttachFile}
                            onRemoveAttachment={handleRemoveAttachment}
                            status={status}
                            isLoading={loadingPhase?.docId === phase.id}
                            loadingStep={loadingPhase?.docId === phase.id ? loadingPhase.step : null}
                            isOpen={openPhases.includes(phase.id)}
                            onToggleOpen={() => togglePhaseOpen(phase.id)}
                        />
                        
                        {isFirstPhase && !isPlanSelected && generationMode !== 'automatic' && (
                            <div className="tool-card" style={{ margin: '2rem 0 3rem', border: '1px solid var(--accent-color)', boxShadow: '0 0 20px var(--accent-glow)' }}>
                                <h3 className="subsection-title">Select Planning Strategy</h3>
                                <div className="selection-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                setIsPlanSelected(true);
                                                onBasicPlan();
                                            }} 
                                            className="selection-button"
                                            disabled={isBasicPlanRunning || isAutoGenerating}
                                            style={{ height: 'auto', padding: '1.5rem' }}
                                        >
                                            <strong style={{ fontSize: '1.2rem' }}>Basic Plan</strong>
                                        </button>
                                        <p style={{ color: '#FDE047', fontSize: '0.9rem', lineHeight: '1.4', textAlign: 'center' }}>
                                            This is for easy projects, proposals or general planning.
                                        </p>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                onSetGenerationMode('manual');
                                                setIsPlanSelected(true);
                                            }} 
                                            className="selection-button"
                                            disabled={isBasicPlanRunning || isAutoGenerating}
                                            style={{ height: 'auto', padding: '1.5rem' }}
                                        >
                                            <strong style={{ fontSize: '1.2rem' }}>Plan and Run your Project</strong>
                                        </button>
                                        <p style={{ color: '#FDE047', fontSize: '0.9rem', lineHeight: '1.4', textAlign: 'center' }}>
                                            You will be guided through the Planning process, allowing you to tune each part of the project and then a automated project managing and tracing capability will be setup.
                                        </p>
                                    </div>
                                </div>
                                {isBasicPlanRunning && (
                                    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                                        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
                                        <p style={{ color: 'var(--accent-color)' }}>Executing Automated Synthesis... Generating all documents and artifacts.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
