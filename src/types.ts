export interface User {
    id: string;
    username: string;
    email: string;
    password?: string;
    geminiKey?: string;
    plan?: 'free' | 'business' | 'enterprise' | 'studio_test';
    stripeCustomerId?: string;
    notificationPrefs?: {

        teams: boolean;
        slack: boolean;
        outlook: boolean;
        gmail: boolean;
        teamsWebhook?: string;
        slackWebhook?: string;
    };
}

export interface TeamMember {
    userId: string;
    role: string;
    name: string;
    email: string;
    isLeader?: boolean;
}

export interface Comment {
    id:string;
    authorId: string;
    authorName: string;
    timestamp: string;
    text: string;
}

export interface Attachment {
    id: string;
    uploaderId: string;
    uploaderName: string;
    timestamp: string;
    fileName: string;
    fileData: string; // base64
    fileType: string;
}

export interface Document {
    id: string;
    title: string;
    version: string;
    status: 'Working' | 'Approved' | 'Rejected' | 'Failed';
    owner: string;
    phase: number;
    sequence: number;
    type?: 'text' | 'image';
    parentDocId?: string; // Links an artifact to its source document
    metadata?: any;
}

export type RACIRole = 'R' | 'A' | 'C' | 'I';

export interface RACIAssignment {
    responsible?: string;
    accountable?: string;
    consulted?: string[];
    informed?: string[];
}

export interface RACIActivityItem {
    id: string;
    phase: 'Initiation Phase' | 'Planning Phase' | 'Execution Phase' | 'Monitoring & Control Phase' | 'Closure Phase';
    activity: string;
    assignments: Record<string, RACIRole | undefined>;
}

export interface Task {
    id: string;
    name: string;
    description?: string;
    role: string | null;
    startDate: string;
    endDate: string;
    sprintId: string;
    status: 'todo' | 'inprogress' | 'review' | 'done';
    isSubcontracted: boolean;
    dependsOn: string[];
    actualTime: number | null;
    actualCost: number | null;
    actualEndDate: string | null;
    comments: Comment[];
    attachments: Attachment[];
    useAgent?: boolean;
    agentOutput?: string;
    raciAssignments?: RACIAssignment;
    recurrence?: {
        interval: 'none' | 'daily' | 'weekly' | 'monthly';
    };
}

export interface Notification {
    id: string;
    timestamp: string;
    recipientId: string;
    text: string;
    read: boolean;
    taskId: string;
}

export interface Milestone {
    id: string;
    name: string;
    plannedDate: string;
    actualDate?: string | null;
    status: 'Planned' | 'Completed' | 'todo' | 'inprogress' | 'review' | 'done';
}

export interface Sprint {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
}

export interface Resource {
    id: string;
    name: string;
    type: 'human' | 'physical';
    role?: string; // For human resources
    unitCost: number; // Hourly rate or purchase price
    quantity: number; // Hours or count
    totalCost: number;
    estimate?: number; // Deprecated, kept for compatibility
    actual?: number; // Deprecated, kept for compatibility
}

export interface PhaseBlocker {
    id: string;
    description: string;
    severity?: 'critical' | 'high' | 'medium';
    status: 'active' | 'user_mitigated' | 'auto_resolved';
    detectedAt?: string;
    mitigatedAt?: string;
    resolutionNotes?: string;
}

export interface Project {
    id: string;
    name: string;
    discipline: string;
    mode: 'fullscale' | 'minimal';
    scope: 'internal' | 'subcontracted';
    teamSize: 'small' | 'medium' | 'large';
    complexity: 'easy' | 'typical' | 'complex';
    ownerId: string;
    team: TeamMember[];
    documents: Document[];
    tasks: Task[];
    sprints: Sprint[];
    milestones: Milestone[];
    resources: Resource[];
    avgBurdenedLaborRate: number;
    budget: number;
    startDate: string;
    endDate: string;
    changeRequest: any;
    scenarios: any[];
    phasesData: Record<string, {
        content: string;
        compactedContent?: string;
        attachments?: any[];
        images?: string[]; // Array of base64 data URLs
        selectedArtifacts?: string[];
        blockers?: PhaseBlocker[];
    }>;
    generationMode: 'manual' | 'automatic';
    isPlanSelected?: boolean;
    notifications: Notification[];
    isStarted?: boolean;

