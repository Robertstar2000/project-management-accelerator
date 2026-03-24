import React, { useMemo } from 'react';
import { Project, Task } from '../types';

export const WorkloadView: React.FC<{ project: Project }> = ({ project }) => {
    const { tasks, startDate, endDate } = project;

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
            <div style={{ marginBottom: '1.5rem', color: 'var(--secondary-text)' }}>
                Visualizing resource allocation by role. Overlapping tasks are stacked vertically to show concurrency conflicts.
            </div>

            <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'start' }}>
                {/* Header Row */}
                <div style={{ fontWeight: 'bold', color: 'var(--secondary-text)', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                    Role / Resource
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
                            <div style={{fontWeight: 600, color: 'var(--primary-text)'}}>{role}</div>
                            <div style={{fontSize: '0.75rem', color: 'var(--secondary-text)'}}>
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
                                                padding: '0 8px',
                                                fontSize: '0.75rem',
                                                color: 'white',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                zIndex: 1,
                                                cursor: 'help'
                                            }} title={`${task.name} (${task.startDate} - ${task.endDate})`}>
                                                {task.name}
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