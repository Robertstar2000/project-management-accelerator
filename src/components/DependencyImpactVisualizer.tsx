import React, { useState, useMemo, useEffect } from 'react';
import { Project, EvidenceClass } from '../types';
import { D3DependencyForceGraph } from './D3DependencyForceGraph';
import { getStoredDependencyState, saveStoredDependencyState } from '../utils/dependencyAwareLogic';

export interface AffectedCalculation {
    id: string;
    name: string;
    formula: string;
    oldValue: string;
    newValue: string;
    unit: string;
    impactSeverity: 'Critical' | 'Moderate' | 'Minor';
    responsibleRole: string;
    status: 'Stale' | 'Recomputing' | 'Verified';
    notes: string;
}

export interface AffectedDocument {
    id: string;
    docTitle: string;
    section: string;
    evidenceClass: EvidenceClass;
    ownerRole: string;
    status: 'Needs Revision' | 'Reconciled';
    description: string;
}

export interface AffectedTask {
    id: string;
    taskName: string;
    role: string;
    originalDurationDays: number;
    scheduleDeltaDays: number;
    costImpactDollars: number;
    status: 'Baseline Outdated' | 'Rescheduled';
    downstreamPrerequisites: string[];
}

export interface UpstreamPreset {
    id: string;
    title: string;
    domain: 'Electrical' | 'Mechanical' | 'Thermal' | 'System Scope' | 'Cost Target';
    variableName: string;
    oldValue: string;
    newValue: string;
    rationale: string;
    calculations: AffectedCalculation[];
    documents: AffectedDocument[];
    tasks: AffectedTask[];
}

