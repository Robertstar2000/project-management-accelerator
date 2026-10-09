import {
    SpecialistRoleDef,
    AgentHarnessTask,
    MemoryNode,
    TreeOfThoughtsNode,
    ChallengePanelReview,
    DesignTradeStudy,
    SchematicPartItem,
    MechanicalAssemblyPackage,
    OutlineDrivenDocument,
    GroundTruthGate,
    ValueInformationItem,
    ConsistencyIssue
} from '../types';

export const SPECIALIST_ROLES: SpecialistRoleDef[] = [
    // Science Specialists
    {
        id: 'literature_researcher',
        name: 'Literature & Prior Art Researcher',
        domain: 'science',
        purpose: 'Synthesize published experimental papers, patents, and technical standards to establish prior art.',
        instructions: 'Focus on peer-reviewed evidence and empirical benchmarks. Never extrapolate beyond published bounds without explicit caveat.',
        permittedTools: ['Google Search', 'arXiv Retrieval', 'Patent DB API', 'Citation Graph Explorer'],
        evidenceRequirements: 'Direct DOI citation or standard specification section number.',
        deliverables: ['State-of-the-Art Dossier', 'Prior Art Matrix', 'Empirical Benchmark Table'],
        stoppingConditions: 'Minimum 5 peer-reviewed sources or definitive standard citation reached.',
        autonomyLevel: 'Autonomous'
    },
    {
        id: 'evidence_analyst',
        name: 'Evidence & Uncertainty Analyst',
        domain: 'science',
        purpose: 'Evaluate data quality, sample sizes, confidence intervals, and systematic errors in experimental data.',
        instructions: 'Label every data claim as [Observed], [Calculated], [Assumption], or [Unknown]. Highlight unquantified variance.',
        permittedTools: ['Statistical Analyzer', 'Monte Carlo Engine', 'Error Propagation Calculator'],
        evidenceRequirements: 'P-values, confidence intervals (95% CI), or measurement equipment calibration dates.',
        deliverables: ['Uncertainty Assessment Sheet', 'Evidence Quality Scorecard'],
        stoppingConditions: 'All assumptions isolated with sensitivity bounds.',
        autonomyLevel: 'Semi-Autonomous'
    },
    {
        id: 'hypothesis_specialist',
        name: 'Hypothesis & Causal Inference Specialist',
        domain: 'science',
        purpose: 'Structure falsifiable hypotheses and distinguish correlation from causal mechanisms.',
        instructions: 'Formulate null hypotheses and define the exact threshold of evidence that would reject the proposition.',
        permittedTools: ['Causal Directed Acyclic Graph (DAG) Modeler', 'Falsification Matrix Tool'],
        evidenceRequirements: 'Explicit pre-registered falsification criteria.',
        deliverables: ['Hypothesis Registry', 'Falsification Protocol'],
        stoppingConditions: 'At least 2 mutually competing hypotheses articulated.',
        autonomyLevel: 'Semi-Autonomous'
    },
    {
        id: 'experiment_designer',
        name: 'Experiment & Simulation Designer',
        domain: 'science',
        purpose: 'Formulate empirical test protocols, Latin hypercube sampling designs, and physics-based simulations.',
        instructions: 'Design experiments that maximize information gain per dollar and hour spent.',
        permittedTools: ['DOE Matrix Generator', 'Simulation Harness', 'Sensor Instrumentation Planner'],
        evidenceRequirements: 'Calculated statistical power > 0.80 and reproducible parameter deck.',
        deliverables: ['Experimental Protocol Plan', 'Simulation Input Parameter Deck'],
        stoppingConditions: 'Simulation converged with residual tolerances < 1e-4.',
        autonomyLevel: 'Semi-Autonomous'
    },

    // Engineering Discipline Specialists
    {
        id: 'electrical_designer',
        name: 'Electrical & Electronics Engineer',
        domain: 'engineering',
        purpose: 'Design power distribution, signal routing, connector pinouts, component ratings, and schematic topologies.',
        instructions: 'Enforce schematic-to-BOM synchronicity. Every reference designator must match a purchaseable MPN.',
        permittedTools: ['Schematic Capture Linter', 'Thermal Derating Tool', 'Pinout Verifier'],
        evidenceRequirements: 'Component datasheets, derating curve compliance > 20% margin.',
        deliverables: ['Synchronized Schematic', 'Connector Pinout Spec', 'Preliminary BOM'],
        stoppingConditions: 'Zero ERC (Electrical Rules Check) warnings or unconnected nets.',
        autonomyLevel: 'Semi-Autonomous'
    },
    {
        id: 'mechanical_3d_specialist',
        name: 'Mechanical & 3D Geometry Specialist',
        domain: 'engineering',
        purpose: 'Coordinate parametric solid models, dimensional checks, exploded views, tolerance stack-ups, and STL files.',
        instructions: 'Verify clearance boundaries and kinematic ranges. Ensure GD&T (Geometric Dimensioning and Tolerancing) standards.',
        permittedTools: ['Parametric CAD Viewer', 'Interference Checker', 'STL Mesh Validator'],
        evidenceRequirements: 'Worst-case tolerance stack-up analysis and watertight non-manifold mesh check.',
        deliverables: ['Validated 3D Model Package', 'Exploded View Diagram', 'Inspection Criteria Sheet'],
        stoppingConditions: 'Zero mesh non-manifold errors, minimum clearance > 0.5mm verified.',
        autonomyLevel: 'Semi-Autonomous'
    },
    {
        id: 'systems_architect',
        name: 'Systems Architect & Trade Study Lead',
        domain: 'engineering',
        purpose: 'Decompose high-level mission requirements into subsystem interface definitions and perform trade studies.',
        instructions: 'Run trade studies using explicit weighted criteria. Document rejected candidates with rationale.',
        permittedTools: ['Trade Matrix Engine', 'Interface Control Document (ICD) Generator', 'SysML Mapper'],
        evidenceRequirements: 'Weighted criteria normalized to 1.0 with sensitivity bounds on top-ranked option.',
        deliverables: ['System Architecture Baseline', 'Interface Control Matrix', 'Formal Trade Study Report'],
        stoppingConditions: 'Top candidate holds margin over competitor under +/- 15% sensitivity perturbation.',
        autonomyLevel: 'Semi-Autonomous'
    },
    {
        id: 'pcb_layout_coordinator',
        name: 'PCB Layout & DFM Coordinator',
        domain: 'engineering',
        purpose: 'Bridge schematic capture with board physical placement, high-speed routing rules, and manufacturing files.',
        instructions: 'Verify trace impedance, thermal relief, copper clearance, and IPC Class 2/3 manufacturing constraints.',
        permittedTools: ['Design Rule Checker (DRC)', 'Gerber Analyzer', 'DFM Rules Engine'],
        evidenceRequirements: 'DRC clean report and fabricator panelization sign-off.',
        deliverables: ['Gerber / ODB++ Manufacturing Package', 'Pick-and-Place File', 'Drill Table'],
        stoppingConditions: 'Zero DRC violations, copper-to-edge clearances verified.',
        autonomyLevel: 'Semi-Autonomous'
    },
    {
        id: 'verification_engineer',
        name: 'Verification & Test Protocol Engineer',
        domain: 'engineering',
        purpose: 'Formulate acceptance test procedures (ATP) and bind every technical requirement to a verified test run.',
        instructions: 'Do not mark any requirement verified without linked passing test output or calibrated sensor log.',
        permittedTools: ['Requirement Traceability Matrix (RTM)', 'Automated Test Harness', 'Calibration Inspector'],
        evidenceRequirements: 'Linked pass/fail log with test equipment asset tags.',
        deliverables: ['Verification Matrix', 'Acceptance Test Procedure (ATP)', 'Test Summary Report'],
        stoppingConditions: '100% of P0 requirements traced to verification procedures.',
        autonomyLevel: 'Semi-Autonomous'
    },

    // Project Management Specialists
    {
        id: 'wbs_planner',
        name: 'Work Breakdown Structure (WBS) Planner',
        domain: 'project_management',
        purpose: 'Deconstruct technical baselines into deliverable work packages, dictionary items, and completion definitions.',
        instructions: 'Ensure Mutually Exclusive, Collectively Exhaustive (MECE) boundaries between work packages.',
        permittedTools: ['WBS Tree Builder', 'Deliverable Scope Linter', 'Work Package Dictionary'],
        evidenceRequirements: 'Explicit acceptance criteria and assigned labor role for every work package.',
        deliverables: ['Hierarchical WBS', 'Work Package Dictionary', 'Scope Baseline'],
        stoppingConditions: 'All work packages decompose to 8-80 hours duration.',
        autonomyLevel: 'Autonomous'
    },
    {
        id: 'critical_path_scheduler',
        name: 'Critical Path & Schedule Analyst',
        domain: 'project_management',
        purpose: 'Model precedence networks, calculate Early/Late Start/Finish, compute Total Float, and identify the Critical Path.',
        instructions: 'Audit schedule logic for dangling tasks, excessive lead/lag, and artificial constraints.',
        permittedTools: ['CPM Engine', 'Gantt Simulator', 'Float Audit Tool'],
        evidenceRequirements: 'Zero unlinked tasks (all tasks have predecessors and successors except project start/end).',
        deliverables: ['Critical Path Network', 'Float & Free Slack Analysis', 'Master Milestone Schedule'],
        stoppingConditions: 'Critical path isolated and total project duration calculated.',
        autonomyLevel: 'Autonomous'
    },
    {
        id: 'cost_resource_planner',
        name: 'Cost & Resource Capacity Planner',
        domain: 'project_management',
        purpose: 'Calculate burdened labor costs, direct material costs, equipment depreciation, and balance team weekly utilization.',
        instructions: 'Flag team role overload (> 40h/week). Apply standard overhead multipliers consistently.',
        permittedTools: ['Earned Value Engine', 'Resource Leveling Optimizer', 'Burdened Rate Calculator'],
        evidenceRequirements: 'Burdened labor rate audit and itemized BOM cost roll-up.',
        deliverables: ['Time-Phased Budget', 'Resource Allocation Histogram', 'BOM Cost Aggregation'],
        stoppingConditions: 'No assigned resource exceeds 100% allocation for > 2 consecutive weeks.',
        autonomyLevel: 'Autonomous'
    },
    {
        id: 'risk_change_manager',
        name: 'Risk & Change Impact Specialist',
        domain: 'project_management',
        purpose: 'Identify project vulnerabilities, compute Expected Monetary Value (EMV), and simulate change request blast radius.',
        instructions: 'Calculate downstream impact on cost, duration, and dependencies before approving change packages.',
        permittedTools: ['Blast Radius Calculator', 'Monte Carlo Risk Modeler', 'Change Impact Engine'],
        evidenceRequirements: 'Quantitative delta on schedule (days) and budget ($) for every proposed change.',
        deliverables: ['Risk Breakdown Structure (RBS)', 'Change Request Impact Dossier', 'Contingency Reserve Plan'],
        stoppingConditions: 'All high-severity risks have funded mitigation actions.',
        autonomyLevel: 'Autonomous'
    },

    // Independent Control & Governance Roles
    {
        id: 'ground_truth_gatekeeper',
        name: 'Ground Truth Gatekeeper',
        domain: 'governance',
        purpose: 'Audit evidence claims against acceptance criteria before promoting deliverables into the next phase.',
        instructions: 'Reject any promotion where claims rely on [Unknown] or uncalibrated [Assumption] without explicit waiver.',
        permittedTools: ['Evidence Class Inspector', 'Gatekeeper Check Engine', 'Waiver Logger'],
        evidenceRequirements: 'Mandatory [Observed] or validated [Calculated] proof for phase-gate criteria.',
        deliverables: ['Phase Gate Audit Verdict', 'Unresolved Defect Register', 'Promotion Certificate'],
        stoppingConditions: 'Gate verdicts must be binary: Passed or Blocked.',
        autonomyLevel: 'Human-Gated'
    },
    {
        id: 'mission_memory_steward',
        name: 'Mission Memory Steward',
        domain: 'governance',
        purpose: 'Curate the persistent project knowledge graph, assign durable IDs, and prevent memory overwrite or drift.',
        instructions: 'Assign stable IDs (REQ-xxx, DEC-xxx). Archive superseded versions rather than silently editing history.',
        permittedTools: ['Knowledge Graph Linter', 'Durable ID Generator', 'Provenance Audit Tool'],
        evidenceRequirements: 'Bidirectional link validity and author provenance stamp.',
        deliverables: ['Knowledge Graph Status', 'Orphaned Node Report', 'Durable ID Index'],
        stoppingConditions: 'Zero broken links or unreferenced decisions in active project tree.',
        autonomyLevel: 'Autonomous'
    },
    {
        id: 'ethics_authority_reviewer',
        name: 'Ethics & Human Authority Reviewer',
        domain: 'governance',
        purpose: 'Enforce human decision boundaries around hazardous operations, safety-critical systems, and capital allocations.',
        instructions: 'Halt autonomous agent loops whenever safety-critical or non-reversible actions are requested.',
        permittedTools: ['Human Authorization Gate', 'Safety Boundary Monitor', 'Audit Ledger'],
        evidenceRequirements: 'Cryptographic or verified user session signature on human-gated decisions.',
        deliverables: ['Human Authority Log', 'Safety Boundary Certificate'],
        stoppingConditions: 'Human confirmation received or action aborted.',
        autonomyLevel: 'Human-Gated'
    },
    {
        id: 'consistency_auditor',
        name: 'Cross-Document Consistency Auditor',
        domain: 'governance',
        purpose: 'Detect contradictory numbers, divergent timelines, stale assumptions, and broken terminology across documents.',
        instructions: 'Compare SOW, WBS, Milestones, and Resource sheets to ensure total budget and dates reconcile to zero discrepancy.',
        permittedTools: ['Cross-Doc Delta Scanner', 'Terminology Reconciler', 'Numerical Reconciliation Tool'],
        evidenceRequirements: 'Exact line, paragraph, and character quote comparisons.',
        deliverables: ['Discrepancy Audit Log', 'Reconciliation Action Plan'],
        stoppingConditions: 'Zero unacknowledged numerical discrepancies between active baselines.',
        autonomyLevel: 'Autonomous'
    }
];

