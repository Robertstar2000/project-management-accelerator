import React, { useMemo, useState } from 'react';
import { Project, Task } from '../types';
import { STANDARD_RACI_ROLES, applyRaciDefaultsToTasks, getDefaultResourceAllocations } from '../constants/raciDefaults';

export const WorkloadView: React.FC<{ 
    project: Project; 
    onUpdateProject?: (p: Partial<Project>) => void;
    onSwitchToRaci?: () => void;
}> = ({ project, onUpdateProject, onSwitchToRaci }) => {
    const { tasks, startDate, endDate } = project;
    const [statusMsg, setStatusMsg] = useState<string | null>(null);

    const roleIconMap = useMemo(() => {
        const map: Record<string, string> = {};
        STANDARD_RACI_ROLES.forEach(r => {
            map[r.title.toLowerCase()] = r.icon;
        });
        return map;
    }, []);

    const handleApplyRaciAllocations = () => {
        if (!tasks || tasks.length === 0) return;
        const updatedTasks = applyRaciDefaultsToTasks(tasks);
        
        // Ensure standard roles exist in project team
        const currentRoleNames = new Set((project.team || []).map(m => m.role));
        const newTeamMembers = STANDARD_RACI_ROLES
            .filter(r => !currentRoleNames.has(r.title))
            .map(r => ({
                userId: `team-${r.id}-${Date.now()}`,
                role: r.title,
                name: '',
                email: ''
            }));

        // If resources table is empty, also seed default resource allocations from chart
        const defaultResources = (!project.resources || project.resources.length === 0)
            ? getDefaultResourceAllocations()
            : project.resources;
        const totalBudget = defaultResources.reduce((sum, r) => sum + (r.totalCost || (r.unitCost * r.quantity) || 0), 0);

        if (onUpdateProject) {
            onUpdateProject({
                tasks: updatedTasks,
                team: [...(project.team || []), ...newTeamMembers],
                resources: defaultResources,
                budget: totalBudget > 0 ? totalBudget : project.budget
            });
            setStatusMsg(`Applied RACI default resource allocations across ${updatedTasks.length} tasks!`);
            setTimeout(() => setStatusMsg(null), 4000);
        }
    };

    // --- Timeline Logic (Same as GanttChart) ---
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

        // Add buffer
        start -= 24 * 60 * 60 * 1000;
        end += 24 * 60 * 60 * 1000;

        const duration = Math.max(end - start, 24 * 60 * 60 * 1000);
        return { projectStart: start, projectEnd: end, totalDuration: duration };
    }, [tasks, startDate, endDate]);

    const ticks = useMemo(() => {
        const tickArray = [];
        const step = totalDuration / 5;
        for (let i = 0; i <= 5; i++) {
            tickArray.push(new Date(projectStart + (step * i)));
        }
        return tickArray;
    }, [projectStart, totalDuration]);

    // --- Grouping & Stacking Logic ---
    const roleLayouts = useMemo(() => {
        const groups: Record<string, Task[]> = {};
        tasks.forEach(t => {
            const role = t.role || 'Unassigned';
            if (!groups[role]) groups[role] = [];
            groups[role].push(t);
        });

        const layouts: Record<string, { lanes: Task[][] }> = {};
        
        Object.entries(groups).forEach(([role, roleTasks]) => {
            // Sort by start date
            const sorted = [...roleTasks].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
            const lanes: Task[][] = [];
            
            sorted.forEach(task => {
                let placed = false;
                // Try to place in existing lane
                for (const lane of lanes) {
                    const lastTaskInLane = lane[lane.length - 1];
                    const lastEnd = new Date(lastTaskInLane.endDate).getTime();
                    const currentStart = new Date(task.startDate).getTime();
                    
                    // Check for overlap (add small buffer for visual separation)
                    if (currentStart >= lastEnd) {
                        lane.push(task);
                        placed = true;
                        break;
                    }
                }
                
                if (!placed) {
                    lanes.push([task]);
                }
            });
            
            layouts[role] = { lanes };
        });
        
        return layouts;
    }, [tasks]);

    if (!tasks.length) return <p style={{padding: '2rem', textAlign: 'center', opacity: 0.6}}>No workload data available.</p>;

    return (
        <div className="workload-container" style={{ padding: '1.5rem', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h3 className="subsection-title" style={{ margin: 0 }}>Resource Allocation & Workload Matrix</h3>
                    <p style={{ margin: '0.25rem 0 0', color: 'var(--secondary-text)', fontSize: '0.85rem' }}>
                        Visualizing resource allocation by role. Overlapping tasks are stacked vertically to show concurrency conflicts.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {onUpdateProject && (
                        <button
                            onClick={handleApplyRaciAllocations}
                            className="button button-generate button-small"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                            title="Assign standard RACI roles to all tasks based on Responsibility Assignment Matrix"
                        >
                            <span>⚡</span>
                            <span>Apply RACI Default Allocations</span>
                        </button>
                    )}
                    {onSwitchToRaci && (
                        <button
                            onClick={onSwitchToRaci}
                            className="button button-secondary button-small"
                            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                        >
                            📋 View RACI Matrix
                        </button>
                    )}
                </div>
            </div>

            {statusMsg && (
                <div style={{
                    background: 'rgba(0, 242, 255, 0.1)',
                    border: '1px solid rgba(0, 242, 255, 0.4)',
                    color: '#00f2ff',
                    padding: '0.6rem 1rem',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    marginBottom: '1rem'
                }}>
                    ✓ {statusMsg}
                </div>
            )}

            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1rem', alignItems: 'start' }}>
                {/* Header Row */}
                <div style={{ fontWeight: 'bold', color: 'var(--secondary-text)', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                    Role / Resource (RACI)
                </div>
                <div style={{ position: 'relative', height: '30px', borderBottom: '1px solid var(--border-color)' }}>
                    {ticks.map((tick, i) => {
                        const left = (i / 5) * 100;
                        const transform = i === 0 ? 'translateX(0%)' : i === 5 ? 'translateX(-100%)' : 'translateX(-50%)';
                        return (
                            <div key={i} style={{ 
                                position: 'absolute', left: `${left}%`, fontSize: '0.75rem', color: 'var(--secondary-text)', 
                                transform: transform, whiteSpace: 'nowrap'
                            }}>
                                <div style={{height: '5px', width: '1px', background: 'var(--border-color)', margin: i === 0 ? '0 0 5px 0' : i === 5 ? '0 0 5px auto' : '0 auto 5px auto'}}></div>
                                {tick.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                            </div>
                        );
                    })}
                </div>

                {/* Role Rows */}
                {Object.entries(roleLayouts).map(([role, layout]) => (
                    <React.Fragment key={role}>
                        {/* Role Name Column */}
                        <div style={{ 
                            padding: '1rem 0', 
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '1rem' }}>{roleIconMap[role.toLowerCase()] || '💼'}</span>
                                <span style={{ fontWeight: 600, color: 'var(--primary-text)' }}>{role}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', marginTop: '2px' }}>
                                {layout.lanes.flat().length} tasks • {layout.lanes.length} concurrent
                            </div>
                        </div>

                        {/* Timeline Column */}
                        <div style={{ 
                            position: 'relative', 
                            padding: '1rem 0', 
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            minHeight: `${Math.max(50, layout.lanes.length * 35)}px` 
                        }}>
                            {/* Grid Lines */}
                            {ticks.map((_, i) => (
                                <div key={i} style={{
                                    position: 'absolute', left: `${(i/5)*100}%`, top: 0, bottom: 0, 
                                    width: '1px', background: 'rgba(255,255,255,0.03)', zIndex: 0
                                }}></div>
                            ))}

                            {/* Task Lanes */}
                            {layout.lanes.map((lane, laneIndex) => (
                                <div key={laneIndex} style={{ position: 'relative', height: '30px', marginBottom: '5px' }}>
                                    {lane.map(task => {
                                        const taskStart = new Date(task.startDate).getTime();
                                        const taskEnd = new Date(task.endDate).getTime();
                                        
                                        if (isNaN(taskStart) || isNaN(taskEnd)) return null;

                                        const rawLeft = ((taskStart - projectStart) / totalDuration) * 100;
                                        const rawWidth = ((taskEnd - taskStart) / totalDuration) * 100;
                                        
                                        const left = Math.max(0, Math.min(100, rawLeft));
                                        const width = Math.max(0.5, Math.min(100 - left, rawWidth));

                                        return (
                                            <div key={task.id} style={{
                                                position: 'absolute',
                                                left: `${left}%`,
                                                width: `${width}%`,
                                                height: '24px',
                                                backgroundColor: 'var(--accent-color)',
                                                borderRadius: '4px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                                opacity: 0.9,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px',
                                                padding: '0 6px',
                                                fontSize: '0.72rem',
                                                color: 'white',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                zIndex: 1,
                                                cursor: 'help'
                                            }} title={`${task.name} (${task.startDate} - ${task.endDate})${task.raciAssignments?.accountable ? ` | Accountable: ${task.raciAssignments.accountable}` : ''}`}>
                                                {task.raciAssignments?.responsible && (
                                                    <span style={{ 
                                                        fontSize: '0.65rem', 
                                                        fontWeight: 900, 
                                                        background: '#1d4ed8', 
                                                        color: '#fff', 
                                                        padding: '1px 4px', 
                                                        borderRadius: '3px' 
                                                    }}>
                                                        R
                                                    </span>
                                                )}
                                                <span>{task.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};