    // Advanced Agentic & Harness Systems
    harnessTasks?: AgentHarnessTask[];
    memoryNodes?: MemoryNode[];
    totNodes?: TreeOfThoughtsNode[];
    challengeReviews?: ChallengePanelReview[];
    tradeStudies?: DesignTradeStudy[];
    bomItems?: SchematicPartItem[];
    assemblyPackages?: MechanicalAssemblyPackage[];
    outlineDocuments?: OutlineDrivenDocument[];
    groundTruthGates?: GroundTruthGate[];
    voiItems?: ValueInformationItem[];
    consistencyIssues?: ConsistencyIssue[];
    raciMatrix?: RACIActivityItem[];
}

// -------------------------------------------------------------
// Agentic Workflows & Specialized Harnesses
// -------------------------------------------------------------
export type HarnessDomain = 'science' | 'engineering' | 'project_management' | 'governance';

export type SpecialistRoleId = 
    | 'literature_researcher'
    | 'evidence_analyst'
    | 'hypothesis_specialist'
    | 'experiment_designer'
    | 'electrical_designer'
    | 'mechanical_3d_specialist'
    | 'systems_architect'
    | 'verification_engineer'
    | 'pcb_layout_coordinator'
    | 'wbs_planner'
    | 'critical_path_scheduler'
    | 'cost_resource_planner'
    | 'risk_change_manager'
    | 'ground_truth_gatekeeper'
    | 'mission_memory_steward'
    | 'ethics_authority_reviewer'
    | 'consistency_auditor';

export interface SpecialistRoleDef {
    id: SpecialistRoleId;
    name: string;
    domain: HarnessDomain;
    purpose: string;
    instructions: string;
    permittedTools: string[];
    evidenceRequirements: string;
    deliverables: string[];
    stoppingConditions: string;
    autonomyLevel: 'Autonomous' | 'Semi-Autonomous' | 'Human-Gated';
}

export type HarnessTaskStage = 'planning' | 'tool_use' | 'execution' | 'checking' | 'revision' | 'approved' | 'blocked';
export type EvidenceClass = 'Observed' | 'Calculated' | 'Assumption' | 'Unknown';

export interface HarnessRunStep {
    id: string;
    stage: HarnessTaskStage;
    timestamp: string;
    agentName: string;
    toolUsed?: string;
    outputSummary: string;
    status: 'success' | 'warning' | 'needs_revision' | 'blocked';
    evidenceClass?: EvidenceClass;
}

export interface AgentHarnessTask {
    id: string;
    name: string;
    domain: HarnessDomain;
    assignedSpecialist: SpecialistRoleId;
    status: HarnessTaskStage;
    inputs: string[];
    deliverables: string[];
    acceptanceCriteria: string[];
    evidenceClass: EvidenceClass;
    budgetTokens: number;
    tokensUsed: number;
    humanSignOffRequired: boolean;
    humanApproved?: boolean;
    feedbackLoopTarget?: string; // e.g. "Reopen Assumption in Science"
    runSteps: HarnessRunStep[];
    notes?: string;
}

// -------------------------------------------------------------
// Wiki Memory, Graph Relationships & Consistency
// -------------------------------------------------------------
export type MemoryNodeType = 'requirement' | 'decision' | 'claim' | 'test' | 'drawing' | 'component' | 'work_package' | 'lesson' | 'evidence';
export type MemoryLinkType = 'derived_from' | 'verifies' | 'implements' | 'depends_on' | 'supersedes' | 'conflicts_with';

export interface MemoryNodeLink {
    targetId: string;
    linkType: MemoryLinkType;
    label?: string;
}

export interface MemoryNode {
    id: string; // e.g. REQ-001, DEC-004, TEST-012, BOM-003, WP-010
    type: MemoryNodeType;
    title: string;
    content: string;
    evidenceClass: EvidenceClass;
    status: 'draft' | 'approved' | 'deprecated' | 'superseded';
    authorRole: string;
    version: string;
    updatedAt: string;
    links: MemoryNodeLink[];
    provenance: {
        sourceDocId?: string;
        experimentId?: string;
        reviewedBy?: string;
        reviewDate?: string;
    };
}

export interface ConsistencyIssue {
    id: string;
    severity: 'error' | 'warning' | 'info';
    category: 'conflicting_numbers' | 'stale_assumption' | 'broken_reference' | 'missing_evidence' | 'unbalanced_budget';
    title: string;
    sourceA: { docTitle: string; snippet: string; value: string };
    sourceB: { docTitle: string; snippet: string; value: string };
    description: string;
    reconciliationSuggestion: string;
    resolved: boolean;
}

// -------------------------------------------------------------
// Structured Reasoning, Tree of Thoughts & Virtual Challenges
// -------------------------------------------------------------
export interface TreeOfThoughtsNode {
    id: string;
    parentId?: string;
    title: string;
    hypothesis: string;
    pros: string[];
    cons: string[];
    scores: {
        feasibility: number; // 1-100
        costEfficiency: number; // 1-100
        riskMitigation: number; // 1-100
        speedToMarket: number; // 1-100
        overallScore: number; // 1-100
    };
    status: 'active' | 'explored' | 'selected' | 'backtracked' | 'rejected';
    rationale: string;
    alternativesConsidered: string[];
}