export const DEFAULT_HARNESS_TASKS: AgentHarnessTask[] = [
    {
        id: 'harn-001',
        name: 'Stage 1: Empirical Battery Chemistry & Thermal Dissipation Baseline',
        domain: 'science',
        assignedSpecialist: 'evidence_analyst',
        status: 'approved',
        inputs: ['Prior Art Dossier (Lit-2026)', 'Cell Calibrated Cycling Logs'],
        deliverables: ['Validated Thermal Derating Curve', 'Cell Internal Resistance Bounds'],
        acceptanceCriteria: ['Internal resistance modeled across -10C to +45C', '95% CI reported for thermal runaway threshold'],
        evidenceClass: 'Observed',
        budgetTokens: 15000,
        tokensUsed: 8420,
        humanSignOffRequired: false,
        humanApproved: true,
        runSteps: [
            { id: 'step-1', stage: 'planning', timestamp: '2026-09-28 09:12', agentName: 'Evidence Analyst', outputSummary: 'Ingested 12 cycling logs and isolated outlier run #4', status: 'success' },
            { id: 'step-2', stage: 'tool_use', timestamp: '2026-09-28 09:14', agentName: 'Evidence Analyst', toolUsed: 'Statistical Analyzer', outputSummary: 'Fit 2nd-order Arrhenius model to degradation rates (R^2 = 0.984)', status: 'success' },
            { id: 'step-3', stage: 'checking', timestamp: '2026-09-28 09:15', agentName: 'Evidence Analyst', outputSummary: 'Observed data confirms 4.2V peak charging limit with zero dendrite formation', status: 'success', evidenceClass: 'Observed' },
            { id: 'step-4', stage: 'approved', timestamp: '2026-09-28 09:16', agentName: 'Science Coordinator', outputSummary: 'Promoted baseline to Engineering Handoff Package', status: 'success' }
        ]
    },
    {
        id: 'harn-002',
        name: 'Stage 2: Power Regulation Architecture & Schematic Synchronization',
        domain: 'engineering',
        assignedSpecialist: 'electrical_designer',
        status: 'tool_use',
        inputs: ['Stage 1 Battery Baseline', 'ICD-004 Pinout Spec'],
        deliverables: ['Synchronized Schematic Rev 1.2', 'Component Thermal Derating Sheet'],
        acceptanceCriteria: ['Power rail ripple < 35mV under 4A transient load', 'All ref-des synced with active BOM'],
        evidenceClass: 'Calculated',
        budgetTokens: 25000,
        tokensUsed: 14200,
        humanSignOffRequired: true,
        feedbackLoopTarget: 'Send thermal margin query back to Science',
        runSteps: [
            { id: 'step-1', stage: 'planning', timestamp: '2026-09-29 10:00', agentName: 'Electrical Designer', outputSummary: 'Selected TI BQ25713 buck-boost charger topology', status: 'success' },
            { id: 'step-2', stage: 'tool_use', timestamp: '2026-09-29 10:15', agentName: 'Electrical Designer', toolUsed: 'Schematic Capture Linter', outputSummary: 'Matched 48 of 50 ref-des to active supplier catalog. Identified 2 long lead-time passives', status: 'warning', evidenceClass: 'Calculated' }
        ],
        notes: 'Awaiting BOM lead-time confirmation for inductors L1 and L2.'
    },
    {
        id: 'harn-003',
        name: 'Stage 3: Work Package Decomposition & Critical Path Scheduling',
        domain: 'project_management',
        assignedSpecialist: 'critical_path_scheduler',
        status: 'planning',
        inputs: ['Approved System Architecture', 'BOM Parts List Rev 1.2'],
        deliverables: ['12-Task Critical Path Gantt', 'Resource Allocation Histogram'],
        acceptanceCriteria: ['Zero unlinked predecessor/successor tasks', 'Project finish target within contracted milestone window'],
        evidenceClass: 'Calculated',
        budgetTokens: 20000,
        tokensUsed: 4200,
        humanSignOffRequired: false,
        runSteps: [
            { id: 'step-1', stage: 'planning', timestamp: '2026-09-30 08:30', agentName: 'Critical Path Scheduler', outputSummary: 'Synthesizing CPM network with 14 work packages and 3 milestone gates', status: 'success' }
        ]
    },
    {
        id: 'harn-004',
        name: 'Stage 4: Ground Truth Gatekeeper & Audit Verification',
        domain: 'governance',
        assignedSpecialist: 'ground_truth_gatekeeper',
        status: 'checking',
        inputs: ['Stage 1-3 Packages', 'Verification Matrix'],
        deliverables: ['Phase Promotion Verdict', 'Consistency Scorecard'],
        acceptanceCriteria: ['All P0 criteria backed by [Observed] or [Calculated] evidence', 'Zero unresolved consistency contradictions'],
        evidenceClass: 'Observed',
        budgetTokens: 10000,
        tokensUsed: 3100,
        humanSignOffRequired: true,
        runSteps: [
            { id: 'step-1', stage: 'planning', timestamp: '2026-09-30 11:00', agentName: 'Ground Truth Gatekeeper', outputSummary: 'Scanning project memory nodes for unverified assumptions', status: 'success' },
            { id: 'step-2', stage: 'checking', timestamp: '2026-09-30 11:20', agentName: 'Ground Truth Gatekeeper', toolUsed: 'Evidence Class Inspector', outputSummary: 'Verified 8 [Observed] items, flagged 2 [Assumption] items regarding supplier lead-time', status: 'warning', evidenceClass: 'Observed' }
        ]
    }
];

