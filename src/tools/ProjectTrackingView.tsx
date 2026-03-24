
import React, { useState, useEffect, useMemo } from 'react';
import JSZip from 'jszip';
import { TeamAssignmentsView } from './TeamView';
import { Project, Task, User } from '../types';
import { WorkloadView } from './WorkloadView';
import { parseResourcesFromMarkdown } from '../utils/be-logic';
import { ProjectStateDownloadModal } from '../components/ProjectStateDownloadModal';

// --- GANTT COMPONENTS ---

const GanttChart = ({ tasks, startDate, endDate }: { tasks: Task[], startDate: string, endDate: string }) => {
    // Calculate dynamic range to include all tasks
    const { projectStart, projectEnd, totalDuration } = useMemo(() => {
        const validTasks = tasks.filter(t => !isNaN(new Date(t.startDate).getTime()) && !isNaN(new Date(t.endDate).getTime()));
        
        let start = new Date(startDate).getTime();
        let end = new Date(endDate).getTime();

        if (validTasks.length > 0) {
            const taskStarts = validTasks.map(t => new Date(t.startDate).getTime());
            const taskEnds = validTasks.map(t => new Date(t.endDate).getTime());
            start = Math.min(start, ...taskStarts);
            end = Math.max(end, ...taskEnds);
        }

        // Add a small buffer (e.g. 1 day) to start/end for visual breathing room
        start -= 24 * 60 * 60 * 1000;
        end += 24 * 60 * 60 * 1000;

        const duration = Math.max(end - start, 24 * 60 * 60 * 1000);
        return { projectStart: start, projectEnd: end, totalDuration: duration };
    }, [tasks, startDate, endDate]);
    
    // Sort tasks by start date
    const sortedTasks = useMemo(() => [...tasks].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()), [tasks]);

    // Generate exactly 6 evenly spaced ticks
    const ticks = useMemo(() => {
        const tickArray = [];
        const step = totalDuration / 5; // 5 intervals for 6 ticks
        
        for (let i = 0; i <= 5; i++) {
            const tickTime = projectStart + (step * i);
            tickArray.push(new Date(tickTime));
        }
        return tickArray;
    }, [projectStart, totalDuration]);

    if (!tasks.length) return <p style={{padding: '2rem', textAlign: 'center', opacity: 0.6}}>No timeline data generated yet.</p>;

    return (
        <div className="gantt-container glass-card" style={{ padding: '1.5rem', overflow: 'hidden' }}>
            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'stretch' }}>
                {/* Header Row */}
                <div style={{ fontWeight: 'bold', color: 'var(--secondary-text)', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                    Task Name
                </div>
                <div style={{ position: 'relative', height: '30px', borderBottom: '1px solid var(--border-color)' }}>
                    {ticks.map((tick, i) => {
                        // Force exact positioning based on index
                        const left = (i / 5) * 100;
                        
                        // Align text: left for first, right for last, center for others
                        const transform = i === 0 ? 'translateX(0%)' : i === 5 ? 'translateX(-100%)' : 'translateX(-50%)';
                        
                        return (
                            <div key={i} style={{ 
                                position: 'absolute', 
                                left: `${left}%`, 
                                fontSize: '0.75rem', 
                                color: 'var(--secondary-text)', 
                                transform: transform,
                                whiteSpace: 'nowrap'
                            }}>
                                <div style={{height: '5px', width: '1px', background: 'var(--border-color)', margin: i === 0 ? '0 0 5px 0' : i === 5 ? '0 0 5px auto' : '0 auto 5px auto'}}></div>
                                {tick.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                            </div>
                        );
                    })}
                </div>

                {/* Task Rows */}
                {sortedTasks.map((task) => {
                    const taskStart = new Date(task.startDate).getTime();
                    const taskEnd = new Date(task.endDate).getTime();
                    
                    // Check for invalid dates
                    if (isNaN(taskStart) || isNaN(taskEnd)) return null;

                    // Calculate position relative to total duration
                    const rawLeft = ((taskStart - projectStart) / totalDuration) * 100;
                    const rawWidth = ((taskEnd - taskStart) / totalDuration) * 100;
                    
                    // Clamp to ensure it stays within bounds
                    const left = Math.max(0, Math.min(100, rawLeft));
                    const width = Math.max(0.5, Math.min(100 - left, rawWidth)); // Min width 0.5% for visibility
                    
                    const statusColor = task.status === 'done' ? 'var(--success-color)' : 
                                      task.status === 'inprogress' ? 'var(--accent-color)' : 
                                      task.status === 'review' ? 'var(--warning-color)' : 'var(--tertiary-text)';

                    return (
                        <React.Fragment key={task.id}>
                            <div style={{ 
                                fontSize: '0.9rem',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                padding: '0.5rem 0',
                                borderBottom: '1px solid rgba(255,255,255,0.03)'
                            }} title={task.name}>
                                <div style={{fontWeight: 500, lineHeight: 1.3, marginBottom: '0.2rem'}}>{task.name}</div>
                                <div style={{fontSize: '0.75rem', color: 'var(--secondary-text)'}}>{task.role}</div>
                            </div>
                            <div style={{ position: 'relative', minHeight: '50px', display: 'flex', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                {/* Grid Lines */}
                                {ticks.map((_, i) => {
                                     const lineLeft = (i / 5) * 100;
                                     return <div key={i} style={{position: 'absolute', left: `${lineLeft}%`, top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.03)'}}></div>
                                })}
                                
                                {/* Gantt Bar */}
                                <div style={{
                                    position: 'absolute',
                                    left: `${left}%`,
                                    width: `${width}%`,
                                    height: '24px',
                                    backgroundColor: statusColor,
                                    borderRadius: '4px',
                                    boxShadow: `0 2px 8px rgba(0,0,0,0.2)`,
                                    opacity: 0.9,
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: '4px'
                                }} title={`${task.startDate} to ${task.endDate} (${task.status})`}>
                                    {width > 10 && (
                                        <span style={{ 
                                            fontSize: '0.75rem', 
                                            fontWeight: 600, 
                                            color: '#fff', 
                                            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                                            padding: '0 5px', 
                                            whiteSpace: 'nowrap', 
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            maxWidth: '100%'
                                        }}>
                                            {task.sprintId}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};

// --- EXISTING COMPONENTS ---

const ResourcesView = ({ project, onUpdateProject, onEstimateCosts, isEstimating }: { project: Project, onUpdateProject: (p: Partial<Project>) => void, onEstimateCosts: () => void, isEstimating: boolean }) => {
    const [resources, setResources] = useState<Resource[]>(project.resources || []);
    const [newResourceName, setNewResourceName] = useState('');

    const extractedResources = useMemo(() => {
        const resourceDoc = project.documents.find(d => d.title === 'Resources & Skills List');
        if (!resourceDoc || !project.phasesData || !project.phasesData[resourceDoc.id]?.content) return [];
        return parseResourcesFromMarkdown(project.phasesData[resourceDoc.id].content);
    }, [project.documents, project.phasesData]);

    useEffect(() => {
        const projectResources = project.resources || [];
        const currentResourceNames = new Set(projectResources.map(r => r.name));
        const newResourcesToAdd = extractedResources
            .filter(name => !currentResourceNames.has(name))
            .map(name => ({ 
                id: crypto.randomUUID(),
                name, 
                type: 'human' as const, // Default to human, user can change
                unitCost: 0, 
                quantity: 0, 
                totalCost: 0 
            }));
        
        if (newResourcesToAdd.length > 0) {
            const updatedResources = [...projectResources, ...newResourcesToAdd];
            onUpdateProject({ resources: updatedResources });
        }
    }, [extractedResources, project.resources, onUpdateProject]);

    const [prevProjectResources, setPrevProjectResources] = useState(project.resources);
    if (project.resources !== prevProjectResources) {
        setPrevProjectResources(project.resources);
        setResources(project.resources || []);
    }

    const handleUpdate = (index: number, field: keyof Resource, value: any) => {
        const newResources = [...resources];
        const resource = { ...newResources[index], [field]: value };
        
        // Recalculate total cost if unit cost or quantity changes
        if (field === 'unitCost' || field === 'quantity') {
            resource.totalCost = (parseFloat(resource.unitCost as any) || 0) * (parseFloat(resource.quantity as any) || 0);
        }

        newResources[index] = resource;
        setResources(newResources);
    };

    const handleBlur = () => {
        // Calculate total budget
        const totalBudget = resources.reduce((sum, r) => sum + (r.totalCost || 0), 0);
        onUpdateProject({ resources, budget: totalBudget });
    };

    const handleAddResource = () => {
        if (newResourceName.trim()) {
            const newRes: Resource = { 
                id: crypto.randomUUID(),
                name: newResourceName.trim(), 
                type: 'human', 
                unitCost: 0, 
                quantity: 0, 
                totalCost: 0 
            };
            const updatedResources = [...resources, newRes];
            setResources(updatedResources);
            onUpdateProject({ resources: updatedResources });
            setNewResourceName('');
        }
    };

    const handleDeleteResource = (index: number) => {
        const updatedResources = resources.filter((_, i) => i !== index);
        setResources(updatedResources);
        onUpdateProject({ resources: updatedResources });
    };

    return (
        <div className="glass-card" style={{ padding: '2rem', borderLeft: 'none' }}>
            <div style={{marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center'}}>
                <input 
                    type="text" 
                    placeholder="Add new resource..." 
                    value={newResourceName}
                    onChange={(e) => setNewResourceName(e.target.value)}
                    style={{
                        padding: '0.875rem 1rem', 
                        borderRadius: 'var(--radius-sm)', 
                        border: '1px solid var(--card-border)', 
                        background: 'rgba(15, 23, 42, 0.6)', 
                        color: 'var(--primary-text)', 
                        flexGrow: 1,
                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddResource()}
                />
                <button className="button button-primary" onClick={handleAddResource} style={{whiteSpace: 'nowrap'}}>Add Resource</button>
                <button 
                    className="button button-secondary" 
                    onClick={onEstimateCosts} 
                    disabled={isEstimating || resources.length === 0}
                    style={{whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '0.5rem'}}
                >
                    {isEstimating ? (
                        <>
                            <span className="spinner-small"></span> Estimating...
                        </>
                    ) : (
                        <>✨ AI Estimate Costs</>
                    )}
                </button>
            </div>

            <div style={{overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem'}}>
                    <thead>
                        <tr style={{textAlign: 'left'}}>
                            <th style={{padding: '1rem', borderBottom: '1px solid var(--border-color)'}}>Resource Name</th>
                            <th style={{padding: '1rem', borderBottom: '1px solid var(--border-color)'}}>Type</th>
                            <th style={{padding: '1rem', borderBottom: '1px solid var(--border-color)'}}>Unit Cost ($)</th>
                            <th style={{padding: '1rem', borderBottom: '1px solid var(--border-color)'}}>Quantity (Hrs/Qty)</th>
                            <th style={{padding: '1rem', borderBottom: '1px solid var(--border-color)'}}>Total Cost ($)</th>
                            <th style={{padding: '1rem', borderBottom: '1px solid var(--border-color)'}}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {resources.map((r, i) => (
                            <tr key={r.id || i} style={{background: 'rgba(255,255,255,0.02)', transition: 'background 0.2s'}}>
                                <td style={{padding: '0.5rem 1rem', borderRadius: '8px 0 0 8px'}}>
                                    <input type="text" value={r.name} onChange={e => handleUpdate(i, 'name', e.target.value)} onBlur={handleBlur} style={{ width: '100%', background: 'transparent', border: 'none', padding: '0.5rem', color: 'var(--primary-text)', fontWeight: 500 }} />
                                </td>
                                <td style={{padding: '0.5rem 1rem'}}>
                                    <select 
                                        value={r.type} 
                                        onChange={e => handleUpdate(i, 'type', e.target.value)} 
                                        onBlur={handleBlur}
                                        style={{ width: '100%', background: 'transparent', border: 'none', padding: '0.5rem', color: 'var(--secondary-text)' }}
                                    >
                                        <option value="human">Human (Labor)</option>
                                        <option value="physical">Physical (Asset)</option>
                                    </select>
                                </td>
                                <td style={{padding: '0.5rem 1rem'}}>
                                    <input type="number" value={r.unitCost} onChange={e => handleUpdate(i, 'unitCost', parseFloat(e.target.value))} onBlur={handleBlur} style={{ width: '100%', background: 'transparent', border: 'none', padding: '0.5rem', color: 'var(--secondary-text)' }} />
                                </td>
                                <td style={{padding: '0.5rem 1rem'}}>
                                    <input type="number" value={r.quantity} onChange={e => handleUpdate(i, 'quantity', parseFloat(e.target.value))} onBlur={handleBlur} style={{ width: '100%', background: 'transparent', border: 'none', padding: '0.5rem', color: 'var(--secondary-text)' }} />
                                </td>
                                <td style={{padding: '0.5rem 1rem', fontWeight: 'bold', color: 'var(--success-color)'}}>
                                    ${(r.totalCost || 0).toLocaleString()}
                                </td>
                                <td style={{padding: '0.5rem 1rem', borderRadius: '0 8px 8px 0'}}>
                                    <button onClick={() => handleDeleteResource(i)} style={{background: 'transparent', border: 'none', color: 'var(--error-color)', cursor: 'pointer', opacity: 0.8, padding: '0.5rem', borderRadius: '4px', transition: 'all 0.2s'}}>
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {resources.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>No resources defined. Add one above or generate from documents.</td></tr>}
                        {resources.length > 0 && (
                            <tr style={{borderTop: '2px solid var(--border-color)'}}>
                                <td colSpan={4} style={{textAlign: 'right', padding: '1rem', fontWeight: 'bold'}}>Total Estimated Budget:</td>
                                <td style={{padding: '1rem', fontWeight: 'bold', color: 'var(--success-color)', fontSize: '1.1rem'}}>
                                    ${resources.reduce((sum, r) => sum + (r.totalCost || 0), 0).toLocaleString()}
                                </td>
                                <td></td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const TaskListView = ({ tasks, team, onTaskClick }) => (
    <div className="glass-card" style={{ padding: '0', borderLeft: 'none' }}>
        <table>
            <thead><tr><th>Task Identifier</th><th>Assigned Intelligence</th><th>Status</th><th>Target Date</th></tr></thead>
            <tbody>
                {tasks.map(t => (
                    <tr key={t.id} onClick={() => onTaskClick(t)} style={{cursor: 'pointer'}}>
                        <td style={{ fontWeight: 700 }}>{t.name}</td>
                        <td>{team.find(m => m.role === t.role)?.name || 'Unassigned'}</td>
                        <td><span className={`chip-${t.status === 'done' ? 'green' : t.status === 'inprogress' ? 'blue' : 'amber'}`}>{t.status}</span></td>
                        <td style={{ fontFamily: 'monospace' }}>{t.endDate}</td>
                    </tr>
                ))}
                {tasks.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>Mission queue empty.</td></tr>}
            </tbody>
        </table>
    </div>
);

export const ProjectTrackingView: React.FC<{ 
    project: Project; 
    onUpdateTask: any; 
    onUpdateMilestone: any; 
    onUpdateTeam: any; 
    onUpdateProject: any; 
    onTaskClick: any; 
    currentUser: User; 
    onEstimateCosts: () => void;
    isEstimating: boolean;
}> = ({ project, onUpdateTask, onUpdateMilestone, onUpdateTeam, onUpdateProject, onTaskClick, currentUser, onEstimateCosts, isEstimating }) => {
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [trackingView, setTrackingView] = useState(() => {
        return localStorage.getItem(`hmap-tracking-view-${project.id}`) || 'Timeline';
    });

    const handleDownloadProjectState = async () => {
        const zip = new JSZip();
        const projectName = project.name || 'Untitled Project';
        const sanitizedProjectName = projectName.replace(/[\\/:"*?<>|]/g, '');

        // 1. Project Summary
        const summaryMd = `# Project Summary: ${projectName}\n\n` +
            `- Description: ${project.description || 'No description'}\n` +
            `- Start Date: ${project.startDate}\n` +
            `- End Date: ${project.endDate}\n` +
            `- Total Budget: $${(project.budget || 0).toLocaleString()}\n` +
            `- Status: ${project.status}\n`;
        zip.file('project_summary.md', summaryMd);

        // 2. Timeline (Gantt)
        let timelineMd = `# Project Timeline\n\n| Task Name | Start Date | End Date | Status | Sprint |\n|---|---|---|---|---|\n`;
        project.tasks.forEach(t => {
            timelineMd += `| ${t.name} | ${t.startDate} | ${t.endDate} | ${t.status} | ${t.sprintId || '-'} |\n`;
        });
        zip.file('timeline.md', timelineMd);

        // 3. Task List
        let tasksMd = `# Task List\n\n`;
        project.tasks.forEach(t => {
            tasksMd += `## ${t.name}\n- **Role:** ${t.role}\n- **Status:** ${t.status}\n- **Dates:** ${t.startDate} to ${t.endDate}\n- **Sprint:** ${t.sprintId || 'None'}\n\n`;
        });
        zip.file('tasks.md', tasksMd);

        // 4. Kanban Board
        let kanbanMd = `# Kanban Board\n\n`;
        ['todo', 'inprogress', 'review', 'done'].forEach(status => {
            const statusTasks = project.tasks.filter(t => t.status === status);
            kanbanMd += `## ${status.toUpperCase()}\n`;
            statusTasks.forEach(t => {
                kanbanMd += `- [ ] ${t.name} (${t.role})\n`;
            });
            kanbanMd += `\n`;
        });
        zip.file('kanban.md', kanbanMd);

        // 5. Workload
        let workloadMd = `# Workload Distribution\n\n`;
        const roles = Array.from(new Set(project.tasks.map(t => t.role)));
        roles.forEach(role => {
            const roleTasks = project.tasks.filter(t => t.role === role);
            workloadMd += `## ${role}\n`;
            roleTasks.forEach(t => {
                workloadMd += `- ${t.name} (${t.startDate} to ${t.endDate})\n`;
            });
            workloadMd += `\n`;
        });
        zip.file('workload.md', workloadMd);

        // 6. Milestones
        let milestonesMd = `# Project Milestones\n\n| Milestone | Target Date | Status |\n|---|---|---|\n`;
        project.milestones.forEach(m => {
            milestonesMd += `| ${m.name} | ${m.plannedDate} | ${m.status} |\n`;
        });
        zip.file('milestones.md', milestonesMd);

        // 7. Team
        let teamMd = `# Project Team\n\n| Name | Role | Email |\n|---|---|---|\n`;
        project.team.forEach(m => {
            teamMd += `| ${m.name} | ${m.role} | ${m.email || '-'} |\n`;
        });
        zip.file('team.md', teamMd);

        // 8. Resources
        let resourcesMd = `# Project Resources\n\n| Resource Name | Type | Unit Cost | Quantity | Total Cost |\n|---|---|---|---|---|\n`;
        (project.resources || []).forEach(r => {
            resourcesMd += `| ${r.name} | ${r.type} | $${r.unitCost} | ${r.quantity} | $${r.totalCost} |\n`;
        });
        zip.file('resources.md', resourcesMd);

        const content = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(content);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${sanitizedProjectName}_state.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        setIsDownloadModalOpen(false);
    };

    const handleViewChange = (view: string) => {
        setTrackingView(view);
        localStorage.setItem(`hmap-tracking-view-${project.id}`, view);
    };

    const viewOrder = ['Timeline', 'Task List', 'Kanban Board', 'Workload', 'Milestones', 'Team', 'Resources'];

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, status: 'todo' | 'inprogress' | 'review' | 'done') => {
        e.preventDefault();
        e.stopPropagation();
        const taskId = e.dataTransfer.getData('taskId');
        if (taskId) {
            onUpdateTask(taskId, { status });
        }
    };

    return (
        <div>
            <div className="dashboard-nav" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {viewOrder.map(v => (
                        <button key={v} onClick={() => handleViewChange(v)} className={trackingView === v ? 'active' : ''}>{v}</button>
                    ))}
                </div>
                <button 
                    className="button button-secondary" 
                    onClick={() => setIsDownloadModalOpen(true)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem' }}
                >
                    📥 Download Project State
                </button>
            </div>
            
            <div style={{ animation: 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                {trackingView === 'Timeline' && (
                    <GanttChart tasks={project.tasks} startDate={project.startDate} endDate={project.endDate} />
                )}
                {trackingView === 'Task List' && <TaskListView tasks={project.tasks} team={project.team} onTaskClick={onTaskClick} />}
                {trackingView === 'Resources' && <ResourcesView project={project} onUpdateProject={onUpdateProject} onEstimateCosts={onEstimateCosts} isEstimating={isEstimating} />}
                {trackingView === 'Team' && <div className="glass-card" style={{ padding: '3rem', borderLeft: 'none' }}><TeamAssignmentsView project={project} onUpdateTeam={onUpdateTeam} currentUser={currentUser} /></div>}
                {trackingView === 'Workload' && <div className="glass-card" style={{ borderLeft: 'none' }}><WorkloadView project={project} /></div>}
                {trackingView === 'Kanban Board' && (
                    <div className="kanban-board" style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                        {['todo', 'inprogress', 'review', 'done'].map(status => {
                            const statusTasks = project.tasks.filter(t => t.status === status);
                            const statusLabel = status === 'todo' ? 'To Do' : status === 'inprogress' ? 'In Progress' : status === 'review' ? 'Review' : 'Done';
                            const statusColor = status === 'done' ? 'var(--success-color)' : status === 'inprogress' ? 'var(--accent-color)' : status === 'review' ? 'var(--warning-color)' : 'var(--secondary-text)';
                            
                            return (
                                <div 
                                    key={status} 
                                    style={{ minWidth: '300px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--border-color)' }}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, status as any)}
                                >
                                    <h3 style={{ borderBottom: `2px solid ${statusColor}`, paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{fontWeight: 700, letterSpacing: '-0.01em'}}>{statusLabel}</span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '100px', color: 'var(--secondary-text)' }}>{statusTasks.length}</span>
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                        {statusTasks.map(task => (
                                            <div 
                                                key={task.id} 
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, task.id)}
                                                onClick={() => onTaskClick(task)}
                                                style={{ 
                                                    background: 'var(--card-background)', 
                                                    padding: '1rem', 
                                                    borderRadius: 'var(--radius-sm)', 
                                                    cursor: 'grab',
                                                    border: '1px solid var(--card-border)',
                                                    boxShadow: 'var(--shadow-sm)',
                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                                    e.currentTarget.style.borderColor = 'var(--accent-color)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                                                    e.currentTarget.style.borderColor = 'var(--card-border)';
                                                }}
                                            >
                                                <div style={{ 
                                                    position: 'absolute', 
                                                    left: 0, 
                                                    top: 0, 
                                                    bottom: 0, 
                                                    width: '3px', 
                                                    background: status === 'done' ? 'var(--success-gradient)' : status === 'inprogress' ? 'var(--secondary-gradient)' : status === 'review' ? 'var(--warning-gradient)' : 'rgba(255,255,255,0.1)' 
                                                }} />
                                                <div style={{ fontWeight: 600, marginBottom: '0.5rem', paddingLeft: '0.5rem', fontSize: '0.95rem' }}>{task.name}</div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--secondary-text)', paddingLeft: '0.5rem' }}>
                                                    <span style={{display: 'flex', alignItems: 'center', gap: '0.3rem'}}>
                                                        <span style={{width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-color)'}}></span>
                                                        {project.team.find(m => m.role === task.role)?.name || task.role}
                                                    </span>
                                                    <span style={{fontFamily: 'var(--font-mono)', opacity: 0.8}}>{task.endDate}</span>
                                                </div>
                                                {task.sprintId && (
                                                    <div style={{ marginTop: '0.8rem', marginLeft: '0.5rem', fontSize: '0.7rem', background: 'rgba(255,255,255,0.05)', display: 'inline-block', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--card-border)' }}>
                                                        {task.sprintId}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {statusTasks.length === 0 && (
                                            <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.3, fontSize: '0.9rem', fontStyle: 'italic' }}>
                                                No tasks
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
                {trackingView === 'Milestones' && (
                    <div className="glass-card" style={{ padding: '0', borderLeft: 'none' }}>
                        <table style={{width: '100%', borderCollapse: 'separate', borderSpacing: '0'}}>
                            <thead>
                                <tr style={{background: 'rgba(255,255,255,0.03)'}}>
                                    <th style={{padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)'}}>Milestone Title</th>
                                    <th style={{padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)'}}>Target Date</th>
                                    <th style={{padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border-color)'}}>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {project.milestones.map(m => (
                                    <tr key={m.id} style={{borderBottom: '1px solid var(--border-color)'}}>
                                        <td style={{ padding: '1rem', fontWeight: 600 }}>{m.name}</td>
                                        <td style={{ padding: '1rem', fontFamily: 'var(--font-mono)', color: 'var(--secondary-text)' }}>{m.plannedDate}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <select 
                                                value={m.status === 'Completed' ? 'done' : m.status === 'Planned' ? 'todo' : m.status} 
                                                onChange={(e) => onUpdateMilestone(m.id, { status: e.target.value })}
                                                style={{
                                                    background: 'var(--card-background)',
                                                    border: '1px solid var(--card-border)',
                                                    color: 'var(--primary-text)',
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    fontSize: '0.9rem',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <option value="todo">To Do</option>
                                                <option value="inprogress">In Progress</option>
                                                <option value="review">Review</option>
                                                <option value="done">Done</option>
                                                <option value="Planned">Planned</option>
                                                <option value="Completed">Completed</option>
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                                {project.milestones.length === 0 && <tr><td colSpan={3} style={{ textAlign: 'center', padding: '4rem', opacity: 0.5 }}>No critical milestones logged.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <ProjectStateDownloadModal 
                isOpen={isDownloadModalOpen}
                onClose={() => setIsDownloadModalOpen(false)}
                onConfirm={handleDownloadProjectState}
                projectName={project.name || 'Untitled Project'}
            />
        </div>
    );
};
