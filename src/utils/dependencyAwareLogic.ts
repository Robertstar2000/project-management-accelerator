import { Project, EvidenceClass } from '../types';

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
    phase?: number;
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

export const UPSTREAM_PRESETS: UpstreamPreset[] = [
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
                description: 'Update nominal voltage rating and runtime commitment.',
                phase: 5
            },
            {
                id: 'DOC-02',
                docTitle: 'Schematic Design Baseline Rev 1.2',
                section: 'Sheet 2: Power Regulation & Battery Charging',
                evidenceClass: 'Calculated',
                ownerRole: 'Electrical Designer',
                status: 'Needs Revision',
                description: 'Replace inductor L1 and input decoupling caps C1-C4 with higher-current rated variants.',
                phase: 7
            },
            {
                id: 'DOC-03',
                docTitle: 'Thermal & Enclosure Analysis Dossier',
                section: 'Section 4: PCB Trace Self-Heating',
                evidenceClass: 'Calculated',
                ownerRole: 'Mechanical 3D Specialist',
                status: 'Needs Revision',
                description: 'Re-simulate junction temperature around power MOSFETs.',
                phase: 6
            },
            {
                id: 'DOC-04',
                docTitle: 'Acceptance Test Procedure (ATP-PWR-01)',
                section: 'Step 4.2: Low-Voltage Cutoff Verification',
                evidenceClass: 'Assumption',
                ownerRole: 'Verification Engineer',
                status: 'Needs Revision',
                description: 'Lower undervoltage lockout (UVLO) trip threshold from 12.0V to 9.0V.',
                phase: 9
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
                description: 'Upgrade TIM to 5.0 W/m-K thermal pad and add heat pipe to enclosure.',
                phase: 6
            },
            {
                id: 'DOC-12',
                docTitle: 'Statement of Work (SOW)',
                section: 'Section 5.3: Environmental Qualification Criteria',
                evidenceClass: 'Observed',
                ownerRole: 'Project Lead',
                status: 'Needs Revision',
                description: 'Amend MIL-STD-810H Method 501/502 testing compliance matrix.',
                phase: 5
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
                description: 'Define compressed binary payload protocol to conserve wireless throughput.',
                phase: 7
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

export interface D3GraphNode {
    id: string;
    label: string;
    sublabel?: string;
    type: 'input' | 'calculation' | 'document' | 'task' | 'prerequisite';
    isStale: boolean;
    status: string;
    severity?: 'Critical' | 'Moderate' | 'Minor';
    details: {
        role?: string;
        formula?: string;
        oldValue?: string;
        newValue?: string;
        notes?: string;
        description?: string;
        section?: string;
        phase?: number;
        scheduleDeltaDays?: number;
        costImpactDollars?: number;
        downstream?: string[];
    };
    // D3 simulation coordinates
    x?: number;
    y?: number;
    vx?: number;
    vy?: number;
    fx?: number | null;
    fy?: number | null;
}

export interface D3GraphLink {
    source: string | D3GraphNode;
    target: string | D3GraphNode;
    type: 'perturbs' | 'calculates' | 'informs' | 'triggers' | 'blocks';
    isStale: boolean;
}

export interface DependencyGraphData {
    nodes: D3GraphNode[];
    links: D3GraphLink[];
    staleCount: number;
    staleCalcsCount: number;
    unreviewedDocsCount: number;
    outdatedTasksCount: number;
}

const STORAGE_KEY_PREFIX = 'hmap_dependency_state_';

export interface StoredDependencyState {
    activePresetId: string;
    calcsState: Record<string, AffectedCalculation[]>;
    docsState: Record<string, AffectedDocument[]>;
    tasksState: Record<string, AffectedTask[]>;
}

export function getStoredDependencyState(projectId?: string): StoredDependencyState {
    const key = `${STORAGE_KEY_PREFIX}${projectId || 'default'}`;
    try {
        const raw = localStorage.getItem(key);
        if (raw) {
            return JSON.parse(raw);
        }
    } catch (e) {
        console.warn('Failed to parse dependency state from localStorage', e);
    }
    return {
        activePresetId: UPSTREAM_PRESETS[0].id,
        calcsState: {},
        docsState: {},
        tasksState: {}
    };
}

export function saveStoredDependencyState(state: StoredDependencyState, projectId?: string): void {
    const key = `${STORAGE_KEY_PREFIX}${projectId || 'default'}`;
    try {
        localStorage.setItem(key, JSON.stringify(state));
        window.dispatchEvent(new CustomEvent('hmap-dependency-state-changed', {
            detail: { projectId: projectId || 'default', state }
        }));
    } catch (e) {
        console.warn('Failed to save dependency state to localStorage', e);
    }
}

/**
 * Builds the graph nodes & links from the active preset + project HMAP tasks & documents
 */
export function buildDependencyGraph(
    presetId: string = UPSTREAM_PRESETS[0].id,
    project?: Project,
    overrideState?: Partial<StoredDependencyState>
): DependencyGraphData {
    const activePreset = UPSTREAM_PRESETS.find(p => p.id === presetId) || UPSTREAM_PRESETS[0];

    const calcs = overrideState?.calcsState?.[activePreset.id] || activePreset.calculations;
    const docs = overrideState?.docsState?.[activePreset.id] || activePreset.documents;
    const tasks = overrideState?.tasksState?.[activePreset.id] || activePreset.tasks;

    const nodes: D3GraphNode[] = [];
    const links: D3GraphLink[] = [];

    // 1. Root Upstream Input Node
    const inputNodeId = `INP-${activePreset.id}`;
    nodes.push({
        id: inputNodeId,
        label: activePreset.variableName,
        sublabel: `${activePreset.domain} Input`,
        type: 'input',
        isStale: true, // Upstream input has changed / is perturbed
        status: 'Perturbed',
        details: {
            oldValue: activePreset.oldValue,
            newValue: activePreset.newValue,
            notes: activePreset.rationale,
            description: activePreset.title
        }
    });

    // 2. Calculation Nodes (Stage 1)
    calcs.forEach(calc => {
        const isStale = calc.status !== 'Verified';
        nodes.push({
            id: calc.id,
            label: calc.name,
            sublabel: calc.formula.substring(0, 24) + '...',
            type: 'calculation',
            isStale,
            status: calc.status,
            severity: calc.impactSeverity,
            details: {
                role: calc.responsibleRole,
                formula: calc.formula,
                oldValue: calc.oldValue,
                newValue: calc.newValue,
                notes: calc.notes
            }
        });

        // Link from Input to Calculation
        links.push({
            source: inputNodeId,
            target: calc.id,
            type: 'perturbs',
            isStale
        });
    });

    // 3. Document Nodes (Stage 2)
    docs.forEach(doc => {
        const isStale = doc.status !== 'Reconciled';
        nodes.push({
            id: doc.id,
            label: doc.docTitle,
            sublabel: doc.section,
            type: 'document',
            isStale,
            status: doc.status,
            details: {
                role: doc.ownerRole,
                section: doc.section,
                description: doc.description,
                phase: doc.phase
            }
        });

        // Link from calculations to documents (or from input if no calculations)
        if (calcs.length > 0) {
            // Distribute links to related calculations
            calcs.forEach(c => {
                links.push({
                    source: c.id,
                    target: doc.id,
                    type: 'informs',
                    isStale: isStale || c.status !== 'Verified'
                });
            });
        } else {
            links.push({
                source: inputNodeId,
                target: doc.id,
                type: 'perturbs',
                isStale
            });
        }
    });

    // Also include matching project documents from project.documents if available
    if (project?.documents) {
        project.documents.slice(0, 4).forEach((pDoc) => {
            const pDocId = `PDOC-${pDoc.id}`;
            if (!nodes.some(n => n.id === pDocId)) {
                nodes.push({
                    id: pDocId,
                    label: `Phase ${pDoc.phase}: ${pDoc.title}`,
                    sublabel: `Status: ${pDoc.status}`,
                    type: 'document',
                    isStale: pDoc.status !== 'Approved',
                    status: pDoc.status,
                    details: {
                        phase: pDoc.phase,
                        role: pDoc.owner,
                        description: `HMAP Phase ${pDoc.phase} Documentation Deliverable (${pDoc.version})`
                    }
                });

                // Connect to a document node
                if (docs[0]) {
                    links.push({
                        source: docs[0].id,
                        target: pDocId,
                        type: 'informs',
                        isStale: docs[0].status !== 'Reconciled'
                    });
                }
            }
        });
    }

    // 4. Task Nodes (Stage 3)
    tasks.forEach(task => {
        const isStale = task.status !== 'Rescheduled';
        nodes.push({
            id: task.id,
            label: task.taskName,
            sublabel: `Δ +${task.scheduleDeltaDays}d | +$${task.costImpactDollars}`,
            type: 'task',
            isStale,
            status: task.status,
            details: {
                role: task.role,
                scheduleDeltaDays: task.scheduleDeltaDays,
                costImpactDollars: task.costImpactDollars,
                downstream: task.downstreamPrerequisites,
                notes: `Original duration: ${task.originalDurationDays} days`
            }
        });

        // Link from Documents to Tasks
        docs.forEach(d => {
            links.push({
                source: d.id,
                target: task.id,
                type: 'triggers',
                isStale: isStale || d.status !== 'Reconciled'
            });
        });

        // 5. Downstream Prerequisites / Gates
        task.downstreamPrerequisites.forEach((prereq, idx) => {
            const prereqId = `GATE-${task.id}-${idx}`;
            if (!nodes.some(n => n.id === prereqId)) {
                nodes.push({
                    id: prereqId,
                    label: prereq,
                    sublabel: 'Downstream Gate',
                    type: 'prerequisite',
                    isStale,
                    status: isStale ? 'Blocked' : 'Clear',
                    details: {
                        notes: `Blocked by ${task.taskName}`
                    }
                });

                links.push({
                    source: task.id,
                    target: prereqId,
                    type: 'blocks',
                    isStale
                });
            }
        });
    });

    const staleCalcsCount = calcs.filter(c => c.status !== 'Verified').length;
    const unreviewedDocsCount = docs.filter(d => d.status !== 'Reconciled').length;
    const outdatedTasksCount = tasks.filter(t => t.status !== 'Rescheduled').length;
    const staleCount = staleCalcsCount + unreviewedDocsCount + outdatedTasksCount;

    return {
        nodes,
        links,
        staleCount,
        staleCalcsCount,
        unreviewedDocsCount,
        outdatedTasksCount
    };
}

/**
 * Calculates current stale count for a project
 */
export function calculateStaleCount(projectId?: string): number {
    const state = getStoredDependencyState(projectId);
    const graphData = buildDependencyGraph(state.activePresetId, undefined, state);
    return graphData.staleCount;
}