export const DEFAULT_MEMORY_NODES: MemoryNode[] = [
    {
        id: 'REQ-001',
        type: 'requirement',
        title: 'Nominal Battery Pack Output',
        content: 'System battery pack shall supply 14.8V nominal at up to 10A continuous discharge over -10C to +50C ambient operating envelope.',
        evidenceClass: 'Observed',
        status: 'approved',
        authorRole: 'Systems Architect',
        version: 'v2.1',
        updatedAt: '2026-09-27',
        links: [
            { targetId: 'DEC-001', linkType: 'derived_from' },
            { targetId: 'BOM-001', linkType: 'implements' },
            { targetId: 'TEST-001', linkType: 'verifies' }
        ],
        provenance: { sourceDocId: 'doc-sow', reviewedBy: 'Ground Truth Gatekeeper', reviewDate: '2026-09-28' }
    },
    {
        id: 'DEC-001',
        type: 'decision',
        title: 'Cell Chemistry Selection: 21700 NMC',
        content: 'Selected 21700 Nickel Manganese Cobalt (NMC) format over LFP to meet energy density threshold (240 Wh/kg) within enclosure volume constraints.',
        evidenceClass: 'Calculated',
        status: 'approved',
        authorRole: 'Systems Architect',
        version: 'v1.0',
        updatedAt: '2026-09-25',
        links: [
            { targetId: 'REQ-001', linkType: 'implements' },
            { targetId: 'EVID-001', linkType: 'derived_from' }
        ],
        provenance: { sourceDocId: 'doc-feasibility', reviewedBy: 'Chief Scientist', reviewDate: '2026-09-26' }
    },
    {
        id: 'EVID-001',
        type: 'evidence',
        title: 'Empirical Calorimetry Cycling Data',
        content: 'Accelerated thermal cycling of 21700 NMC cells revealed 0.42 W/cell max heat dissipation at 2C continuous discharge.',
        evidenceClass: 'Observed',
        status: 'approved',
        authorRole: 'Evidence Analyst',
        version: 'v1.0',
        updatedAt: '2026-09-24',
        links: [
            { targetId: 'DEC-001', linkType: 'verifies' }
        ],
        provenance: { experimentId: 'EXP-THERM-88', reviewedBy: 'Lead Physicist', reviewDate: '2026-09-25' }
    },
    {
        id: 'BOM-001',
        type: 'component',
        title: 'Main Power Management IC (PMIC)',
        content: 'Texas Instruments BQ25713 Buck-Boost Battery Charge Controller with SMBus/I2C Interface in QFN-32 footprint.',
        evidenceClass: 'Observed',
        status: 'approved',
        authorRole: 'Electrical Designer',
        version: 'v1.2',
        updatedAt: '2026-09-28',
        links: [
            { targetId: 'REQ-001', linkType: 'implements' },
            { targetId: 'WP-003', linkType: 'depends_on' }
        ],
        provenance: { sourceDocId: 'doc-schematic', reviewedBy: 'Component Engineer', reviewDate: '2026-09-29' }
    },
    {
        id: 'TEST-001',
        type: 'test',
        title: 'ATP-PWR-01: Full-Load Thermal Soak Verification',
        content: 'Run battery pack at 10A draw inside environmental chamber at 45C ambient for 120 minutes while logging 8 thermocouple probes.',
        evidenceClass: 'Calculated',
        status: 'draft',
        authorRole: 'Verification Engineer',
        version: 'v0.9',
        updatedAt: '2026-09-29',
        links: [
            { targetId: 'REQ-001', linkType: 'verifies' }
        ],
        provenance: { sourceDocId: 'doc-atp', reviewedBy: 'QA Lead' }
    },
    {
        id: 'WP-003',
        type: 'work_package',
        title: 'Power Stage PCB Layout & Thermal Relief Routing',
        content: 'Layout high-current traces (>40 mil width) with 2oz copper and thermal vias under PMIC and switching MOSFETs.',
        evidenceClass: 'Assumption',
        status: 'approved',
        authorRole: 'PCB Coordinator',
        version: 'v1.0',
        updatedAt: '2026-09-28',
        links: [
            { targetId: 'BOM-001', linkType: 'implements' }
        ],
        provenance: { sourceDocId: 'doc-wbs', reviewedBy: 'Lead EE', reviewDate: '2026-09-29' }
    }
];

