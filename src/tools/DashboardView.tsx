
import React, { useMemo } from 'react';
import { Project, Document, Milestone } from '../types';

const diffInDays = (date1: string, date2: string) => {
    if (!date1 || !date2) return 0;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.max(0, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);
};

const currencyFormat = (num: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num || 0);

export const DashboardView: React.FC<{ 
    project: Project; 
    phasesData: Record<string, any>; 
    isPlanningComplete: boolean; 
    projectPhases: Document[]; 
    onAnalyzeRisks: () => void; 
    onGenerateSummary: () => void; 
    isGeneratingReport: 'risk' | 'summary' | null; 
}> = ({ 
    project, isPlanningComplete,
    onAnalyzeRisks, onGenerateSummary, isGeneratingReport 
}) => {
    const { 
        tasks = [], 
        resources = [], 
        avgBurdenedLaborRate = 0, 
        budget = 0,
        startDate,
        endDate
    } = project;

    const metrics = useMemo(() => {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'done').length;
        const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        const inProgressCount = tasks.filter(t => t.status === 'inprogress').length;
        const reviewCount = tasks.filter(t => t.status === 'review').length;
        const todoCount = tasks.filter(t => t.status === 'todo').length;

        const overdueCount = tasks.filter(t => t.status !== 'done' && new Date(t.endDate) < new Date()).length;
        const blockedCount = tasks.filter(task =>
            task.status !== 'done' &&
            task.dependsOn?.some(depId => {
                const prereq = tasks.find(t => t.id === depId);
                return prereq && prereq.status !== 'done';
            })
        ).length;

        const totalEstimatedLabor = tasks.reduce((sum, task) => {
            const duration = diffInDays(task.startDate, task.endDate);
            return sum + (duration * 8 * (avgBurdenedLaborRate || 0));
        }, 0);

        const actualLaborCost = tasks.reduce((sum, task) => {
            if (task.status === 'done' || task.actualTime) {
                const duration = task.actualTime || diffInDays(task.startDate, task.endDate);
                return sum + (duration * 8 * (avgBurdenedLaborRate || 0));
            }
            return sum;
        }, 0);

        const totalEstimatedResources = resources.reduce((sum, r) => sum + (r.estimate || 0), 0);
        const actualResourceCost = resources.reduce((sum, r) => sum + (r.actual || 0), 0);

        const totalProjected = totalEstimatedLabor + totalEstimatedResources;
        const totalSpent = actualLaborCost + actualResourceCost;
        const budgetVariance = budget - totalProjected;

        const totalProjectDuration = diffInDays(startDate, endDate);
        const daysElapsed = diffInDays(startDate, new Date().toISOString().split('T')[0]);
        const timeProgress = totalProjectDuration > 0 ? Math.min(100, Math.max(0, Math.round((daysElapsed / totalProjectDuration) * 100))) : 0;

        return {
            progressPercent,
            totalTasks,
            completedTasks,
            inProgressCount,
            reviewCount,
            todoCount,
            overdueCount,
            blockedCount,
            totalProjected,
            totalSpent,
            budgetVariance,
            timeProgress,
            daysLeft: Math.max(0, totalProjectDuration - daysElapsed)
        };
    }, [tasks, resources, budget, avgBurdenedLaborRate, startDate, endDate]);

    const riskLevel = metrics.overdueCount > 3 || metrics.blockedCount > 5 ? 'CRITICAL' : (metrics.overdueCount > 0 ? 'MODERATE' : 'OPTIMAL');
    const riskColor = riskLevel === 'CRITICAL' ? 'var(--error-color)' : riskLevel === 'MODERATE' ? 'var(--warning-color)' : 'var(--success-color)';

    return (
        <div className="dashboard-grid" style={{ animation: 'slideUp 0.8s ease' }}>
            <div className="glass-card widget-gauge col-span-4" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '200px', aspectRatio: '1/1', marginBottom: '2rem' }}>
                    <svg viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                        <circle cx="50" cy="50" r="45" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        <circle cx="50" cy="50" r="45" fill="transparent" stroke="var(--accent-color)" strokeWidth="8" 
                                strokeDasharray="283" strokeDashoffset={283 - (283 * metrics.progressPercent) / 100}
                                strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-in-out' }} />
                    </svg>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                        <h2 style={{ fontSize: '3.5rem', margin: 0 }}>{metrics.progressPercent}%</h2>
                        <span style={{ fontSize: '0.9rem', color: 'var(--secondary-text)', textTransform: 'uppercase', letterSpacing: '2px' }}>Complete</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '2rem', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{metrics.totalTasks}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', textTransform: 'uppercase' }}>Total Tasks</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--success-color)' }}>{metrics.completedTasks}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', textTransform: 'uppercase' }}>Resolved</div>
                    </div>
                </div>
            </div>

            <div className="glass-card widget-financial col-span-8">
                <h3 className="subsection-title" style={{ marginBottom: '2.5rem' }}>Financial Health Spectrum</h3>
                <div className="financial-grid">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                <span style={{ color: 'var(--secondary-text)' }}>Projected Cost vs. Budget</span>
                                <span>{currencyFormat(metrics.totalProjected)} / {currencyFormat(budget)}</span>
                            </div>
                            <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ 
                                    height: '100%', 
                                    width: `${Math.min(100, (metrics.totalProjected / (budget || 1)) * 100)}%`, 
                                    background: metrics.budgetVariance < 0 ? 'var(--error-color)' : 'var(--success-color)',
                                    boxShadow: `0 0 15px ${metrics.budgetVariance < 0 ? 'var(--error-color)' : 'var(--success-color)'}`
                                }}></div>
                            </div>
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                                <span style={{ color: 'var(--secondary-text)' }}>Burned to Date</span>
                                <span>{currencyFormat(metrics.totalSpent)}</span>
                            </div>
                            <div style={{ height: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ 
                                    height: '100%', 
                                    width: `${Math.min(100, (metrics.totalSpent / (metrics.totalProjected || 1)) * 100)}%`, 
                                    background: 'var(--neon-purple)',
                                    boxShadow: '0 0 15px var(--neon-purple)'
                                }}></div>
                            </div>
                        </div>
                    </div>
                    <div style={{ borderLeft: '1px solid var(--card-border)', paddingLeft: 'min(3rem, 5%)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--secondary-text)', marginBottom: '0.5rem' }}>Variance</div>
                            <h2 style={{ fontSize: '2.5rem', color: metrics.budgetVariance < 0 ? 'var(--error-color)' : 'var(--success-color)' }}>
                                {currencyFormat(metrics.budgetVariance)}
                            </h2>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem' }}>
                             <span className={`chip-${metrics.budgetVariance < 0 ? 'red' : 'green'}`}>
                                {metrics.budgetVariance < 0 ? 'OVER BUDGET' : 'UNDER BUDGET'}
                             </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card widget-velocity col-span-5">
                <h3 className="subsection-title">Schedule Velocity</h3>
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                        <span>Days Elapsed</span>
                        <span style={{ fontWeight: 700 }}>{metrics.timeProgress}%</span>
                    </div>
                    <div style={{ position: 'relative', height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', padding: '5px' }}>
                        <div style={{ 
                            height: '100%', 
                            width: `${metrics.timeProgress}%`, 
                            background: 'linear-gradient(90deg, var(--neon-purple), var(--accent-color))', 
                            borderRadius: '15px',
                            boxShadow: '0 0 20px var(--accent-glow)'
                        }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem' }}>
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ color: 'var(--secondary-text)', fontSize: '0.8rem' }}>Start Date</div>
                            <div style={{ fontWeight: 600 }}>{startDate || 'TBD'}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                             <div style={{ color: 'var(--accent-color)', fontSize: '1.4rem', fontWeight: 800 }}>{metrics.daysLeft}</div>
                             <div style={{ fontSize: '0.7rem', color: 'var(--secondary-text)', textTransform: 'uppercase' }}>Days Remaining</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ color: 'var(--secondary-text)', fontSize: '0.8rem' }}>End Date</div>
                            <div style={{ fontWeight: 600 }}>{endDate || 'TBD'}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card widget-radar col-span-4">
                <h3 className="subsection-title">Stability Radar</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                            <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: riskColor, boxShadow: `0 0 10px ${riskColor}` }}></div>
                            <span style={{ fontSize: '1.2rem', fontWeight: 600 }}>Critical Risk Path</span>
                        </div>
                        <span style={{ color: riskColor, fontWeight: 800, letterSpacing: '1px' }}>{riskLevel}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div className="selection-button" style={{ padding: '1.5rem', borderColor: metrics.blockedCount > 0 ? 'var(--warning-color)' : 'var(--card-border)' }}>
                            <span style={{ fontSize: '0.8rem' }}>Blocked Tasks</span>
                            <strong style={{ fontSize: '2rem', color: metrics.blockedCount > 0 ? 'var(--warning-color)' : 'inherit' }}>{metrics.blockedCount}</strong>
                        </div>
                        <div className="selection-button" style={{ padding: '1.5rem', borderColor: metrics.overdueCount > 0 ? 'var(--error-color)' : 'var(--card-border)' }}>
                            <span style={{ fontSize: '0.8rem' }}>Overdue Tasks</span>
                            <strong style={{ fontSize: '2rem', color: metrics.overdueCount > 0 ? 'var(--error-color)' : 'inherit' }}>{metrics.overdueCount}</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card widget-ai col-span-3" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 className="subsection-title">AI Engine</h3>
                <button 
                    className="button button-generate" 
                    style={{ width: '100%', padding: '1.5rem', fontSize: '1rem' }} 
                    onClick={onAnalyzeRisks} 
                    disabled={!!isGeneratingReport}
                >
                    {isGeneratingReport === 'risk' ? 'Computing Risks...' : 'Deep Risk Audit'}
                </button>
                <button 
                    className="button button-generate" 
                    style={{ width: '100%', padding: '1.5rem', fontSize: '1rem' }} 
                    onClick={onGenerateSummary} 
                    disabled={!!isGeneratingReport}
                >
                    {isGeneratingReport === 'summary' ? 'Synthesizing...' : 'Project Pulse Summary'}
                </button>
                <div style={{ flexGrow: 1, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                     <p style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', fontStyle: 'italic', textAlign: 'center' }}>
                        {isPlanningComplete ? 'Workspace Active' : 'Planning Sequence Initiated'}
                     </p>
                </div>
            </div>

            <div className="glass-card widget-tasks col-span-12">
                <h3 className="subsection-title" style={{ marginBottom: '2rem' }}>Task Distribution Matrix</h3>
                <div style={{ display: 'flex', gap: '0.5rem', height: '40px', borderRadius: '10px', overflow: 'hidden', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ flex: metrics.todoCount || 0.1, background: 'var(--neon-purple)', opacity: 0.6, position: 'relative' }} title={`Todo: ${metrics.todoCount}`}></div>
                    <div style={{ flex: metrics.inProgressCount || 0.1, background: 'var(--accent-color)', opacity: 0.8, position: 'relative' }} title={`In Progress: ${metrics.inProgressCount}`}></div>
                    <div style={{ flex: metrics.reviewCount || 0.1, background: 'var(--warning-color)', opacity: 0.8, position: 'relative' }} title={`Review: ${metrics.reviewCount}`}></div>
                    <div style={{ flex: metrics.completedTasks || 0.1, background: 'var(--success-color)', opacity: 1, position: 'relative' }} title={`Completed: ${metrics.completedTasks}`}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', color: 'var(--secondary-text)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '8px', height: '8px', background: 'var(--neon-purple)' }}></div> Todo ({metrics.todoCount})</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '8px', height: '8px', background: 'var(--accent-color)' }}></div> Active ({metrics.inProgressCount})</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '8px', height: '8px', background: 'var(--warning-color)' }}></div> Review ({metrics.reviewCount})</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><div style={{ width: '8px', height: '8px', background: 'var(--success-color)' }}></div> Resolved ({metrics.completedTasks})</div>
                </div>
            </div>
        </div>
    );
};