const UPSTREAM_PRESETS: UpstreamPreset[] = [
    {
        id: 'preset-voltage',
        title: 'Battery Cell Topology Reduction (4S → 3S)',
        domain: 'Electrical',
        variableName: 'Battery Nominal Pack Voltage',
        oldValue: '14.8V (4S Li-Ion)',
        newValue: '11.1V (3S Li-Ion)',
        rationale: 'Customer weight and volume constraints require removing 1 cell bank, reducing total pack voltage from 14.8V to 11.1V nominal.',
        calculations: [
            {
                id: 'CALC-001',
                name: 'Buck-Boost Inductor Peak Ripple Current',
                formula: 'I_peak = I_out / (1 - D) + (V_in * D) / (2 * f_sw * L)',
                oldValue: '3.42 A',
                newValue: '4.85 A (+41.8%)',
                unit: 'Amperes',
                impactSeverity: 'Critical',
                responsibleRole: 'Electrical Designer',
                status: 'Stale',
                notes: 'Inductor core saturation risk: peak current exceeds current L1 rating of 4.5A.'
            },
            {
                id: 'CALC-002',
                name: 'PCB Power Trace Copper I2R Heating',
                formula: 'P_loss = I_rms^2 * R_trace(width, copper_oz, temp)',
                oldValue: '0.48 W',
                newValue: '0.86 W (+79.2%)',
                unit: 'Watts',
                impactSeverity: 'Moderate',
                responsibleRole: 'PCB Layout Coordinator',
                status: 'Stale',
                notes: 'Requires increasing primary power bus width from 30 mil to 50 mil to keep temperature rise < 10C.'
            },
            {
                id: 'CALC-003',
                name: 'Full-Power Operating Battery Runtime',
                formula: 'T_run = (Pack_Capacity_Wh * Efficiency) / P_load_avg',
                oldValue: '18.4 hrs',
                newValue: '13.8 hrs (-25.0%)',
                unit: 'Hours',
                impactSeverity: 'Critical',
                responsibleRole: 'Systems Architect',
                status: 'Stale',
                notes: 'Customer requirement §3.2 states minimum 16 hours continuous telemetry: non-compliant without firmware power-gating.'
            }
        ],
        documents: [
            {
                id: 'DOC-01',
                docTitle: 'Statement of Work (SOW)',
                section: 'Section 2.1 — Electrical Power Specifications',
                evidenceClass: 'Observed',
                ownerRole: 'Project Lead',
                status: 'Needs Revision',
                description: 'Update nominal voltage rating and runtime commitment.'
            },
            {
                id: 'DOC-02',
                docTitle: 'Schematic Design Baseline Rev 1.2',
                section: 'Sheet 2: Power Regulation & Battery Charging',
                evidenceClass: 'Calculated',
                ownerRole: 'Electrical Designer',
                status: 'Needs Revision',
                description: 'Replace inductor L1 and input decoupling caps C1-C4 with higher-current rated variants.'
            },
            {
                id: 'DOC-03',
                docTitle: 'Thermal & Enclosure Analysis Dossier',
                section: 'Section 4: PCB Trace Self-Heating',
                evidenceClass: 'Calculated',
                ownerRole: 'Mechanical 3D Specialist',
                status: 'Needs Revision',
                description: 'Re-simulate junction temperature around power MOSFETs.'
            },
            {
                id: 'DOC-04',
                docTitle: 'Acceptance Test Procedure (ATP-PWR-01)',
                section: 'Step 4.2: Low-Voltage Cutoff Verification',
                evidenceClass: 'Assumption',
                ownerRole: 'Verification Engineer',
                status: 'Needs Revision',
                description: 'Lower undervoltage lockout (UVLO) trip threshold from 12.0V to 9.0V.'
            }
        ],
        tasks: [
            {
                id: 'TSK-01',
                taskName: 'WP-003: Re-route Power Stage PCB Traces',
                role: 'PCB Layout Coordinator',
                originalDurationDays: 5,
                scheduleDeltaDays: 4,
                costImpactDollars: 2400,
                status: 'Baseline Outdated',
                downstreamPrerequisites: ['Fabrication Panelization', 'Pick & Place Assembly']
            },
            {
                id: 'TSK-02',
                taskName: 'WP-007: Thermal Chamber Environmental Testing',
                role: 'Verification Engineer',
                originalDurationDays: 4,
                scheduleDeltaDays: 2,
                costImpactDollars: 1200,
                status: 'Baseline Outdated',
                downstreamPrerequisites: ['Final Integration Gate']
            },
            {
                id: 'TSK-03',
                taskName: 'Procurement: Source 5.5A Inductors (L1/L2)',
                role: 'Cost & Resource Capacity Planner',
                originalDurationDays: 3,
                scheduleDeltaDays: 6,
                costImpactDollars: 850,
                status: 'Baseline Outdated',
                downstreamPrerequisites: ['SMT Stencil Order']
            }
        ]
    },
    {
        id: 'preset-thermal',
        title: 'Operating Ambient Window Expansion (-10C..+50C → -30C..+60C)',
        domain: 'Thermal',
        variableName: 'Ambient Operational Temperature Limits',
        oldValue: '-10°C to +50°C',
        newValue: '-30°C to +60°C (Extended Environmental)',
        rationale: 'Defense & polar deployment qualification requires surviving -30C cold start and 60C direct desert solar soak.',
        calculations: [
            {
                id: 'CALC-101',
                name: 'Battery Cell Internal Resistance @ -30C',
                formula: 'R_internal(T) = R_0 * exp(E_a / (k * (T + 273.15)))',
                oldValue: '45 mΩ',
                newValue: '280 mΩ (6.2x spike)',
                unit: 'mΩ',
                impactSeverity: 'Critical',
                responsibleRole: 'Evidence Analyst',
                status: 'Stale',
                notes: 'Massive voltage sag under load at -30C: requires internal PTC self-heating element.'
            },
            {
                id: 'CALC-102',
                name: 'Chassis Natural Convection Heat Dissipation @ 60C',
                formula: 'Q_dissipated = h_conv * A * (T_junction - T_ambient)',
                oldValue: '8.4 W max',
                newValue: '4.2 W max (-50.0%)',
                unit: 'Watts',
                impactSeverity: 'Critical',
                responsibleRole: 'Mechanical 3D Specialist',
                status: 'Stale',
                notes: 'Available delta-T to ambient collapsed from 35C to 20C. Junction temperatures exceed 110C limits.'
            }
        ],
        documents: [
            {
                id: 'DOC-11',
                docTitle: 'Thermal Management Architecture Spec',
                section: 'Section 3: Heat Sink Sizing & TIM Selection',
                evidenceClass: 'Calculated',
                ownerRole: 'Systems Architect',
                status: 'Needs Revision',
                description: 'Upgrade TIM to 5.0 W/m-K thermal pad and add heat pipe to enclosure.'
            },
            {
                id: 'DOC-12',
                docTitle: 'Statement of Work (SOW)',
                section: 'Section 5.3: Environmental Qualification Criteria',
                evidenceClass: 'Observed',
                ownerRole: 'Project Lead',
                status: 'Needs Revision',
                description: 'Amend MIL-STD-810H Method 501/502 testing compliance matrix.'
            }
        ],
        tasks: [
            {
                id: 'TSK-11',
                taskName: 'Enclosure Mechanical Re-design (Add External Cooling Fins)',
                role: 'Mechanical 3D Specialist',
                originalDurationDays: 6,
                scheduleDeltaDays: 5,
                costImpactDollars: 3800,
                status: 'Baseline Outdated',
                downstreamPrerequisites: ['CNC Prototype Tooling', 'IP67 Ingress Test']
            },
            {
                id: 'TSK-12',
                taskName: 'Cold-Chamber Battery Pre-heat Cycling Protocol',
                role: 'Experiment Designer',
                originalDurationDays: 4,
                scheduleDeltaDays: 3,
                costImpactDollars: 1600,
                status: 'Baseline Outdated',
                downstreamPrerequisites: ['Phase Gate 4 Sign-off']
            }
        ]
    },
    {
        id: 'preset-telemetry',
        title: 'Telemetry Uplink Bandwidth Burst (10Hz → 50Hz)',
        domain: 'System Scope',
        variableName: 'Sensor Sampling & Transmit Frequency',
        oldValue: '10 Hz (10 samples/sec)',
        newValue: '50 Hz (50 samples/sec)',
        rationale: 'High-frequency vibration and transient shock capture requested by customer dynamics team.',
        calculations: [
            {
                id: 'CALC-201',
                name: 'Microcontroller DMA Buffer & RAM Allocation',
                formula: 'RAM_req = Samples/sec * Bytes_per_sample * Buffer_depth_seconds',
                oldValue: '32 KB (12.5% of SRAM)',
                newValue: '160 KB (62.5% of SRAM)',
                unit: 'Kilobytes',
                impactSeverity: 'Moderate',
                responsibleRole: 'Firmware Architect',
                status: 'Stale',
                notes: 'Risk of stack overflow: requires dedicated ring buffer in external QSPI PSRAM.'
            },
            {
                id: 'CALC-202',
                name: 'Cellular LTE-M Radio Transmitter Duty Cycle',
                formula: 'TX_Duty = (Packets/sec * Packet_Size) / Link_Throughput_bps',
                oldValue: '4.2%',
                newValue: '21.0% (5x increase)',
                unit: 'Percentage',
                impactSeverity: 'Critical',
                responsibleRole: 'Electrical Designer',
                status: 'Stale',
                notes: 'Average power draw jumps from 45mA to 160mA; increases monthly satellite/cellular data bill.'
            }
        ],
        documents: [
            {
                id: 'DOC-21',
                docTitle: 'Interface Control Document (ICD-004)',
                section: 'Section 4: Telemetry Packet Structure & Baud Rate',
                evidenceClass: 'Calculated',
                ownerRole: 'Systems Architect',
                status: 'Needs Revision',
                description: 'Define compressed binary payload protocol to conserve wireless throughput.'
            }
        ],
        tasks: [
            {
                id: 'TSK-21',
                taskName: 'Implement Lossless Compression in Sensor Firmware Driver',
                role: 'Firmware Architect',
                originalDurationDays: 5,
                scheduleDeltaDays: 4,
                costImpactDollars: 2100,
                status: 'Baseline Outdated',
                downstreamPrerequisites: ['Hardware-in-the-Loop Test']
            }
        ]
    }
];