export const DEFAULT_TOT_NODES: TreeOfThoughtsNode[] = [
    {
        id: 'tot-root',
        title: 'Project Architecture Strategy: High-Reliability Telemetry Subsystem',
        hypothesis: 'How to architect the telemetry telemetry link balancing latency, power draw, and component lead time?',
        pros: ['Defines core transmission architecture', 'Crucial for overall mission budget'],
        cons: ['Tradeoff between bandwidth and power footprint'],
        scores: { feasibility: 88, costEfficiency: 82, riskMitigation: 85, speedToMarket: 80, overallScore: 84 },
        status: 'explored',
        rationale: 'Root exploration node for communication architecture tradeoff.',
        alternativesConsidered: ['Option A: Dual-band Cellular + Satellite Failover', 'Option B: Dedicated LoRaWAN Mesh + Local Buffer', 'Option C: Custom 915MHz FHSS Direct Link']
    },
    {
        id: 'tot-node-1',
        parentId: 'tot-root',
        title: 'Branch A: Dual-Band Cellular LTE-M with Iridium Satellite Failover',
        hypothesis: 'Use off-the-shelf certified Quectel BG95 module paired with Iridium 9603 SBD transceiver for worldwide coverage.',
        pros: ['Global coverage without gateway infrastructure', 'Pre-certified FCC/CE module saves 8 weeks testing', 'Over-the-air firmware updates supported natively'],
        cons: ['Satellite monthly data subscription costs ($18/mo/unit)', 'Higher peak burst current during satellite packet transmission (1.2A)'],
        scores: { feasibility: 92, costEfficiency: 74, riskMitigation: 94, speedToMarket: 90, overallScore: 88 },
        status: 'selected',
        rationale: 'Selected path: drastically cuts development risk and guarantees remote telemetry even outside cellular coverage.',
        alternativesConsidered: ['Direct satellite only (too slow for telemetry)', 'Cellular only (fails in maritime/remote sectors)']
    },
    {
        id: 'tot-node-2',
        parentId: 'tot-root',
        title: 'Branch B: Dedicated 915MHz Frequency-Hopping Spread Spectrum (FHSS)',
        hypothesis: 'Build proprietary transceiver on TI CC1352P micro-controller operating in 902-928MHz ISM band.',
        pros: ['Zero recurring monthly subscription costs', 'Full control over packet framing and encryption', 'Low component BOM cost ($6.40 vs $42.00)'],
        cons: ['Requires dedicated base station within 8 km line-of-sight', 'Requires 12-week FCC Part 15 modular intentional radiator certification', 'Adds 3 weeks RF matching and antenna tuning'],
        scores: { feasibility: 68, costEfficiency: 86, riskMitigation: 52, speedToMarket: 60, overallScore: 66 },
        status: 'backtracked',
        rationale: 'Backtracked: FCC certification schedule delta (+12 weeks) violates master delivery milestone.',
        alternativesConsidered: ['Standard LoRa (too low throughput for telemetry streams)']
    },
    {
        id: 'tot-node-3',
        parentId: 'tot-node-1',
        title: 'Sub-branch A.1: Capacitor-Assisted Satellite Power Supply Rail',
        hypothesis: 'Add 2x 100mF supercapacitors in parallel with 3.3V rail to buffer 1.2A Iridium burst current and prevent voltage sag.',
        pros: ['Eliminates battery peak-current stress', 'Prevents system resets during weak solar charging conditions', 'Component cost is under $2.80'],
        cons: ['Requires 8 seconds pre-charge current-limiting circuit on boot'],
        scores: { feasibility: 95, costEfficiency: 90, riskMitigation: 92, speedToMarket: 88, overallScore: 92 },
        status: 'active',
        rationale: 'High confidence intermediate solution for satellite transmit power integrity.',
        alternativesConsidered: ['Larger primary battery (too heavy, fails weight budget)']
    }
];

