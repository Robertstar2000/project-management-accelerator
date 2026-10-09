import React, { useState, useMemo } from 'react';
import { Project, RACIRole, RACIActivityItem, Task } from '../types';
import { 
    STANDARD_RACI_ROLES, 
    DEFAULT_RACI_ACTIVITIES, 
    RACI_LEGEND, 
    applyRaciDefaultsToTasks,
    matchTaskToRaciActivity,
    getDefaultResourceAllocations 
} from '../constants/raciDefaults';

interface RaciMatrixViewProps {
    project: Project;
    onUpdateProject?: (p: Partial<Project>) => void;
    onUpdateTask?: (taskId: string, updates: Partial<Task>) => void;
}

export const RaciMatrixView: React.FC<RaciMatrixViewProps> = ({ 
    project, 
    onUpdateProject,
    onUpdateTask 
}) => {
    // Current matrix data (saved on project or defaults from chart)
    const [matrixData, setMatrixData] = useState<RACIActivityItem[]>(() => {
        return project.raciMatrix && project.raciMatrix.length > 0 
            ? project.raciMatrix 
            : DEFAULT_RACI_ACTIVITIES;
    });

    const [selectedPhase, setSelectedPhase] = useState<string>('All');
    const [viewMode, setViewMode] = useState<'template' | 'project_tasks'>('template');
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const phases = useMemo(() => [
        'All',
        'Initiation Phase',
        'Planning Phase',
        'Execution Phase',
        'Monitoring & Control Phase',
        'Closure Phase'
    ], []);

    const filteredActivities = useMemo(() => {
        if (selectedPhase === 'All') return matrixData;
        return matrixData.filter(a => a.phase === selectedPhase);
    }, [matrixData, selectedPhase]);

    // Statistics per role
    const roleStats = useMemo(() => {
        const stats: Record<string, { R: number; A: number; C: number; I: number; total: number }> = {};
        STANDARD_RACI_ROLES.forEach(r => {
            stats[r.title] = { R: 0, A: 0, C: 0, I: 0, total: 0 };
        });

        matrixData.forEach(act => {
            Object.entries(act.assignments).forEach(([role, code]) => {
                if (stats[role] && code) {
                    stats[role][code] = (stats[role][code] || 0) + 1;
                    stats[role].total += 1;
                }
            });
        });

        return stats;
    }, [matrixData]);

    const handleCycleRoleCode = (activityId: string, roleTitle: string) => {
        const sequence: (RACIRole | undefined)[] = ['R', 'A', 'C', 'I', undefined];
        const updated = matrixData.map(item => {
            if (item.id === activityId) {
                const current = item.assignments[roleTitle];
                const currentIndex = sequence.indexOf(current);
                const nextCode = sequence[(currentIndex + 1) % sequence.length];
                
                return {
                    ...item,
                    assignments: {
                        ...item.assignments,
                        [roleTitle]: nextCode
                    }
                };
            }
            return item;
        });

        setMatrixData(updated);
        if (onUpdateProject) {
            onUpdateProject({ raciMatrix: updated });
        }
    };

    const handleApplyDefaultsToTasks = () => {
        if (!project.tasks || project.tasks.length === 0) {
            setStatusMessage("No tasks found in project. Generate planning tasks first to allocate resources.");
            setTimeout(() => setStatusMessage(null), 4000);
            return;
        }

        const updatedTasks = applyRaciDefaultsToTasks(project.tasks);
        
        // Ensure standard roles exist in project.team
        const currentRoleNames = new Set((project.team || []).map(m => m.role));
        const newTeamMembers = STANDARD_RACI_ROLES
            .filter(r => !currentRoleNames.has(r.title))
            .map(r => ({
                userId: `team-${r.id}-${Date.now()}`,
                role: r.title,
                name: '',
                email: ''
            }));

        const updatedTeam = [...(project.team || []), ...newTeamMembers];

        // Also ensure default resource allocations exist in resources if empty
        const defaultResources = (!project.resources || project.resources.length === 0)
            ? getDefaultResourceAllocations()
            : project.resources;
        const totalBudget = defaultResources.reduce((sum, r) => sum + (r.totalCost || (r.unitCost * r.quantity) || 0), 0);

        if (onUpdateProject) {
            onUpdateProject({
                tasks: updatedTasks,
                team: updatedTeam,
                resources: defaultResources,
                budget: totalBudget > 0 ? totalBudget : project.budget,
                raciMatrix: matrixData
            });
            setStatusMessage(`Successfully allocated RACI default assignments to ${updatedTasks.length} tasks, synchronized ${newTeamMembers.length} standard roles into Team, and updated resource allocations!`);
            setTimeout(() => setStatusMessage(null), 5000);
        }
    };

    const handleSyncRolesToTeam = () => {
        const currentRoleNames = new Set((project.team || []).map(m => m.role));
        const missingRoles = STANDARD_RACI_ROLES.filter(r => !currentRoleNames.has(r.title));
        
        if (missingRoles.length === 0) {
            setStatusMessage("All 10 standard RACI roles already exist in the Team directory.");
            setTimeout(() => setStatusMessage(null), 3000);
            return;
        }

        const additions = missingRoles.map(r => ({
            userId: `team-${r.id}-${Date.now()}`,
            role: r.title,
            name: '',
            email: ''
        }));

        if (onUpdateProject) {
            onUpdateProject({
                team: [...(project.team || []), ...additions]
            });
            setStatusMessage(`Added ${additions.length} standard RACI roles to the project Team directory.`);
            setTimeout(() => setStatusMessage(null), 4000);
        }
    };

    const handleResetToDefaults = () => {
        if (window.confirm("Reset all RACI assignments back to standard template defaults?")) {
            setMatrixData(DEFAULT_RACI_ACTIVITIES);
            if (onUpdateProject) {
                onUpdateProject({ raciMatrix: DEFAULT_RACI_ACTIVITIES });
            }
            setStatusMessage("RACI Matrix reset to chart defaults.");
            setTimeout(() => setStatusMessage(null), 3000);
        }
    };

    const handleExportMarkdown = () => {
        let md = `# RACI Matrix - Responsibility Assignment Matrix\n`;
        md += `Project: ${project.name}\nDate: ${new Date().toLocaleDateString()}\n\n`;
        md += `| # | Phase | Deliverable / Activity | ${STANDARD_RACI_ROLES.map(r => r.title).join(' | ')} |\n`;
        md += `|---|---|---|${STANDARD_RACI_ROLES.map(() => '---').join('|')}|\n`;

        matrixData.forEach((act, idx) => {
            const roleVals = STANDARD_RACI_ROLES.map(r => act.assignments[r.title] || '-');
            md += `| ${idx + 1} | ${act.phase} | ${act.activity} | ${roleVals.join(' | ')} |\n`;
        });

        const blob = new Blob([md], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name.toLowerCase().replace(/\s+/g, '_')}_raci_matrix.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="raci-matrix-container" style={{ padding: '0.5rem' }}>
            {/* Template Header Banner */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.95) 100%)',
                border: '1px solid rgba(0, 242, 255, 0.3)',
                borderRadius: '12px',
                padding: '1.5rem 2rem',
                marginBottom: '1.5rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                            <span style={{ fontSize: '1.75rem' }}>📋</span>
                            <h2 style={{ 
                                margin: 0, 
                                fontSize: '1.6rem', 
                                fontWeight: 900, 
                                letterSpacing: '1px',
                                background: 'linear-gradient(90deg, #00f2ff, #a855f7)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                            }}>
                                RACI MATRIX TEMPLATE
                            </h2>
                        </div>
                        <p style={{ margin: 0, color: 'var(--secondary-text)', fontSize: '0.85rem' }}>
                            RESPONSIBILITY ASSIGNMENT MATRIX FOR PROJECT MANAGEMENT & RESOURCE ALLOCATION
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={handleApplyDefaultsToTasks}
                            className="button button-generate"
                            style={{ padding: '0.6rem 1.25rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                            title="Assign default roles and RACI accountability to project tasks"
                        >
                            <span>⚡</span>
                            <span>Apply RACI to Project Tasks</span>
                        </button>

                        <button
                            onClick={handleSyncRolesToTeam}
                            className="button button-secondary"
                            style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                            title="Ensure all 10 standard RACI roles exist in project team directory"
                        >
                            👥 Sync Roles to Team
                        </button>

                        <button
                            onClick={handleExportMarkdown}
                            className="button button-secondary"
                            style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}
                            title="Export RACI Matrix as Markdown"
                        >
                            📥 Export RACI
                        </button>

                        <button
                            onClick={handleResetToDefaults}
                            className="button"
                            style={{ padding: '0.6rem 0.8rem', fontSize: '0.8rem', opacity: 0.7 }}
                            title="Reset to template defaults"
                        >
                            ↺ Reset
                        </button>
                    </div>
                </div>

                {statusMessage && (
                    <div style={{
                        background: 'rgba(0, 242, 255, 0.1)',
                        border: '1px solid rgba(0, 242, 255, 0.4)',
                        color: '#00f2ff',
                        padding: '0.6rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                    }}>
                        <span>ℹ️</span>
                        <span>{statusMessage}</span>
                    </div>
                )}

                {/* RACI Definition Legend matching chart */}
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                    gap: '0.75rem',
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                    {Object.values(RACI_LEGEND).map(leg => (
                        <div key={leg.code} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                minWidth: '32px',
                                borderRadius: '6px',
                                background: leg.badgeColor,
                                color: leg.textColor,
                                border: `1px solid ${leg.border}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 900,
                                fontSize: '1rem',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                            }}>
                                {leg.code}
                            </div>
                            <div>
                                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#fff' }}>
                                    = {leg.name}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--secondary-text)', lineHeight: 1.2 }}>
                                    {leg.description}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* View & Phase Filters Bar */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                flexWrap: 'wrap', 
                gap: '1rem', 
                marginBottom: '1rem' 
            }}>
                {/* Phase Pills */}
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {phases.map(ph => (
                        <button
                            key={ph}
                            onClick={() => setSelectedPhase(ph)}
                            className="button button-small"
                            style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                padding: '4px 10px',
                                borderRadius: '100px',
                                background: selectedPhase === ph ? 'var(--accent-color)' : 'rgba(255,255,255,0.03)',
                                color: selectedPhase === ph ? '#000' : 'var(--secondary-text)',
                                border: selectedPhase === ph ? '1px solid var(--accent-color)' : '1px solid var(--card-border)'
                            }}
                        >
                            {ph}
                        </button>
                    ))}
                </div>

                {/* View Mode Toggle */}
                <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(0,0,0,0.3)', padding: '3px', borderRadius: '6px' }}>
                    <button
                        onClick={() => setViewMode('template')}
                        style={{
                            background: viewMode === 'template' ? 'rgba(0, 242, 255, 0.2)' : 'transparent',
                            color: viewMode === 'template' ? '#00f2ff' : 'var(--secondary-text)',
                            border: 'none',
                            padding: '4px 12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Standard RACI Chart
                    </button>
                    <button
                        onClick={() => setViewMode('project_tasks')}
                        style={{
                            background: viewMode === 'project_tasks' ? 'rgba(0, 242, 255, 0.2)' : 'transparent',
                            color: viewMode === 'project_tasks' ? '#00f2ff' : 'var(--secondary-text)',
                            border: 'none',
                            padding: '4px 12px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Project Tasks RACI ({project.tasks?.length || 0})
                    </button>
                </div>
            </div>

            {/* TAB 1: Standard RACI Template Grid */}
            {viewMode === 'template' && (
                <div className="glass-card" style={{ padding: '0', overflow: 'hidden', borderLeft: 'none' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: '#0a192f', borderBottom: '2px solid rgba(0, 242, 255, 0.4)' }}>
                                    <th style={{ padding: '1rem', width: '45px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 800 }}>#</th>
                                    <th style={{ padding: '1rem', minWidth: '240px', color: '#fff', fontSize: '0.85rem', fontWeight: 800 }}>
                                        Project Deliverables or Activities
                                    </th>
                                    {STANDARD_RACI_ROLES.map(role => (
                                        <th key={role.id} style={{ 
                                            padding: '0.75rem 0.5rem', 
                                            minWidth: '85px', 
                                            textAlign: 'center', 
                                            borderLeft: '1px solid rgba(255,255,255,0.06)' 
                                        }}>
                                            <div style={{ fontSize: '1.1rem', marginBottom: '2px' }}>{role.icon}</div>
                                            <div style={{ fontSize: '0.7rem', fontWeight: 800, color: role.color, lineHeight: 1.1 }}>
                                                {role.title}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredActivities.map((item, index) => {
                                    // Check if this is first item of a phase to render phase banner
                                    const isPhaseStart = index === 0 || filteredActivities[index - 1]?.phase !== item.phase;

                                    return (
                                        <React.Fragment key={item.id}>
                                            {isPhaseStart && (
                                                <tr style={{ background: 'linear-gradient(90deg, #1e3a8a 0%, #0f172a 100%)', borderTop: '2px solid #2563eb' }}>
                                                    <td colSpan={STANDARD_RACI_ROLES.length + 2} style={{ padding: '0.6rem 1rem', fontWeight: 800, fontSize: '0.85rem', color: '#60a5fa' }}>
                                                        {item.phase === 'Initiation Phase' && '🚀 '}
                                                        {item.phase === 'Planning Phase' && '📑 '}
                                                        {item.phase === 'Execution Phase' && '⚙️ '}
                                                        {item.phase === 'Monitoring & Control Phase' && '📊 '}
                                                        {item.phase === 'Closure Phase' && '🏁 '}
                                                        {item.phase}
                                                    </td>
                                                </tr>
                                            )}
                                            <tr style={{
                                                background: index % 2 === 0 ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.15)',
                                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                transition: 'background 0.15s ease'
                                            }}>
                                                <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>
                                                    {index + 1}
                                                </td>
                                                <td style={{ padding: '0.6rem 1rem', fontSize: '0.82rem', fontWeight: 600, color: '#f1f5f9' }}>
                                                    {item.activity}
                                                </td>
                                                {STANDARD_RACI_ROLES.map(role => {
                                                    const code = item.assignments[role.title];
                                                    const legend = code ? RACI_LEGEND[code] : null;

                                                    return (
                                                        <td 
                                                            key={role.id} 
                                                            onClick={() => handleCycleRoleCode(item.id, role.title)}
                                                            title={`Click to cycle role for ${role.title}: ${code || 'None'}`}
                                                            style={{
                                                                padding: '0.4rem',
                                                                textAlign: 'center',
                                                                borderLeft: '1px solid rgba(255,255,255,0.04)',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            {legend ? (
                                                                <span style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    width: '28px',
                                                                    height: '28px',
                                                                    borderRadius: '5px',
                                                                    background: legend.badgeColor,
                                                                    color: legend.textColor,
                                                                    border: `1px solid ${legend.border}`,
                                                                    fontWeight: 900,
                                                                    fontSize: '0.85rem',
                                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                                                }}>
                                                                    {code}
                                                                </span>
                                                            ) : (
                                                                <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.8rem' }}>-</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: Project Tasks RACI Mapping */}
            {viewMode === 'project_tasks' && (
                <div className="glass-card" style={{ padding: '1.5rem', borderLeft: 'none' }}>
                    <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800 }}>
                                Active Project Tasks RACI Matrix
                            </h4>
                            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--secondary-text)' }}>
                                Displays each synthesized project task mapped to its Responsible, Accountable, Consulted, and Informed stakeholders.
                            </p>
                        </div>
                        <button
                            onClick={handleApplyDefaultsToTasks}
                            className="button button-small button-generate"
                        >
                            ⚡ Re-apply RACI Defaults
                        </button>
                    </div>

                    {(!project.tasks || project.tasks.length === 0) ? (
                        <p style={{ textAlign: 'center', opacity: 0.6, padding: '3rem' }}>
                            No tasks found in project. Complete the HMAP planning workflow or run synthesis to generate tasks.
                        </p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '1px solid var(--border-color)' }}>
                                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#94a3b8' }}>Task Name</th>
                                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#1d4ed8' }}>Responsible (R)</th>
                                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#38bdf8' }}>Accountable (A)</th>
                                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#0284c7' }}>Consulted (C)</th>
                                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#06b6d4' }}>Informed (I)</th>
                                        <th style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#94a3b8' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {project.tasks.map((task, idx) => {
                                        const raci = task.raciAssignments;
                                        const matchedActivity = matchTaskToRaciActivity(task.name);

                                        const resp = raci?.responsible || task.role || 'Unassigned';
                                        const acct = raci?.accountable || 'Project Manager';
                                        const cons = raci?.consulted || [];
                                        const info = raci?.informed || [];

                                        return (
                                            <tr key={task.id || idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                <td style={{ padding: '0.75rem 1rem', fontWeight: 600, fontSize: '0.85rem' }}>
                                                    <div>{task.name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--tertiary-text)' }}>
                                                        Matched to: {matchedActivity.activity}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    <span style={{
                                                        background: 'rgba(29, 78, 216, 0.2)',
                                                        color: '#60a5fa',
                                                        border: '1px solid rgba(29, 78, 216, 0.4)',
                                                        padding: '3px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700
                                                    }}>
                                                        R: {resp}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    <span style={{
                                                        background: 'rgba(56, 189, 248, 0.15)',
                                                        color: '#38bdf8',
                                                        border: '1px solid rgba(56, 189, 248, 0.35)',
                                                        padding: '3px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700
                                                    }}>
                                                        A: {acct}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: '#cbd5e1' }}>
                                                    {cons.length > 0 ? cons.join(', ') : 'None'}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.75rem', color: '#94a3b8' }}>
                                                    {info.length > 0 ? info.join(', ') : 'None'}
                                                </td>
                                                <td style={{ padding: '0.75rem 1rem' }}>
                                                    <span style={{
                                                        fontSize: '0.7rem',
                                                        fontWeight: 700,
                                                        padding: '2px 8px',
                                                        borderRadius: '100px',
                                                        background: task.status === 'done' ? 'rgba(52, 211, 153, 0.2)' : 'rgba(255,255,255,0.05)',
                                                        color: task.status === 'done' ? 'var(--success-color)' : 'var(--secondary-text)'
                                                    }}>
                                                        {task.status.toUpperCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Role Workload & Balance Breakdown */}
            <div style={{ marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', color: 'var(--secondary-text)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem' }}>
                    Resource Allocation & Responsibility Distribution by Role
                </h4>

                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', 
                    gap: '0.75rem' 
                }}>
                    {STANDARD_RACI_ROLES.map(role => {
                        const st = roleStats[role.title] || { R: 0, A: 0, C: 0, I: 0, total: 0 };
                        return (
                            <div key={role.id} style={{
                                background: 'rgba(255, 255, 255, 0.02)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '8px',
                                padding: '0.85rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.4rem'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>{role.icon}</span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: role.color }}>
                                        {role.title}
                                    </span>
                                </div>

                                <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.2rem' }}>
                                    <span style={{ 
                                        flex: 1, 
                                        textAlign: 'center', 
                                        padding: '2px 4px', 
                                        borderRadius: '3px', 
                                        background: 'rgba(29, 78, 216, 0.25)', 
                                        color: '#93c5fd', 
                                        fontSize: '0.65rem', 
                                        fontWeight: 800 
                                    }} title="Responsible count">
                                        R: {st.R}
                                    </span>
                                    <span style={{ 
                                        flex: 1, 
                                        textAlign: 'center', 
                                        padding: '2px 4px', 
                                        borderRadius: '3px', 
                                        background: 'rgba(56, 189, 248, 0.25)', 
                                        color: '#38bdf8', 
                                        fontSize: '0.65rem', 
                                        fontWeight: 800 
                                    }} title="Accountable count">
                                        A: {st.A}
                                    </span>
                                    <span style={{ 
                                        flex: 1, 
                                        textAlign: 'center', 
                                        padding: '2px 4px', 
                                        borderRadius: '3px', 
                                        background: 'rgba(2, 132, 199, 0.25)', 
                                        color: '#7dd3fc', 
                                        fontSize: '0.65rem', 
                                        fontWeight: 800 
                                    }} title="Consulted count">
                                        C: {st.C}
                                    </span>
                                    <span style={{ 
                                        flex: 1, 
                                        textAlign: 'center', 
                                        padding: '2px 4px', 
                                        borderRadius: '3px', 
                                        background: 'rgba(6, 182, 212, 0.25)', 
                                        color: '#a5f3fc', 
                                        fontSize: '0.65rem', 
                                        fontWeight: 800 
                                    }} title="Informed count">
                                        I: {st.I}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
