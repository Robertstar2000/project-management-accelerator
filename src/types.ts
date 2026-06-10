export interface User {
    id: string;
    username: string;
    email: string;
    password?: string;
    geminiKey?: string;
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
    }>;
    generationMode: 'manual' | 'automatic';
    notifications: Notification[];
    isStarted?: boolean;
}