export const DEFAULT_CHALLENGE_REVIEWS: ChallengePanelReview[] = [
    {
        id: 'chal-001',
        reviewerPersona: 'Skeptical Risk Officer',
        modelPerspective: 'Adversarial Risk Evaluation Engine',
        topic: 'Thermal Enclosure Dissipation in High-Ambient Desert Conditions (50C)',
        critiquePoints: [
            'Baseline calculation assumes natural convective cooling with 0.5 m/s ambient air velocity, which does not exist in stagnant direct sunlight.',
            'Internal PMIC junction temperature exceeds 105C when operating at 4A charging while solar radiation delivers 1000 W/m^2 solar load.',
            'No thermal cutoff hysteresis specified: risking continuous thermal oscillations.'
        ],
        identifiedBlindspots: [
            'Solar radiative absorption coefficient of black anodized chassis was omitted from thermal equation.',
            'Did not account for battery self-heating during simultaneous charge/discharge.'
        ],
        preservedDissent: 'Dissenting view retained: Aluminum chassis without thermal radiation shield will trip over-temperature shutdown in direct desert sunlight at noon.',
        recommendation: 'Proceed with Conditions',
        timestamp: '2026-09-29 14:22'
    },
    {
        id: 'chal-002',
        reviewerPersona: 'Ground-Truth Gatekeeper',
        modelPerspective: 'Heuristic Evidence Verification Protocol',
        topic: 'Supplier Lead-Time Assumptions on Critical Power ICs',
        critiquePoints: [
            'WBS task WP-003 lists a 3-week lead time for BQ25713RSNR based on distributor portal estimates.',
            'Historic supply chain data shows lead times spike to 18 weeks during Q4 automotive procurement cycles.'
        ],
        identifiedBlindspots: [
            'No secondary footprint-compatible second-source IC was designed onto PCB layout.'
        ],
        preservedDissent: 'Single-source dependency on TI QFN-32 package presents an unmitigated critical-path schedule vulnerability of up to 15 weeks.',
        recommendation: 'Proceed with Conditions',
        timestamp: '2026-09-30 09:15'
    },
    {
        id: 'chal-003',
        reviewerPersona: 'Value-of-Information Analyst',
        modelPerspective: 'Decision-Theoretic Sensitivity Model',
        topic: 'Prioritization of Thermal Vacuum Chamber Testing vs Mathematical Simulation',
        critiquePoints: [
            'Allocating $18,000 to full TVAC testing before thermal paste interface conductivity is empirically verified has poor return on investment.',
            'A $1,200 bench test of thermal interface material (TIM) reduces 70% of the variance at 1/15th the cost.'
        ],
        identifiedBlindspots: [
            'Assumption of TIM contact resistance accounts for 82% of model uncertainty.'
        ],
        preservedDissent: 'Do not book TVAC facility until bench TIM conductivity is measured.',
        recommendation: 'Re-evaluate Baseline',
        timestamp: '2026-09-30 10:45'
    }
];

