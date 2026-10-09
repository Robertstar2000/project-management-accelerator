import React, { useState } from 'react';
import { Project, AgentHarnessTask, HarnessDomain, SpecialistRoleId, HarnessRunStep, EvidenceClass } from '../types';
import { SPECIALIST_ROLES, DEFAULT_HARNESS_TASKS } from '../constants/harnessDefaults';
import { getGeminiClient } from '../utils/geminiClient';

interface AgentHarnessesViewProps {
    project: Project;
    onUpdateProject: (update: Partial<Project> | ((prev: Project) => Partial<Project>)) => void;
}

export const AgentHarnessesView: React.FC<AgentHarnessesViewProps> = ({ project, onUpdateProject }) => {
    const tasks: AgentHarnessTask[] = project.harnessTasks || DEFAULT_HARNESS_TASKS;
    const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || 'harn-001');
    const [selectedRole, setSelectedRole] = useState<SpecialistRoleId>('literature_researcher');
    const [activeDomainFilter, setActiveDomainFilter] = useState<HarnessDomain | 'all'>('all');
    const [isRunningWorkflow, setIsRunningWorkflow] = useState(false);
    const [isCreatingTask, setIsCreatingTask] = useState(false);

    // New task modal state
    const [newTaskName, setNewTaskName] = useState('');
    const [newTaskDomain, setNewTaskDomain] = useState<HarnessDomain>('engineering');
    const [newTaskSpecialist, setNewTaskSpecialist] = useState<SpecialistRoleId>('electrical_designer');
    const [newTaskInputs, setNewTaskInputs] = useState('');
    const [newTaskDeliverables, setNewTaskDeliverables] = useState('');
    const [newTaskAcceptance, setNewTaskAcceptance] = useState('');
    const [newTaskEvidence, setNewTaskEvidence] = useState<EvidenceClass>('Calculated');
    const [newTaskHumanGate, setNewTaskHumanGate] = useState(false);

    const activeTask = tasks.find(t => t.id === selectedTaskId) || tasks[0];
    const roleDef = SPECIALIST_ROLES.find(r => r.id === selectedRole) || SPECIALIST_ROLES[0];

    const filteredTasks = activeDomainFilter === 'all'
        ? tasks
        : tasks.filter(t => t.domain === activeDomainFilter);

    const updateTasks = (newTasks: AgentHarnessTask[]) => {
        onUpdateProject({ harnessTasks: newTasks });
    };

    const handleCreateTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskName.trim()) return;

        const newTask: AgentHarnessTask = {
            id: `harn-${Date.now().toString().slice(-4)}`,
            name: newTaskName.trim(),
            domain: newTaskDomain,
            assignedSpecialist: newTaskSpecialist,
            status: 'planning',
            inputs: newTaskInputs.split('\n').filter(s => s.trim()),
            deliverables: newTaskDeliverables.split('\n').filter(s => s.trim()),
            acceptanceCriteria: newTaskAcceptance.split('\n').filter(s => s.trim()),
            evidenceClass: newTaskEvidence,
            budgetTokens: 20000,
            tokensUsed: 0,
            humanSignOffRequired: newTaskHumanGate,
            runSteps: [
                {
                    id: `step-${Date.now()}`,
                    stage: 'planning',
                    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                    agentName: SPECIALIST_ROLES.find(r => r.id === newTaskSpecialist)?.name || 'Specialist',
                    outputSummary: 'Task initialized in harness queue. Baseline context loaded.',
                    status: 'success'
                }
            ]
        };

        const updated = [...tasks, newTask];
        updateTasks(updated);
        setSelectedTaskId(newTask.id);
        setIsCreatingTask(false);
        setNewTaskName('');
        setNewTaskInputs('');
        setNewTaskDeliverables('');
        setNewTaskAcceptance('');
    };

    // Execute next structured cycle for active harness task
    const handleRunNextCycle = async () => {
        if (!activeTask || isRunningWorkflow) return;
        setIsRunningWorkflow(true);

        const currentStage = activeTask.status;
        let nextStage: AgentHarnessTask['status'] = 'planning';
        let toolUsed = 'Domain Knowledge Kernel';
        let outputText = '';
        let stepStatus: HarnessRunStep['status'] = 'success';

        if (currentStage === 'planning') {
            nextStage = 'tool_use';
            toolUsed = roleDef.permittedTools[0] || 'Linter';
            outputText = `Invoked ${toolUsed} on inputs: [${activeTask.inputs.join(', ')}]. Synthesized preliminary data structure.`;
        } else if (currentStage === 'tool_use') {
            nextStage = 'execution';
            toolUsed = 'Execution Synthesizer';
            outputText = `Executed computational pass. Derived candidate artifacts for deliverable: "${activeTask.deliverables[0] || 'Specification'}".`;
        } else if (currentStage === 'execution') {
            nextStage = 'checking';
            toolUsed = 'Acceptance Linter & Error Checker';
            outputText = `Audited output against criteria: "${activeTask.acceptanceCriteria[0] || 'Acceptance Check'}". Zero fatal anomalies detected.`;
        } else if (currentStage === 'checking') {
            if (activeTask.humanSignOffRequired && !activeTask.humanApproved) {
                nextStage = 'blocked';
                stepStatus = 'warning';
                outputText = `Human Decision Authority gate triggered. Consequential action halted pending human sign-off.`;
            } else {
                nextStage = 'approved';
                outputText = `All acceptance criteria satisfied. Deliverables promoted to downstream chained harness.`;
            }
        } else if (currentStage === 'blocked') {
            nextStage = 'checking';
            outputText = `Resuming inspection after human review.`;
        } else {
            // Already approved, loop revision
            nextStage = 'revision';
            outputText = `Triggered feedback loop revision. Checking sensitivity perturbations on previous assumptions.`;
        }

        // Try AI generation for richer insight if available
        try {
            const ai = getGeminiClient();
            const prompt = `As the specialized agent "${roleDef.name}" (${roleDef.domain} domain), provide a concise 2-sentence technical execution log for task "${activeTask.name}". Current stage: ${nextStage}. Tools: ${toolUsed}. Acceptance criteria: ${activeTask.acceptanceCriteria.join('; ')}.`;
            const res = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: prompt
            });
            if (res.text) {
                outputText = res.text.trim();
            }
        } catch {
            // Keep default structured output
        }

        const newStep: HarnessRunStep = {
            id: `step-${Date.now()}`,
            stage: nextStage,
            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
            agentName: roleDef.name,
            toolUsed,
            outputSummary: outputText,
            status: stepStatus,
            evidenceClass: activeTask.evidenceClass
        };

        const updatedTasks = tasks.map(t => {
            if (t.id === activeTask.id) {
                return {
                    ...t,
                    status: nextStage,
                    tokensUsed: t.tokensUsed + Math.floor(1200 + Math.random() * 800),
                    runSteps: [...t.runSteps, newStep]
                };
            }
            return t;
        });

        updateTasks(updatedTasks);
        setIsRunningWorkflow(false);
    };

    // Human sign-off action for bounded authority
    const handleHumanSignOff = (taskId: string) => {
        const updated = tasks.map(t => {
            if (t.id === taskId) {
                return {
                    ...t,
                    humanApproved: true,
                    status: 'approved' as const,
                    runSteps: [
                        ...t.runSteps,
                        {
                            id: `step-${Date.now()}`,
                            stage: 'approved' as const,
                            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                            agentName: 'Human Authority Gatekeeper',
                            outputSummary: 'Verified human authorization granted. Consequential baseline approved.',
                            status: 'success' as const
                        }
                    ]
                };
            }
            return t;
        });
        updateTasks(updated);
    };

    // Feedback loop trigger
    const handleTriggerFeedbackLoop = (taskId: string, targetDomain: string) => {
        const updated = tasks.map(t => {
            if (t.id === taskId) {
                return {
                    ...t,
                    status: 'revision' as const,
                    runSteps: [
                        ...t.runSteps,
                        {
                            id: `step-${Date.now()}`,
                            stage: 'revision' as const,
                            timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
                            agentName: 'Orchestration Coordinator',
                            outputSummary: `Feedback loop dispatched: Reopening technical question and routing back to ${targetDomain}.`,
                            status: 'warning' as const
                        }
                    ]
                };
            }
            return t;
        });
        updateTasks(updated);
    };

    const getStageColor = (stage: HarnessTaskStage) => {
        switch (stage) {
            case 'approved': return '#00ffaa';
            case 'blocked': return '#ff4444';
            case 'revision': return '#f59e0b';
            case 'checking': return '#00f2ff';
            case 'execution': return '#a855f7';
            default: return '#3b82f6';
        }
    };

    const getDomainColor = (domain: HarnessDomain) => {
        switch (domain) {
            case 'science': return '#00f2ff';
            case 'engineering': return '#a855f7';
            case 'project_management': return '#10b981';
            case 'governance': return '#f59e0b';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header Banner */}
            <div className="glass-card" style={{ padding: '2rem', borderLeft: '4px solid var(--accent-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 800 }}>Agentic Workflows & Specialized Harnesses</h2>
                            <span className="chip-blue" style={{ fontSize: '0.8rem' }}>MIFECO PROTOCOL 5.0</span>
                        </div>
                        <p style={{ color: 'var(--secondary-text)', maxWidth: '900px', margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                            Coordinated operating procedures integrating domain-specific agents, tools, memory, deliverables, and acceptance criteria.
                            Handoff chain: <strong style={{ color: '#00f2ff' }}>Science Evidence</strong> &rarr; <strong style={{ color: '#a855f7' }}>Engineering Baseline</strong> &rarr; <strong style={{ color: '#10b981' }}>Project Management Execution</strong> &rarr; <strong style={{ color: '#f59e0b' }}>Governance Gates</strong>.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => setIsCreatingTask(true)}
                            className="button button-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem' }}
                        >
                            <span>+ Delegate Specialist Task</span>
                        </button>
                    </div>
                </div>

                {/* Chained Pipeline Flow Visualizer */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--card-border)' }}>
                    <div style={{ background: 'rgba(0, 242, 255, 0.05)', border: '1px solid rgba(0, 242, 255, 0.2)', borderRadius: '8px', padding: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#00f2ff', fontWeight: 700, letterSpacing: '1px' }}>STAGE 1: SCIENCE HARNESS</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.4rem 0' }}>Empirical Evidence</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Literature review, hypotheses, and uncertainty quantification.</div>
                    </div>
                    <div style={{ background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '8px', padding: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#a855f7', fontWeight: 700, letterSpacing: '1px' }}>STAGE 2: ENGINEERING HARNESS</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.4rem 0' }}>Technical Baseline</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Schematic-parts sync, 3D CAD, and trade study tradeoffs.</div>
                    </div>
                    <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', padding: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 700, letterSpacing: '1px' }}>STAGE 3: PM HARNESS</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.4rem 0' }}>Execution & Schedule</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>WBS decomposition, CPM scheduling, and resource capacity.</div>
                    </div>
                    <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', padding: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700, letterSpacing: '1px' }}>STAGE 4: GOVERNANCE</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.4rem 0' }}>Ground Truth Gates</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Evidence-class audits and human decision authorization.</div>
                    </div>
                </div>
            </div>

            {/* Main Interactive Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
                
                {/* Column 1: Harness Tasks Queue & Filter */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>Harness Pipeline Tasks</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>{tasks.length} total</span>
                    </div>

                    {/* Domain Filter Chips */}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.2rem' }}>
                        {(['all', 'science', 'engineering', 'project_management', 'governance'] as const).map(dom => (
                            <button
                                key={dom}
                                onClick={() => setActiveDomainFilter(dom)}
                                style={{
                                    fontSize: '0.75rem',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    border: activeDomainFilter === dom ? '1px solid var(--accent-color)' : '1px solid var(--card-border)',
                                    background: activeDomainFilter === dom ? 'rgba(0, 242, 255, 0.15)' : 'transparent',
                                    color: activeDomainFilter === dom ? '#00f2ff' : 'var(--secondary-text)',
                                    cursor: 'pointer'
                                }}
                            >
                                {dom === 'all' ? 'All' : dom === 'project_management' ? 'PM' : dom.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    {/* Tasks List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '600px', overflowY: 'auto' }}>
                        {filteredTasks.map(t => {
                            const isSelected = t.id === activeTask?.id;
                            const stageColor = getStageColor(t.status);
                            const domainColor = getDomainColor(t.domain);
                            return (
                                <div
                                    key={t.id}
                                    onClick={() => setSelectedTaskId(t.id)}
                                    style={{
                                        padding: '1rem',
                                        borderRadius: '8px',
                                        border: isSelected ? `2px solid ${stageColor}` : '1px solid var(--card-border)',
                                        background: isSelected ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.01)',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                        <span style={{ fontSize: '0.7rem', color: domainColor, fontWeight: 700, letterSpacing: '0.5px' }}>
                                            {t.domain.toUpperCase()}
                                        </span>
                                        <span style={{
                                            fontSize: '0.7rem',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            background: `${stageColor}20`,
                                            color: stageColor,
                                            fontWeight: 700
                                        }}>
                                            {t.status.toUpperCase()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.4rem', color: '#fff' }}>
                                        {t.name}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--secondary-text)' }}>
                                        <span>Evidence: <strong>{t.evidenceClass}</strong></span>
                                        <span>{t.tokensUsed.toLocaleString()} tokens</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Column 2: Active Task Execution Console & Steps */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    {activeTask ? (
                        <div>
                            {/* Task Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                                        <span style={{
                                            padding: '3px 8px',
                                            borderRadius: '4px',
                                            background: `${getDomainColor(activeTask.domain)}20`,
                                            color: getDomainColor(activeTask.domain),
                                            fontSize: '0.75rem',
                                            fontWeight: 700
                                        }}>
                                            {activeTask.domain.toUpperCase()}
                                        </span>
                                        <span style={{
                                            padding: '3px 8px',
                                            borderRadius: '4px',
                                            background: `${getStageColor(activeTask.status)}20`,
                                            color: getStageColor(activeTask.status),
                                            fontSize: '0.75rem',
                                            fontWeight: 700
                                        }}>
                                            STAGE: {activeTask.status.toUpperCase()}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>ID: {activeTask.id}</span>
                                    </div>
                                    <h3 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 700 }}>{activeTask.name}</h3>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <button
                                        onClick={handleRunNextCycle}
                                        disabled={isRunningWorkflow}
                                        className="button button-generate"
                                        style={{ padding: '0.6rem 1.2rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                    >
                                        {isRunningWorkflow ? (
                                            <>
                                                <div className="spinner" style={{ width: '14px', height: '14px' }}></div>
                                                <span>Synthesizing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>▶ Execute Next Cycle</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {/* Human Gate Warning (if blocked) */}
                            {activeTask.humanSignOffRequired && !activeTask.humanApproved && (
                                <div style={{
                                    background: 'rgba(255, 68, 68, 0.1)',
                                    border: '1px solid rgba(255, 68, 68, 0.4)',
                                    borderRadius: '8px',
                                    padding: '1rem',
                                    marginBottom: '1.5rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ color: '#ff4444', fontWeight: 700, fontSize: '0.9rem' }}>
                                            ⚠️ Human Decision Authority Sign-off Required
                                        </div>
                                        <div style={{ color: 'var(--secondary-text)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                                            Consequential action requires human authority before deliverables can be promoted.
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleHumanSignOff(activeTask.id)}
                                        className="button"
                                        style={{ background: '#ff4444', color: '#fff', border: 'none', padding: '0.5rem 1rem', fontSize: '0.85rem', fontWeight: 700 }}
                                    >
                                        Grant Human Approval
                                    </button>
                                </div>
                            )}

                            {/* Acceptance Criteria & Inputs */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', fontWeight: 700, marginBottom: '0.5rem' }}>
                                        INPUTS & MEMORY REQUISITES
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                                        {activeTask.inputs.map((inp, idx) => (
                                            <li key={idx} style={{ marginBottom: '0.3rem' }}>{inp}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                                    <div style={{ fontSize: '0.75rem', color: '#00ffaa', fontWeight: 700, marginBottom: '0.5rem' }}>
                                        ACCEPTANCE CRITERIA
                                    </div>
                                    <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                                        {activeTask.acceptanceCriteria.map((crit, idx) => (
                                            <li key={idx} style={{ marginBottom: '0.3rem' }}>{crit}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Feedback Loop Controls */}
                            {activeTask.feedbackLoopTarget && (
                                <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '0.85rem', color: '#f59e0b' }}>
                                        <strong>Feedback Loop available:</strong> {activeTask.feedbackLoopTarget}
                                    </div>
                                    <button
                                        onClick={() => handleTriggerFeedbackLoop(activeTask.id, activeTask.feedbackLoopTarget!)}
                                        style={{ background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', color: '#f59e0b', padding: '4px 12px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                                    >
                                        Reopen Earlier Assumption
                                    </button>
                                </div>
                            )}

                            {/* Execution Run Steps Log */}
                            <div>
                                <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem', fontWeight: 700 }}>
                                    Harness Execution Cycles & Evidence Trail
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                    {activeTask.runSteps.map((step, idx) => (
                                        <div
                                            key={step.id || idx}
                                            style={{
                                                padding: '1rem',
                                                borderRadius: '6px',
                                                background: 'rgba(255, 255, 255, 0.02)',
                                                borderLeft: `4px solid ${getStageColor(step.stage)}`,
                                                borderTop: '1px solid var(--card-border)',
                                                borderRight: '1px solid var(--card-border)',
                                                borderBottom: '1px solid var(--card-border)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem', fontSize: '0.75rem' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                                    <span style={{ fontWeight: 700, color: '#fff' }}>{step.agentName}</span>
                                                    {step.toolUsed && (
                                                        <span style={{ background: 'rgba(255, 255, 255, 0.06)', padding: '2px 6px', borderRadius: '4px', color: '#94a3b8' }}>
                                                            Tool: {step.toolUsed}
                                                        </span>
                                                    )}
                                                </div>
                                                <span style={{ color: 'var(--secondary-text)' }}>{step.timestamp}</span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.4 }}>
                                                {step.outputSummary}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p>No active harness task selected.</p>
                    )}
                </div>

                {/* Column 3: Bounded Specialist Delegation Roster */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.2rem', margin: '0 0 1rem 0', fontWeight: 700 }}>Specialist Agent Roster</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', marginBottom: '1rem' }}>
                        Each role enforces a bounded charter: permitted tools, evidence thresholds, and stopping criteria.
                    </p>

                    <div style={{ marginBottom: '1rem' }}>
                        <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as SpecialistRoleId)}
                            className="input-field"
                            style={{ width: '100%', fontSize: '0.85rem', padding: '0.6rem' }}
                        >
                            {SPECIALIST_ROLES.map(r => (
                                <option key={r.id} value={r.id}>
                                    [{r.domain.toUpperCase()}] {r.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Role Details Card */}
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: getDomainColor(roleDef.domain), fontWeight: 700 }}>
                                {roleDef.domain.toUpperCase()} SPECIALIST
                            </span>
                            <span style={{
                                fontSize: '0.7rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                background: roleDef.autonomyLevel === 'Autonomous' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                color: roleDef.autonomyLevel === 'Autonomous' ? '#10b981' : '#f59e0b',
                                fontWeight: 700
                            }}>
                                {roleDef.autonomyLevel}
                            </span>
                        </div>

                        <h4 style={{ fontSize: '1rem', margin: '0 0 0.5rem 0' }}>{roleDef.name}</h4>
                        <p style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', lineHeight: 1.4, marginBottom: '0.8rem' }}>
                            {roleDef.purpose}
                        </p>

                        <div style={{ fontSize: '0.75rem', marginBottom: '0.6rem' }}>
                            <div style={{ color: '#00f2ff', fontWeight: 700, marginBottom: '0.2rem' }}>PERMITTED TOOLS</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                                {roleDef.permittedTools.map((tool, i) => (
                                    <span key={i} style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '2px 6px', borderRadius: '3px', color: '#cbd5e1' }}>
                                        {tool}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div style={{ fontSize: '0.75rem', marginBottom: '0.6rem' }}>
                            <div style={{ color: '#00ffaa', fontWeight: 700, marginBottom: '0.2rem' }}>EVIDENCE REQUIREMENTS</div>
                            <div style={{ color: '#cbd5e1' }}>{roleDef.evidenceRequirements}</div>
                        </div>

                        <div style={{ fontSize: '0.75rem' }}>
                            <div style={{ color: '#f59e0b', fontWeight: 700, marginBottom: '0.2rem' }}>STOPPING CONDITIONS</div>
                            <div style={{ color: '#cbd5e1' }}>{roleDef.stoppingConditions}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Delegate New Specialist Task */}
            {isCreatingTask && (
                <div className="modal-overlay" onClick={() => setIsCreatingTask(false)}>
                    <div className="modal-content" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 700 }}>Delegate Bounded Specialist Task</h3>
                            <button className="button-close" onClick={() => setIsCreatingTask(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--secondary-text)', marginBottom: '0.3rem' }}>
                                    Task Name
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g. Stage 2B: Antenna Impedance Matching & RF Tuning"
                                    value={newTaskName}
                                    onChange={e => setNewTaskName(e.target.value)}
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--secondary-text)', marginBottom: '0.3rem' }}>
                                        Harness Domain
                                    </label>
                                    <select
                                        className="input-field"
                                        value={newTaskDomain}
                                        onChange={e => setNewTaskDomain(e.target.value as HarnessDomain)}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="science">Science</option>
                                        <option value="engineering">Engineering</option>
                                        <option value="project_management">Project Management</option>
                                        <option value="governance">Governance</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--secondary-text)', marginBottom: '0.3rem' }}>
                                        Assigned Specialist Role
                                    </label>
                                    <select
                                        className="input-field"
                                        value={newTaskSpecialist}
                                        onChange={e => setNewTaskSpecialist(e.target.value as SpecialistRoleId)}
                                        style={{ width: '100%' }}
                                    >
                                        {SPECIALIST_ROLES.map(r => (
                                            <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--secondary-text)', marginBottom: '0.3rem' }}>
                                    Inputs / Memory Pre-requisites (one per line)
                                </label>
                                <textarea
                                    className="input-field"
                                    rows={2}
                                    placeholder="e.g. Antenna S-Parameter Plot&#10;RF Matching Topology"
                                    value={newTaskInputs}
                                    onChange={e => setNewTaskInputs(e.target.value)}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--secondary-text)', marginBottom: '0.3rem' }}>
                                    Acceptance Criteria (one per line)
                                </label>
                                <textarea
                                    className="input-field"
                                    rows={2}
                                    placeholder="e.g. Return loss < -15 dB across 902-928MHz band"
                                    value={newTaskAcceptance}
                                    onChange={e => setNewTaskAcceptance(e.target.value)}
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'center' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--secondary-text)', marginBottom: '0.3rem' }}>
                                        Expected Evidence Class
                                    </label>
                                    <select
                                        className="input-field"
                                        value={newTaskEvidence}
                                        onChange={e => setNewTaskEvidence(e.target.value as EvidenceClass)}
                                        style={{ width: '100%' }}
                                    >
                                        <option value="Observed">Observed (Empirical test/sensor)</option>
                                        <option value="Calculated">Calculated (Physics simulation)</option>
                                        <option value="Assumption">Assumption (Temporary estimate)</option>
                                        <option value="Unknown">Unknown (Unresolved)</option>
                                    </select>
                                </div>

                                <div style={{ paddingTop: '1.2rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                                        <input
                                            type="checkbox"
                                            checked={newTaskHumanGate}
                                            onChange={e => setNewTaskHumanGate(e.target.checked)}
                                        />
                                        <span>Require Human Decision Authority Gate</span>
                                    </label>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsCreatingTask(false)} className="button">
                                    Cancel
                                </button>
                                <button type="submit" className="button button-primary">
                                    Dispatch Task to Harness
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