export interface ChallengePanelReview {
    id: string;
    reviewerPersona: 'Skeptical Risk Officer' | 'Systems Architect' | 'Ground-Truth Gatekeeper' | 'Value-of-Information Analyst';
    modelPerspective: string; // e.g. "Gemini Flash - Adversarial Mode", "Heuristic Safety Rule Engine"
    topic: string;
    critiquePoints: string[];
    identifiedBlindspots: string[];
    preservedDissent: string; // Unresolved objection retained for governance
    recommendation: 'Proceed' | 'Proceed with Conditions' | 'Re-evaluate Baseline' | 'Reject';
    timestamp: string;
}

export interface DesignTradeStudy {
    id: string;
    title: string;
    description: string;
    criteria: Array<{ name: string; weight: number }>; // weight sum = 1.0
    options: Array<{
        name: string;
        scores: Record<string, number>; // criteriaName -> 1-10
        weightedTotal: number;
        notes: string;
    }>;
    selectedOption?: string;
    status: 'evaluating' | 'approved' | 'rejected';
}

// -------------------------------------------------------------
// Engineering-to-Project Chains & Paired Deliverables
// -------------------------------------------------------------
export interface SchematicPartItem {
    refDes: string; // e.g. R1, U2, CONN-1, SENS-04
    mpn: string; // Manufacturer Part Number
    value: string;
    footprint: string;
    rating: string;
    bomStatus: 'Matched' | 'Unmatched' | 'Obsolete' | 'Lead-Time-Risk';
    unitCost: number;
    leadTimeWeeks: number;
    quantity: number;
    syncedWorkPackageId?: string;
}

export interface MechanicalAssemblyPackage {
    assemblyId: string;
    name: string;
    solidModelRef: string;
    drawingNumber: string;
    partsCount: number;
    tolerancesVerified: boolean;
    stlExportStatus: 'valid' | 'pending' | 'inspection_required';
    explodedViewAvailable: boolean;
    linkedTaskId?: string;
}

export interface OutlineChapter {
    chapterNumber: number;
    title: string;
    description: string;
    status: 'draft' | 'approved' | 'reconciled';
    content: string;
    retrievedMemoryNodeIds: string[];
    crossReferences: string[];
}

export interface OutlineDrivenDocument {
    id: string;
    docTitle: string;
    scope: string;
    tocApproved: boolean;
    chapters: OutlineChapter[];
}

// -------------------------------------------------------------
// Governance: Ground-Truth Gates & Value-of-Information (VoI)
// -------------------------------------------------------------
export interface GroundTruthCriterion {
    id: string;
    description: string;
    evidenceRequired: string;
    evidenceClassExpected: 'Observed' | 'Calculated';
    satisfied: boolean;
    verifiedByRole?: string;
    notes?: string;
}

export interface GroundTruthGate {
    phase: number;
    phaseName: string;
    status: 'locked' | 'review_in_progress' | 'passed' | 'blocked_insufficient_evidence';
    criteria: GroundTruthCriterion[];
    signedOffBy?: string;
    signOffDate?: string;
}

export interface ValueInformationItem {
    id: string;
    uncertaintyQuestion: string;
    currentBelief: string;
    potentialImpactOnDecisions: 'High' | 'Medium' | 'Low';
    proposedTestOrStudy: string;
    costToInvestigateHours: number;
    expectedReductionInUncertaintyScore: number; // 1-100
    rankPriority: number;
}

export type LlmProviderId = 'google' | 'openai' | 'anthropic' | 'grok' | 'ollama' | 'openrouter';
export type AuthMode = 'api_key' | 'oauth';

export interface ModelOption {
    id: string;
    name: string;
    description: string;
    recommended?: boolean;
    tag?: string;
}

export interface ProviderConfig {
    provider: LlmProviderId;
    authMode: AuthMode;
    apiKey?: string;
    baseUrl?: string; // for Ollama / custom gateway
    model: string;
    isCustomModel?: boolean;
    oauthConnected?: boolean;
    oauthAccountEmail?: string;
    oauthPlanName?: string;
    oauthExpiresAt?: number;
    testedSuccessfully?: boolean;
    lastTestedAt?: string;
}

export interface LlmGlobalSettings {
    activeProvider: LlmProviderId;
    configs: Record<LlmProviderId, ProviderConfig>;
}