export const DEFAULT_TRADE_STUDIES: DesignTradeStudy[] = [
    {
        id: 'trade-001',
        title: 'Microcontroller & Core Compute Architecture',
        description: 'Selection of primary embedded compute platform for real-time control, sensor telemetry, and secure communications.',
        criteria: [
            { name: 'Processing & DSP Power', weight: 0.25 },
            { name: 'Active & Sleep Power Draw', weight: 0.25 },
            { name: 'Ecosystem & Tooling Maturity', weight: 0.20 },
            { name: 'Unit BOM Cost @ 1k', weight: 0.15 },
            { name: 'Multi-source Availability', weight: 0.15 }
        ],
        options: [
            {
                name: 'STM32H7 Dual-Core (Cortex-M7 + M4)',
                scores: { 'Processing & DSP Power': 9.5, 'Active & Sleep Power Draw': 6.0, 'Ecosystem & Tooling Maturity': 9.0, 'Unit BOM Cost @ 1k': 6.5, 'Multi-source Availability': 7.5 },
                weightedTotal: 7.85,
                notes: 'Maximum computational capability; higher sleep current consumption.'
            },
            {
                name: 'Nordic nRF5340 (Dual Cortex-M33 + BLE)',
                scores: { 'Processing & DSP Power': 7.5, 'Active & Sleep Power Draw': 9.5, 'Ecosystem & Tooling Maturity': 8.5, 'Unit BOM Cost @ 1k': 8.0, 'Multi-source Availability': 7.0 },
                weightedTotal: 8.20,
                notes: 'Winning candidate: exceptional energy efficiency, integrated BLE 5.3 radio, strong Zephyr RTOS support.'
            },
            {
                name: 'ESP32-S3 (Dual Xtensa LX7 + WiFi/BLE)',
                scores: { 'Processing & DSP Power': 8.0, 'Active & Sleep Power Draw': 5.5, 'Ecosystem & Tooling Maturity': 7.5, 'Unit BOM Cost @ 1k': 9.5, 'Multi-source Availability': 8.0 },
                weightedTotal: 7.50,
                notes: 'Lowest unit cost; higher standby power draw and lower ADC linearity.'
            }
        ],
        selectedOption: 'Nordic nRF5340 (Dual Cortex-M33 + BLE)',
        status: 'approved'
    }
];