export const DependencyImpactVisualizer: React.FC<{ project?: Project }> = ({ project }) => {
    const [selectedPresetId, setSelectedPresetId] = useState<string>(() => {
        const stored = getStoredDependencyState(project?.id);
        return stored.activePresetId || UPSTREAM_PRESETS[0].id;
    });
    const [viewMode, setViewMode] = useState<'graph' | 'table'>('graph');
    const [customVariable, setCustomVariable] = useState({ name: '', oldValue: '', newValue: '', domain: 'System Scope' });
    const [isCustomMode, setIsCustomMode] = useState(false);
    const [filterCategory, setFilterCategory] = useState<'all' | 'calculations' | 'documents' | 'tasks'>('all');

    // Live state of calculations, documents, and tasks for interactive reconciliation
    const activePreset = UPSTREAM_PRESETS.find(p => p.id === selectedPresetId) || UPSTREAM_PRESETS[0];

    const [calcsState, setCalcsState] = useState<Record<string, AffectedCalculation[]>>(() => {
        return getStoredDependencyState(project?.id).calcsState || {};
    });
    const [docsState, setDocsState] = useState<Record<string, AffectedDocument[]>>(() => {
        return getStoredDependencyState(project?.id).docsState || {};
    });
    const [tasksState, setTasksState] = useState<Record<string, AffectedTask[]>>(() => {
        return getStoredDependencyState(project?.id).tasksState || {};
    });
    const [isBatchRecomputing, setIsBatchRecomputing] = useState(false);

    // Sync from external events
    useEffect(() => {
        const handleSync = (e: any) => {
            if (e.detail?.projectId === (project?.id || 'default')) {
                const s = e.detail.state;
                if (s.activePresetId) setSelectedPresetId(s.activePresetId);
                if (s.calcsState) setCalcsState(s.calcsState);
                if (s.docsState) setDocsState(s.docsState);
                if (s.tasksState) setTasksState(s.tasksState);
            }
        };
        window.addEventListener('hmap-dependency-state-changed', handleSync);
        return () => window.removeEventListener('hmap-dependency-state-changed', handleSync);
    }, [project?.id]);

    const persistState = (newCalcs: any, newDocs: any, newTasks: any, presetId = selectedPresetId) => {
        saveStoredDependencyState({
            activePresetId: presetId,
            calcsState: newCalcs,
            docsState: newDocs,
            tasksState: newTasks
        }, project?.id);
    };

    // Get current lists
    const calculations = calcsState[activePreset.id] || activePreset.calculations;
    const documents = docsState[activePreset.id] || activePreset.documents;
    const tasks = tasksState[activePreset.id] || activePreset.tasks;

    const staleCalcsCount = calculations.filter(c => c.status !== 'Verified').length;
    const unreviewedDocsCount = documents.filter(d => d.status !== 'Reconciled').length;
    const outdatedTasksCount = tasks.filter(t => t.status !== 'Rescheduled').length;

    const totalScheduleImpactDays = tasks.reduce((sum, t) => sum + (t.status !== 'Rescheduled' ? t.scheduleDeltaDays : 0), 0);
    const totalCostImpact = tasks.reduce((sum, t) => sum + (t.status !== 'Rescheduled' ? t.costImpactDollars : 0), 0);

    // Toggle Calculation Recompute
    const handleRecomputeCalculation = (calcId: string) => {
        const updated = calculations.map(c => c.id === calcId ? { ...c, status: 'Verified' as const } : c);
        const nextCalcs = { ...calcsState, [activePreset.id]: updated };
        setCalcsState(nextCalcs);
        persistState(nextCalcs, docsState, tasksState);
    };

    // Toggle Document Review
    const handleReconcileDocument = (docId: string) => {
        const updated = documents.map(d => d.id === docId ? { ...d, status: 'Reconciled' as const } : d);
        const nextDocs = { ...docsState, [activePreset.id]: updated };
        setDocsState(nextDocs);
        persistState(calcsState, nextDocs, tasksState);
    };

    // Toggle Task Reschedule
    const handleRescheduleTask = (taskId: string) => {
        const updated = tasks.map(t => t.id === taskId ? { ...t, status: 'Rescheduled' as const } : t);
        const nextTasks = { ...tasksState, [activePreset.id]: updated };
        setTasksState(nextTasks);
        persistState(calcsState, docsState, nextTasks);
    };

    // Batch Recompute All
    const handleBatchRecompute = () => {
        setIsBatchRecomputing(true);
        setTimeout(() => {
            const updatedCalcs = calculations.map(c => ({ ...c, status: 'Verified' as const }));
            const updatedDocs = documents.map(d => ({ ...d, status: 'Reconciled' as const }));
            const updatedTasks = tasks.map(t => ({ ...t, status: 'Rescheduled' as const }));

            const nextCalcs = { ...calcsState, [activePreset.id]: updatedCalcs };
            const nextDocs = { ...docsState, [activePreset.id]: updatedDocs };
            const nextTasks = { ...tasksState, [activePreset.id]: updatedTasks };

            setCalcsState(nextCalcs);
            setDocsState(nextDocs);
            setTasksState(nextTasks);
            persistState(nextCalcs, nextDocs, nextTasks);
            setIsBatchRecomputing(false);
        }, 800);
    };

    const getSeverityBadge = (sev: AffectedCalculation['impactSeverity']) => {
        switch (sev) {
            case 'Critical': return { color: '#ff4444', bg: 'rgba(255, 68, 68, 0.2)' };
            case 'Moderate': return { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' };
            case 'Minor': return { color: '#00f2ff', bg: 'rgba(0, 242, 255, 0.2)' };
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header Control Card */}
            <div className="glass-card" style={{ padding: '2rem', borderLeft: '4px solid #ff4444' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 800 }}>Dependency-Aware Change Visualizer</h2>
                            <span className="chip-blue" style={{ fontSize: '0.8rem' }}>BLAST RADIUS & AUDIT TRACE</span>
                        </div>
                        <p style={{ color: 'var(--secondary-text)', maxWidth: '900px', margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                            Automatically traces and highlights downstream <strong>Calculations</strong>, <strong>Documents</strong>, and <strong>Tasks</strong> that require engineering recomputation, revision, or re-scheduling whenever an upstream specification changes.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={handleBatchRecompute}
                            disabled={isBatchRecomputing || (staleCalcsCount === 0 && unreviewedDocsCount === 0 && outdatedTasksCount === 0)}
                            className="button button-generate"
                            style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            {isBatchRecomputing ? (
                                <>
                                    <div className="spinner" style={{ width: '14px', height: '14px' }}></div>
                                    <span>Re-computing All...</span>
                                </>
                            ) : (
                                <span>⚡ Batch Recompute & Reconcile All</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Preset Selector */}
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--card-border)', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--secondary-text)', fontWeight: 700 }}>
                        Select Upstream Input Perturbation:
                    </span>

                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                        {UPSTREAM_PRESETS.map(preset => (
                            <button
                                key={preset.id}
                                onClick={() => { setSelectedPresetId(preset.id); setIsCustomMode(false); }}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '6px',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    border: selectedPresetId === preset.id && !isCustomMode ? '1px solid #ff4444' : '1px solid var(--card-border)',
                                    background: selectedPresetId === preset.id && !isCustomMode ? 'rgba(255, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                                    color: selectedPresetId === preset.id && !isCustomMode ? '#ff4444' : 'var(--secondary-text)'
                                }}
                            >
                                [{preset.domain}] {preset.title}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Upstream Parameter Detail Card */}
                <div style={{
                    marginTop: '1.5rem',
                    background: 'rgba(255, 68, 68, 0.04)',
                    border: '1px solid rgba(255, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    display: 'grid',
                    gridTemplateColumns: '1.5fr 1fr 1fr',
                    gap: '1.5rem',
                    alignItems: 'center'
                }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: '#ff4444', fontWeight: 800, letterSpacing: '0.5px' }}>
                            UPSTREAM INPUT PARAMETER: {activePreset.variableName}
                        </div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0.3rem 0' }}>
                            {activePreset.title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>
                            {activePreset.rationale}
                        </div>
                    </div>

                    <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--secondary-text)' }}>BASELINE (OLD) VALUE</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#94a3b8', textDecoration: 'line-through' }}>
                            {activePreset.oldValue}
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255, 68, 68, 0.1)', padding: '0.75rem', borderRadius: '6px', border: '1px solid rgba(255, 68, 68, 0.4)' }}>
                        <div style={{ fontSize: '0.7rem', color: '#ff8888' }}>PROPOSED (NEW) VALUE</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ff4444' }}>
                            {activePreset.newValue}
                        </div>
                    </div>
                </div>

                {/* Scoreboard Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>Stale Calculations</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: staleCalcsCount > 0 ? '#ff4444' : '#00ffaa' }}>
                            {staleCalcsCount} / {calculations.length}
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>Documents to Revise</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: unreviewedDocsCount > 0 ? '#f59e0b' : '#00ffaa' }}>
                            {unreviewedDocsCount} / {documents.length}
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>Tasks Needing Reschedule</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: outdatedTasksCount > 0 ? '#00f2ff' : '#00ffaa' }}>
                            {outdatedTasksCount} / {tasks.length}
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>Schedule Volatility</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f59e0b' }}>
                            +{totalScheduleImpactDays} Days
                        </div>
                    </div>

                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.85rem', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>Budget Impact</div>
                        <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ff4444' }}>
                            +${totalCostImpact.toLocaleString()}
                        </div>
                    </div>
                </div>
            </div>

            {/* View Mode & Filter Toggle Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', marginRight: '0.5rem' }}>View Filter:</span>
                    {(['all', 'calculations', 'documents', 'tasks'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilterCategory(tab)}
                            style={{
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                border: filterCategory === tab ? '1px solid #00f2ff' : '1px solid var(--card-border)',
                                background: filterCategory === tab ? 'rgba(0, 242, 255, 0.15)' : 'transparent',
                                color: filterCategory === tab ? '#00f2ff' : 'var(--secondary-text)'
                            }}
                        >
                            {tab === 'all' ? 'All Impacts' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* View Mode Switcher */}
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '3px', border: '1px solid var(--card-border)' }}>
                    <button
                        onClick={() => setViewMode('graph')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: 'none',
                            background: viewMode === 'graph' ? 'var(--primary-gradient)' : 'transparent',
                            color: viewMode === 'graph' ? '#fff' : 'var(--secondary-text)',
                            transition: 'all 0.2s'
                        }}
                    >
                        🕸️ D3 Force Graph
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: 'none',
                            background: viewMode === 'table' ? 'var(--primary-gradient)' : 'transparent',
                            color: viewMode === 'table' ? '#fff' : 'var(--secondary-text)',
                            transition: 'all 0.2s'
                        }}
                    >
                        📋 Blast-Radius Breakdown
                    </button>
                </div>
            </div>

            {viewMode === 'graph' ? (
                <D3DependencyForceGraph project={project} />
            ) : (
                /* Visual Dependency Flow Columns */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
                
                {/* COLUMN 1: CALCULATIONS REQUIRING RE-COMPUTATION */}
                {(filterCategory === 'all' || filterCategory === 'calculations') && (
                    <div className="glass-card" style={{ padding: '1.5rem', borderTop: '4px solid #ff4444' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#ff4444', fontWeight: 800 }}>STAGE 1 DEPENDENCY</span>
                                <h3 style={{ fontSize: '1.2rem', margin: '0.2rem 0', fontWeight: 700 }}>Calculations Requiring Review</h3>
                            </div>
                            <span style={{
                                fontSize: '0.75rem',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                background: staleCalcsCount > 0 ? 'rgba(255, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                color: staleCalcsCount > 0 ? '#ff4444' : '#10b981',
                                fontWeight: 700
                            }}>
                                {staleCalcsCount > 0 ? `${staleCalcsCount} STALE` : 'ALL VERIFIED'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {calculations.map(calc => {
                                const isStale = calc.status !== 'Verified';
                                const sevBadge = getSeverityBadge(calc.impactSeverity);
                                return (
                                    <div
                                        key={calc.id}
                                        style={{
                                            background: isStale ? 'rgba(255, 68, 68, 0.03)' : 'rgba(16, 185, 129, 0.03)',
                                            border: isStale ? '1px solid rgba(255, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                                            borderRadius: '8px',
                                            padding: '1rem'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                                            <div>
                                                <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#00f2ff', fontWeight: 700 }}>
                                                    {calc.id}
                                                </span>
                                                <h4 style={{ fontSize: '0.95rem', margin: '0.2rem 0', fontWeight: 700, color: '#fff' }}>
                                                    {calc.name}
                                                </h4>
                                            </div>

                                            <span style={{
                                                fontSize: '0.7rem',
                                                padding: '2px 6px',
                                                borderRadius: '3px',
                                                background: sevBadge.bg,
                                                color: sevBadge.color,
                                                fontWeight: 700
                                            }}>
                                                {calc.impactSeverity.toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Formula block */}
                                        <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '0.5rem 0.75rem', borderRadius: '4px', fontFamily: 'monospace', fontSize: '0.75rem', color: '#cbd5e1', marginBottom: '0.75rem' }}>
                                            {calc.formula}
                                        </div>

                                        {/* Old vs New values */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.8rem' }}>
                                            <div>
                                                <span style={{ color: 'var(--secondary-text)' }}>Old: </span>
                                                <span style={{ textDecoration: 'line-through', color: '#94a3b8' }}>{calc.oldValue}</span>
                                            </div>
                                            <div>
                                                <span style={{ color: 'var(--secondary-text)' }}>New: </span>
                                                <span style={{ color: '#ff4444', fontWeight: 700 }}>{calc.newValue}</span>
                                            </div>
                                        </div>

                                        <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.8rem', color: 'var(--secondary-text)', lineHeight: 1.4 }}>
                                            {calc.notes}
                                        </p>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>
                                                Role: <strong style={{ color: '#fff' }}>{calc.responsibleRole}</strong>
                                            </span>

                                            {isStale ? (
                                                <button
                                                    onClick={() => handleRecomputeCalculation(calc.id)}
                                                    style={{
                                                        background: 'rgba(255, 68, 68, 0.15)',
                                                        border: '1px solid #ff4444',
                                                        color: '#ff4444',
                                                        padding: '4px 10px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Recompute Equation
                                                </button>
                                            ) : (
                                                <span style={{ color: '#00ffaa', fontSize: '0.75rem', fontWeight: 700 }}>
                                                    ✓ Verified Up-to-Date
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* COLUMN 2: DOCUMENTS REQUIRING REVISION & RE-APPROVAL */}
                {(filterCategory === 'all' || filterCategory === 'documents') && (
                    <div className="glass-card" style={{ padding: '1.5rem', borderTop: '4px solid #f59e0b' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 800 }}>STAGE 2 DEPENDENCY</span>
                                <h3 style={{ fontSize: '1.2rem', margin: '0.2rem 0', fontWeight: 700 }}>Documents Requiring Revision</h3>
                            </div>
                            <span style={{
                                fontSize: '0.75rem',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                background: unreviewedDocsCount > 0 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                color: unreviewedDocsCount > 0 ? '#f59e0b' : '#10b981',
                                fontWeight: 700
                            }}>
                                {unreviewedDocsCount > 0 ? `${unreviewedDocsCount} PENDING` : 'ALL RECONCILED'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {documents.map(doc => {
                                const isPending = doc.status !== 'Reconciled';
                                return (
                                    <div
                                        key={doc.id}
                                        style={{
                                            background: isPending ? 'rgba(245, 158, 11, 0.03)' : 'rgba(16, 185, 129, 0.03)',
                                            border: isPending ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                                            borderRadius: '8px',
                                            padding: '1rem'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                                            <div>
                                                <h4 style={{ fontSize: '0.95rem', margin: '0 0 0.2rem 0', fontWeight: 700, color: '#fff' }}>
                                                    {doc.docTitle}
                                                </h4>
                                                <div style={{ fontSize: '0.75rem', color: '#00f2ff', fontWeight: 600 }}>
                                                    {doc.section}
                                                </div>
                                            </div>

                                            <span style={{
                                                fontSize: '0.7rem',
                                                padding: '2px 6px',
                                                borderRadius: '3px',
                                                background: 'rgba(255, 255, 255, 0.06)',
                                                color: '#cbd5e1'
                                            }}>
                                                [{doc.evidenceClass}]
                                            </span>
                                        </div>

                                        <p style={{ margin: '0.5rem 0 0.75rem 0', fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                                            {doc.description}
                                        </p>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>
                                                Owner: <strong style={{ color: '#fff' }}>{doc.ownerRole}</strong>
                                            </span>

                                            {isPending ? (
                                                <button
                                                    onClick={() => handleReconcileDocument(doc.id)}
                                                    style={{
                                                        background: 'rgba(245, 158, 11, 0.15)',
                                                        border: '1px solid #f59e0b',
                                                        color: '#f59e0b',
                                                        padding: '4px 10px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Mark Reviewed
                                                </button>
                                            ) : (
                                                <span style={{ color: '#00ffaa', fontSize: '0.75rem', fontWeight: 700 }}>
                                                    ✓ Reconciled
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* COLUMN 3: TASKS & WORK PACKAGES REQUIRING RESCHEDULE */}
                {(filterCategory === 'all' || filterCategory === 'tasks') && (
                    <div className="glass-card" style={{ padding: '1.5rem', borderTop: '4px solid #00f2ff' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#00f2ff', fontWeight: 800 }}>STAGE 3 DEPENDENCY</span>
                                <h3 style={{ fontSize: '1.2rem', margin: '0.2rem 0', fontWeight: 700 }}>Tasks & Schedule Volatility</h3>
                            </div>
                            <span style={{
                                fontSize: '0.75rem',
                                padding: '3px 8px',
                                borderRadius: '4px',
                                background: outdatedTasksCount > 0 ? 'rgba(0, 242, 255, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                color: outdatedTasksCount > 0 ? '#00f2ff' : '#10b981',
                                fontWeight: 700
                            }}>
                                {outdatedTasksCount > 0 ? `${outdatedTasksCount} AFFECTED` : 'ALL ALIGNED'}
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {tasks.map(task => {
                                const isOutdated = task.status !== 'Rescheduled';
                                return (
                                    <div
                                        key={task.id}
                                        style={{
                                            background: isOutdated ? 'rgba(0, 242, 255, 0.03)' : 'rgba(16, 185, 129, 0.03)',
                                            border: isOutdated ? '1px solid rgba(0, 242, 255, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                                            borderRadius: '8px',
                                            padding: '1rem'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                                            <h4 style={{ fontSize: '0.95rem', margin: 0, fontWeight: 700, color: '#fff' }}>
                                                {task.taskName}
                                            </h4>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>
                                                {task.role}
                                            </span>
                                        </div>

                                        {/* Impact Metrics */}
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', margin: '0.6rem 0', background: 'rgba(255, 255, 255, 0.02)', padding: '0.5rem', borderRadius: '4px' }}>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--secondary-text)' }}>Schedule Delay</div>
                                                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#f59e0b' }}>
                                                    +{task.scheduleDeltaDays} Days
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--secondary-text)' }}>Cost Delta</div>
                                                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ff4444' }}>
                                                    +${task.costImpactDollars.toLocaleString()}
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', marginBottom: '0.75rem' }}>
                                            Blocks downstream: <span style={{ color: '#00f2ff' }}>{task.downstreamPrerequisites.join(', ')}</span>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                            {isOutdated ? (
                                                <button
                                                    onClick={() => handleRescheduleTask(task.id)}
                                                    style={{
                                                        background: 'rgba(0, 242, 255, 0.15)',
                                                        border: '1px solid #00f2ff',
                                                        color: '#00f2ff',
                                                        padding: '4px 10px',
                                                        borderRadius: '4px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 700,
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    Update Task Baseline
                                                </button>
                                            ) : (
                                                <span style={{ color: '#00ffaa', fontSize: '0.75rem', fontWeight: 700 }}>
                                                    ✓ Schedule Re-aligned
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
            )}
        </div>
    );
};