export const DEFAULT_BOM_ITEMS: SchematicPartItem[] = [
    { refDes: 'U1', mpn: 'nRF5340-QKAA-R', value: 'Dual Cortex-M33', footprint: 'QFN-94 7x7mm', rating: '3.6V max, 128MHz', bomStatus: 'Matched', unitCost: 4.85, leadTimeWeeks: 6, quantity: 1, syncedWorkPackageId: 'WP-003' },
    { refDes: 'U2', mpn: 'BQ25713RSNR', value: 'Buck-Boost Charger', footprint: 'WQFN-32 4x4mm', rating: '24V in, 4A charge', bomStatus: 'Lead-Time-Risk', unitCost: 3.40, leadTimeWeeks: 18, quantity: 1, syncedWorkPackageId: 'WP-003' },
    { refDes: 'U3', mpn: 'TPS62840DLCR', value: 'Ultra-low Iq Buck', footprint: 'WSON-8 2x2mm', rating: '60nA Iq, 750mA out', bomStatus: 'Matched', unitCost: 0.95, leadTimeWeeks: 4, quantity: 1, syncedWorkPackageId: 'WP-003' },
    { refDes: 'L1', mpn: 'XFL4020-222MEC', value: '2.2uH Shielded', footprint: '4.0x4.0mm', rating: '5.5A Irms, 21mOhm', bomStatus: 'Matched', unitCost: 0.82, leadTimeWeeks: 4, quantity: 1 },
    { refDes: 'C1..C6', mpn: 'GRM188R61A226ME15D', value: '22uF 10V X5R', footprint: '0603 (1608 Metric)', rating: '10V, +/-20%', bomStatus: 'Matched', unitCost: 0.08, leadTimeWeeks: 2, quantity: 6 },
    { refDes: 'CONN1', mpn: '105450-0101', value: 'USB Type-C 16-Pin', footprint: 'SMD + Thru-Hole Tabs', rating: '20V, 5A rated', bomStatus: 'Matched', unitCost: 0.65, leadTimeWeeks: 3, quantity: 1 }
];

export const DEFAULT_ASSEMBLY_PACKAGES: MechanicalAssemblyPackage[] = [
    {
        assemblyId: 'ASM-001',
        name: 'Weatherproof Telemetry Enclosure Main Stack',
        solidModelRef: 'CAD-ASM-ENC-V2.step',
        drawingNumber: 'DWG-MIFECO-2026-001',
        partsCount: 14,
        tolerancesVerified: true,
        stlExportStatus: 'valid',
        explodedViewAvailable: true,
        linkedTaskId: 'task-mech-01'
    },
    {
        assemblyId: 'ASM-002',
        name: 'Battery Cradle & Thermal Clamping Mechanism',
        solidModelRef: 'CAD-ASM-BATT-V1.step',
        drawingNumber: 'DWG-MIFECO-2026-002',
        partsCount: 6,
        tolerancesVerified: true,
        stlExportStatus: 'valid',
        explodedViewAvailable: true,
        linkedTaskId: 'task-mech-02'
    }
];

export const DEFAULT_OUTLINE_DOCUMENTS: OutlineDrivenDocument[] = [
    {
        id: 'doc-arch-spec',
        docTitle: 'Technical Baseline Architecture Specification',
        scope: 'Comprehensive systems engineering description linking requirements to hardware, firmware, and test definitions.',
        tocApproved: true,
        chapters: [
            {
                chapterNumber: 1,
                title: 'System Mission Scope & Operational Context',
                description: 'Operational environment boundaries, temperature ranges, and mission success criteria.',
                status: 'approved',
                content: 'The MIFECO Telemetry System operates across an extended thermal window (-10C to +50C). It provides continuous sensor aggregation with satellite failover.',
                retrievedMemoryNodeIds: ['REQ-001', 'DEC-001'],
                crossReferences: ['SOW Section 2.1', 'ICD-004']
            },
            {
                chapterNumber: 2,
                title: 'Power Distribution & Battery Architecture',
                description: 'Detailed schematic design, power budget roll-up, and cell degradation mitigation.',
                status: 'reconciled',
                content: 'Power is routed through a dual-rail BQ25713 controller. Cell balancing maintains delta-V under 15mV per bank.',
                retrievedMemoryNodeIds: ['REQ-001', 'BOM-001', 'EVID-001'],
                crossReferences: ['Schematic Sheet 2', 'ATP-PWR-01']
            },
            {
                chapterNumber: 3,
                title: 'Firmware Telemetry & Sensor Acquisition Loop',
                description: 'FreeRTOS/Zephyr task partitioning, DMA sensor sampling, and power-gated peripherals.',
                status: 'draft',
                content: 'The compute architecture partitions sensor sampling onto Core 1 while Core 0 handles BLE/Cellular communications.',
                retrievedMemoryNodeIds: ['DEC-001'],
                crossReferences: ['Firmware ICD Rev 1.0']
            }
        ]
    }
];

export const DEFAULT_GROUND_TRUTH_GATES: GroundTruthGate[] = [
    {
        phase: 2,
        phaseName: 'Feasibility & SWOT Gate',
        status: 'passed',
        signedOffBy: 'Ground Truth Gatekeeper',
        signOffDate: '2026-09-26',
        criteria: [
            { id: 'crit-1', description: 'Thermal dissipation model validated by empirical measurement or simulation', evidenceRequired: 'Calibrated calorimetry cycling log', evidenceClassExpected: 'Observed', satisfied: true, verifiedByRole: 'Evidence Analyst' },
            { id: 'crit-2', description: 'Component lead-times confirmed under 12 weeks for all active path ICs', evidenceRequired: 'Distributor API inventory confirmation', evidenceClassExpected: 'Observed', satisfied: true, verifiedByRole: 'Component Engineer' }
        ]
    },
    {
        phase: 5,
        phaseName: 'Engineering Baseline to WBS Gate',
        status: 'review_in_progress',
        criteria: [
            { id: 'crit-3', description: 'All schematic reference designators mapped to purchased MPNs in BOM', evidenceRequired: 'Synchronized schematic-parts table', evidenceClassExpected: 'Observed', satisfied: true, verifiedByRole: 'Electrical Designer' },
            { id: 'crit-4', description: 'Clearance tolerances confirmed with 3D assembly interference check', evidenceRequired: '3D CAD assembly report with 0 collisions', evidenceClassExpected: 'Calculated', satisfied: true, verifiedByRole: 'Mechanical 3D Specialist' },
            { id: 'crit-5', description: 'Independent review challenge completed with preserved dissent logged', evidenceRequired: 'Challenge panel review dossier', evidenceClassExpected: 'Observed', satisfied: false, notes: 'Awaiting Skeptical Risk Officer sign-off on desert thermal margins' }
        ]
    }
];

export const DEFAULT_VOI_ITEMS: ValueInformationItem[] = [
    {
        id: 'voi-001',
        uncertaintyQuestion: 'What is the actual thermal conductivity of the chosen TIM under 50 psi mechanical clamping pressure?',
        currentBelief: 'Believed to be 3.5 W/m-K from datasheet, but interface contact resistance is unmeasured.',
        potentialImpactOnDecisions: 'High',
        proposedTestOrStudy: 'Benchtop ASTM D5470 thermal impedance test on 3 sample coupons',
        costToInvestigateHours: 12,
        expectedReductionInUncertaintyScore: 88,
        rankPriority: 1
    },
    {
        id: 'voi-002',
        uncertaintyQuestion: 'Will satellite transceiver packet success rate drop below 90% during severe dust storms?',
        currentBelief: 'Link margin is calculated at 6.2 dB, which should tolerate typical atmospheric attenuation.',
        potentialImpactOnDecisions: 'Medium',
        proposedTestOrStudy: 'RF chamber attenuation simulation with particulate scattering filter',
        costToInvestigateHours: 20,
        expectedReductionInUncertaintyScore: 65,
        rankPriority: 2
    },
    {
        id: 'voi-003',
        uncertaintyQuestion: 'Can the secondary buck converter footprint accommodate an alternate vendor without PCB re-spin?',
        currentBelief: 'Pinout matches TI, MPS, and Analog Devices pinout with minor passive changes.',
        potentialImpactOnDecisions: 'Medium',
        proposedTestOrStudy: 'Dual-footprint CAD overlay and solderability study',
        costToInvestigateHours: 6,
        expectedReductionInUncertaintyScore: 78,
        rankPriority: 3
    }
];

export const DEFAULT_CONSISTENCY_ISSUES: ConsistencyIssue[] = [
    {
        id: 'con-001',
        severity: 'warning',
        category: 'conflicting_numbers',
        title: 'Battery Operating Temperature Discrepancy',
        sourceA: { docTitle: 'Statement of Work (SOW)', snippet: 'Operating range: -20C to +55C', value: '-20C to +55C' },
        sourceB: { docTitle: 'Engineering Baseline Spec', snippet: 'Operating range: -10C to +50C', value: '-10C to +50C' },
        description: 'SOW specifies wider low-temperature boundary (-20C) than validated engineering component rating (-10C).',
        reconciliationSuggestion: 'Add internal heating element or formally amend SOW Section 2.1 to -10C.',
        resolved: false
    },
    {
        id: 'con-002',
        severity: 'info',
        category: 'stale_assumption',
        title: 'Lead-Time Estimate Exceeded Verification Horizon',
        sourceA: { docTitle: 'BOM Parts List', snippet: 'U2 BQ25713 lead time estimated at 6 weeks', value: '6 weeks' },
        sourceB: { docTitle: 'Distributor Live Stock Feed', snippet: 'Current factory lead time is 18 weeks', value: '18 weeks' },
        description: 'Component lead time in planning baseline has aged 30+ days and diverges from live supplier lead times.',
        reconciliationSuggestion: 'Authorize advance procurement order or second-source qualification.',
        resolved: false
    }
];
