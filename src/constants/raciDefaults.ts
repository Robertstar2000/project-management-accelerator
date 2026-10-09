import { RACIRole, RACIAssignment, RACIActivityItem, Task, Project, Resource } from '../types';

export interface RACIRoleMeta {
    id: string;
    title: string;
    description: string;
    icon: string;
    color: string;
    badgeBg: string;
}

export const RACI_LEGEND = {
    R: {
        code: 'R',
        name: 'Responsible',
        description: 'Performs the work / primary executor of the deliverable',
        badgeColor: '#1d4ed8', // Deep blue
        textColor: '#ffffff',
        border: 'rgba(29, 78, 216, 0.6)'
    },
    A: {
        code: 'A',
        name: 'Accountable',
        description: 'Owns the outcome / final decision maker / approves completion',
        badgeColor: '#0f172a', // Navy / Dark slate
        textColor: '#38bdf8',
        border: 'rgba(56, 189, 248, 0.6)'
    },
    C: {
        code: 'C',
        name: 'Consulted',
        description: 'Provides two-way input and subject-matter expertise',
        badgeColor: '#0284c7', // Sky / Medium blue
        textColor: '#ffffff',
        border: 'rgba(2, 132, 199, 0.6)'
    },
    I: {
        code: 'I',
        name: 'Informed',
        description: 'Kept up to date on progress and milestone status',
        badgeColor: '#06b6d4', // Cyan / Light blue
        textColor: '#ffffff',
        border: 'rgba(6, 182, 212, 0.6)'
    }
} as const;

export const STANDARD_RACI_ROLES: RACIRoleMeta[] = [
    {
        id: 'executive_sponsor',
        title: 'Executive Sponsor',
        description: 'Executive authority, project charter sponsor, and business case owner',
        icon: '👤',
        color: '#a855f7',
        badgeBg: 'rgba(168, 85, 247, 0.15)'
    },
    {
        id: 'project_manager',
        title: 'Project Manager',
        description: 'Overall project driver, coordination lead, scope and deliverable executor',
        icon: '👨‍💼',
        color: '#00f2ff',
        badgeBg: 'rgba(0, 242, 255, 0.15)'
    },
    {
        id: 'steering_committee',
        title: 'Steering Committee',
        description: 'Governance board, charter approver, scope arbiter, and senior oversight',
        icon: '👥',
        color: '#f59e0b',
        badgeBg: 'rgba(245, 158, 11, 0.15)'
    },
    {
        id: 'business_analyst',
        title: 'Business Analyst',
        description: 'Requirements synthesis, design reviews, feasibility, and user training',
        icon: '🔍',
        color: '#ec4899',
        badgeBg: 'rgba(236, 72, 153, 0.15)'
    },
    {
        id: 'technical_lead',
        title: 'Technical Lead',
        description: 'Architecture authority, technical schedule driver, and deployment leader',
        icon: '⚙️',
        color: '#10b981',
        badgeBg: 'rgba(16, 185, 129, 0.15)'
    },
    {
        id: 'developer',
        title: 'Developer',
        description: 'Solution implementation, core engineering build, unit testing & test runner',
        icon: '💻',
        color: '#3b82f6',
        badgeBg: 'rgba(59, 130, 246, 0.15)'
    },
    {
        id: 'qa_lead',
        title: 'QA Lead',
        description: 'Quality assurance criteria owner, test plan governance, and defect authority',
        icon: '🛡️',
        color: '#14b8a6',
        badgeBg: 'rgba(20, 184, 166, 0.15)'
    },
    {
        id: 'pmo',
        title: 'PMO',
        description: 'Program office tracking, risk & issue management, change control, and reporting',
        icon: '📋',
        color: '#eab308',
        badgeBg: 'rgba(234, 179, 8, 0.15)'
    },
    {
        id: 'operations_lead',
        title: 'Operations Lead',
        description: 'Production infrastructure owner, operational readiness, and rollout coordinator',
        icon: '🏭',
        color: '#f97316',
        badgeBg: 'rgba(249, 115, 22, 0.15)'
    },
    {
        id: 'customer_representative',
        title: 'Customer Representative',
        description: 'Stakeholder sign-off, user acceptance testing authority, and feedback provider',
        icon: '🤝',
        color: '#8b5cf6',
        badgeBg: 'rgba(139, 92, 246, 0.15)'
    }
];

export const DEFAULT_RACI_ACTIVITIES: RACIActivityItem[] = [
    // -------------------------------------------------------------
    // Phase 1: Initiation Phase
    // -------------------------------------------------------------
    {
        id: 'raci-init-1',
        phase: 'Initiation Phase',
        activity: 'Submit Project Request',
        assignments: {
            'Executive Sponsor': 'I',
            'Project Manager': 'R',
            'Steering Committee': 'A',
            'Business Analyst': 'C',
            'Technical Lead': 'I',
            'Developer': 'I',
            'QA Lead': 'I',
            'PMO': 'C',
            'Operations Lead': 'I',
            'Customer Representative': 'C'
        }
    },
    {
        id: 'raci-init-2',
        phase: 'Initiation Phase',
        activity: 'Review and Approve Project Charter',
        assignments: {
            'Executive Sponsor': 'A',
            'Project Manager': 'R',
            'Steering Committee': 'C',
            'Business Analyst': 'C',
            'Technical Lead': 'I',
            'Developer': 'I',
            'QA Lead': 'I',
            'PMO': 'C',
            'Operations Lead': 'I',
            'Customer Representative': 'C'
        }
    },
    {
        id: 'raci-init-3',
        phase: 'Initiation Phase',
        activity: 'Identify Stakeholders',
        assignments: {
            'Executive Sponsor': 'C',
            'Project Manager': 'R',
            'Steering Committee': 'C',
            'Business Analyst': 'A',
            'Technical Lead': 'I',
            'Developer': 'I',
            'QA Lead': 'I',
            'PMO': 'C',
            'Operations Lead': 'C',
            'Customer Representative': 'C'
        }
    },
    {
        id: 'raci-init-4',
        phase: 'Initiation Phase',
        activity: 'Conduct Initial Feasibility Study',
        assignments: {
            'Executive Sponsor': 'C',
            'Project Manager': 'R',
            'Steering Committee': 'C',
            'Business Analyst': 'A',
            'Technical Lead': 'C',
            'Developer': 'I',
            'QA Lead': 'I',
            'PMO': 'C',
            'Operations Lead': 'C',
            'Customer Representative': 'I'
        }
    },

    // -------------------------------------------------------------
    // Phase 2: Planning Phase
    // -------------------------------------------------------------
    {
        id: 'raci-plan-5',
        phase: 'Planning Phase',
        activity: 'Develop Business Case',
        assignments: {
            'Executive Sponsor': 'A',
            'Project Manager': 'R',
            'Steering Committee': 'C',
            'Business Analyst': 'C',
            'Technical Lead': 'C',
            'Developer': 'I',
            'QA Lead': 'I',
            'PMO': 'C',
            'Operations Lead': 'I',
            'Customer Representative': 'C'
        }
    },
    {
        id: 'raci-plan-6',
        phase: 'Planning Phase',
        activity: 'Define Project Scope',
        assignments: {
            'Executive Sponsor': 'C',
            'Project Manager': 'R',
            'Steering Committee': 'A',
            'Business Analyst': 'C',
            'Technical Lead': 'C',
            'Developer': 'I',
            'QA Lead': 'I',
            'PMO': 'C',
            'Operations Lead': 'C',
            'Customer Representative': 'C'
        }
    },
    {
        id: 'raci-plan-7',
        phase: 'Planning Phase',
        activity: 'Gather and Analyze Requirements',
        assignments: {
            'Executive Sponsor': 'I',
            'Project Manager': 'R',
            'Steering Committee': 'C',
            'Business Analyst': 'A',
            'Technical Lead': 'C',
            'Developer': 'C',
            'QA Lead': 'C',
            'PMO': 'C',
            'Operations Lead': 'I',
            'Customer Representative': 'C'
        }
    },
    {
        id: 'raci-plan-8',
        phase: 'Planning Phase',
        activity: 'Develop Project Schedule',
        assignments: {
            'Executive Sponsor': 'C',
            'Project Manager': 'A',
            'Steering Committee': 'C',
            'Business Analyst': 'C',
            'Technical Lead': 'R',
            'Developer': 'C',
            'QA Lead': 'I',
            'PMO': 'C',
            'Operations Lead': 'I',
            'Customer Representative': 'I'
        }
    },
    {
        id: 'raci-plan-9',
        phase: 'Planning Phase',
        activity: 'Plan Resource Allocation',
        assignments: {
            'Executive Sponsor': 'C',
            'Project Manager': 'A',
            'Steering Committee': 'C',
            'Business Analyst': 'C',
            'Technical Lead': 'C',
            'Developer': 'R',
            'QA Lead': 'I',
            'PMO': 'C',
            'Operations Lead': 'C',
            'Customer Representative': 'I'
        }
    },

    // -------------------------------------------------------------
    // Phase 3: Execution Phase
    // -------------------------------------------------------------
    {
        id: 'raci-exec-10',
        phase: 'Execution Phase',
        activity: 'Conduct Design Review',
        assignments: {
            'Executive Sponsor': 'C',
            'Project Manager': 'A',
            'Steering Committee': 'C',
            'Business Analyst': 'R',
            'Technical Lead': 'C',
            'Developer': 'C',
            'QA Lead': 'I',
            'PMO': 'I',
            'Operations Lead': 'C',
            'Customer Representative': 'C'
        }
    },
    {
        id: 'raci-exec-11',
        phase: 'Execution Phase',
        activity: 'Build / Develop Solution',
        assignments: {
            'Executive Sponsor': 'I',
            'Project Manager': 'C',
            'Steering Committee': 'I',
            'Business Analyst': 'C',
            'Technical Lead': 'A',
            'Developer': 'R',
            'QA Lead': 'C',
            'PMO': 'I',
            'Operations Lead': 'I',
            'Customer Representative': 'I'
        }
    },
    {
        id: 'raci-exec-12',
        phase: 'Execution Phase',
        activity: 'Perform Testing (System & UAT)',
        assignments: {
            'Executive Sponsor': 'I',
            'Project Manager': 'C',
            'Steering Committee': 'I',
            'Business Analyst': 'C',
            'Technical Lead': 'C',
            'Developer': 'R',
            'QA Lead': 'A',
            'PMO': 'I',
            'Operations Lead': 'I',
            'Customer Representative': 'C'
        }
    },
    {
        id: 'raci-exec-13',
        phase: 'Execution Phase',
        activity: 'Conduct User Training',
        assignments: {
            'Executive Sponsor': 'I',
            'Project Manager': 'C',
            'Steering Committee': 'I',
            'Business Analyst': 'R',
            'Technical Lead': 'C',
            'Developer': 'C',
            'QA Lead': 'C',
            'PMO': 'I',
            'Operations Lead': 'C',
            'Customer Representative': 'A'
        }
    },
    {
        id: 'raci-exec-14',
        phase: 'Execution Phase',
        activity: 'Deploy to Production',
        assignments: {
            'Executive Sponsor': 'C',
            'Project Manager': 'A',
            'Steering Committee': 'C',
            'Business Analyst': 'C',
            'Technical Lead': 'R',
            'Developer': 'C',
            'QA Lead': 'C',
            'PMO': 'C',
            'Operations Lead': 'A',
            'Customer Representative': 'C'
        }
    },

    // -------------------------------------------------------------
    // Phase 4: Monitoring & Control Phase
    // -------------------------------------------------------------
    {
        id: 'raci-mon-15',
        phase: 'Monitoring & Control Phase',
        activity: 'Track Project Progress',
        assignments: {
            'Executive Sponsor': 'I',
            'Project Manager': 'A',
            'Steering Committee': 'C',
            'Business Analyst': 'C',
            'Technical Lead': 'C',
            'Developer': 'C',
            'QA Lead': 'C',
            'PMO': 'R',
            'Operations Lead': 'I',
            'Customer Representative': 'I'
        }
    },
    {
        id: 'raci-mon-16',
        phase: 'Monitoring & Control Phase',
        activity: 'Manage Risks and Issues',
        assignments: {
            'Executive Sponsor': 'C',
            'Project Manager': 'A',
            'Steering Committee': 'C',
            'Business Analyst': 'C',
            'Technical Lead': 'C',
            'Developer': 'C',
            'QA Lead': 'C',
            'PMO': 'R',
            'Operations Lead': 'C',
            'Customer Representative': 'I'
        }
    },
    {
        id: 'raci-mon-17',
        phase: 'Monitoring & Control Phase',
        activity: 'Handle Change Control',
        assignments: {
            'Executive Sponsor': 'C',
            'Project Manager': 'A',
            'Steering Committee': 'C',
            'Business Analyst': 'C',
            'Technical Lead': 'C',
            'Developer': 'C',
            'QA Lead': 'C',
            'PMO': 'R',
            'Operations Lead': 'C',
            'Customer Representative': 'C'
        }
    },
    {
        id: 'raci-mon-18',
        phase: 'Monitoring & Control Phase',
        activity: 'Conduct Quality Assurance Review',
        assignments: {
            'Executive Sponsor': 'I',
            'Project Manager': 'C',
            'Steering Committee': 'C',
            'Business Analyst': 'C',
            'Technical Lead': 'C',
            'Developer': 'C',
            'QA Lead': 'A',
            'PMO': 'C',
            'Operations Lead': 'I',
            'Customer Representative': 'I'
        }
    },
    {
        id: 'raci-mon-19',
        phase: 'Monitoring & Control Phase',
        activity: 'Provide Status Reporting',
        assignments: {
            'Executive Sponsor': 'C',
            'Project Manager': 'A',
            'Steering Committee': 'C',
            'Business Analyst': 'C',
            'Technical Lead': 'C',
            'Developer': 'C',
            'QA Lead': 'C',
            'PMO': 'R',
            'Operations Lead': 'C',
            'Customer Representative': 'I'
        }
    },

    // -------------------------------------------------------------
    // Phase 5: Closure Phase
    // -------------------------------------------------------------
    {
        id: 'raci-close-20',
        phase: 'Closure Phase',
        activity: 'Obtain Customer Acceptance',
        assignments: {
            'Executive Sponsor': 'C',
            'Project Manager': 'R',
            'Steering Committee': 'C',
            'Business Analyst': 'C',
            'Technical Lead': 'C',
            'Developer': 'C',
            'QA Lead': 'I',
            'PMO': 'I',
            'Operations Lead': 'I',
            'Customer Representative': 'A'
        }
    },
    {
        id: 'raci-close-21',
        phase: 'Closure Phase',
        activity: 'Create Lessons Learned',
        assignments: {
            'Executive Sponsor': 'C',
            'Project Manager': 'R',
            'Steering Committee': 'C',
            'Business Analyst': 'C',
            'Technical Lead': 'C',
            'Developer': 'C',
            'QA Lead': 'C',
            'PMO': 'A',
            'Operations Lead': 'C',
            'Customer Representative': 'C'
        }
    },
    {
        id: 'raci-close-22',
        phase: 'Closure Phase',
        activity: 'Create Project Closure Report',
        assignments: {
            'Executive Sponsor': 'C',
            'Project Manager': 'R',
            'Steering Committee': 'C',
            'Business Analyst': 'C',
            'Technical Lead': 'C',
            'Developer': 'C',
            'QA Lead': 'C',
            'PMO': 'A',
            'Operations Lead': 'C',
            'Customer Representative': 'C'
        }
    }
];

/**
 * Matches any task name/description to the closest standard RACI activity from the template.
 */
export function matchTaskToRaciActivity(taskName: string): RACIActivityItem {
    const text = taskName.toLowerCase();

    // 1. Direct or strong keyword matches
    if (text.includes('test') || text.includes('qa') || text.includes('validation') || text.includes('uat') || text.includes('verify')) {
        return DEFAULT_RACI_ACTIVITIES.find(a => a.id === 'raci-exec-12')!; // Perform Testing
    }
    if (text.includes('build') || text.includes('develop') || text.includes('code') || text.includes('implement') || text.includes('pcb') || text.includes('circuit') || text.includes('firmware') || text.includes('assembly')) {
        return DEFAULT_RACI_ACTIVITIES.find(a => a.id === 'raci-exec-11')!; // Build / Develop Solution
    }
    if (text.includes('deploy') || text.includes('release') || text.includes('production') || text.includes('rollout') || text.includes('ship')) {
        return DEFAULT_RACI_ACTIVITIES.find(a => a.id === 'raci-exec-14')!; // Deploy to Production
    }
    if (text.includes('design review') || text.includes('architecture review') || text.includes('preliminary review') || text.includes('schematic review')) {
        return DEFAULT_RACI_ACTIVITIES.find(a => a.id === 'raci-exec-10')!; // Conduct Design Review
    }
    if (text.includes('training') || text.includes('user manual') || text.includes('handover') || text.includes('guide') || text.includes('documentation')) {
        return DEFAULT_RACI_ACTIVITIES.find(a => a.id === 'raci-exec-13')!; // Conduct User Training
    }
    if (text.includes('schedule') || text.includes('timeline') || text.includes('wbs') || text.includes('detailed plan') || text.includes('gantt')) {
        return DEFAULT_RACI_ACTIVITIES.find(a => a.id === 'raci-plan-8')!; // Develop Project Schedule
    }
    if (text.includes('resource') || text.includes('allocation') || text.includes('staffing') || text.includes('budget') || text.includes('cost')) {
        return DEFAULT_RACI_ACTIVITIES.find(a => a.id === 'raci-plan-9')!; // Plan Resource Allocation
    }
    if (text.includes('requirement') || text.includes('spec') || text.includes('analysis') || text.includes('user story') || text.includes('backlog')) {
        return DEFAULT_RACI_ACTIVITIES.find(a => a.id === 'raci-plan-7')!; // Gather and Analyze Requirements
    }
    if (text.includes('scope') || text.includes('sow') || text.includes('statement of work') || text.includes('boundary')) {
        return DEFAULT_RACI_ACTIVITIES.find(a => a.id === 'raci-plan-6')!; // Define Project Scope
    }
    if (text.includes('business case') || text.includes('roi') || text.includes('proposal') || text.includes('concept')) {
        return DEFAULT_RACI_ACTIVITIES.find(a => a.id === 'raci-plan-5')!; // Develop Business Case
    }
    if (text.includes('stakeholder') || text.includes('team') || text.includes('organization')) {
        return DEFAULT_RACI_ACTIVITIES.find(a => a.id === 'raci-init-3')!; // Identify Stakeholders
    }
    if (text.includes('feasibility') || text.includes('swot') || text.includes('risk analysis') || text.includes('study')) {
        return DEFAULT_RACI_ACTIVITIES.find(a => a.id === 'raci-init-4')!; // Conduct Initial Feasibility Study
    }
    if (text.includes('charter') || text.includes('kickoff') || text.includes('initiation')) {
        return DEFAULT_RACI_ACTIVITIES.find(a => a.id === 'raci-init-2')!; // Review and Approve Project Charter
    }
    if (text.includes('risk') || text.includes('issue') || text.includes('mitigation') || text.includes('blocker')) {
        return DEFAULT_RACI_ACTIVITIES.find(a => a.id === 'raci-mon-16')!; // Manage Risks and Issues
    }
    if (text.includes('change') || text.includes('ecn') || text.includes('revision') || text.includes('perturbation')) {
        return DEFAULT_RACI_ACTIVITIES.find(a => a.id === 'raci-mon-17')!; // Handle Change Control
    }
    if (text.includes('audit') || text.includes('qa review') || text.includes('quality') || text.includes('compliance')) {
        return DEFAULT_RACI_ACTIVITIES.find(a => a.id === 'raci-mon-18')!; // Conduct Quality Assurance Review
    }
    if (text.includes('report') || text.includes('status') || text.includes('tracking') || text.includes('progress') || text.includes('sprint plan')) {
        return DEFAULT_RACI_ACTIVITIES.find(a => a.id === 'raci-mon-15')!; // Track Project Progress
    }
    if (text.includes('acceptance') || text.includes('customer sign') || text.includes('approval') || text.includes('signoff')) {
        return DEFAULT_RACI_ACTIVITIES.find(a => a.id === 'raci-close-20')!; // Obtain Customer Acceptance
    }
    if (text.includes('lessons') || text.includes('retrospective') || text.includes('postmortem')) {
        return DEFAULT_RACI_ACTIVITIES.find(a => a.id === 'raci-close-21')!; // Create Lessons Learned
    }
    if (text.includes('closure') || text.includes('final report') || text.includes('handover close')) {
        return DEFAULT_RACI_ACTIVITIES.find(a => a.id === 'raci-close-22')!; // Create Project Closure Report
    }

    // Default fallback: Build / Develop Solution for generic technical tasks
    return DEFAULT_RACI_ACTIVITIES.find(a => a.id === 'raci-exec-11')!;
}

/**
 * Extracts the full RACIAssignment object from an activity's role assignments.
 */
export function extractRaciAssignment(activity: RACIActivityItem): RACIAssignment & { defaultRole: string } {
    let responsible = '';
    let accountable = '';
    const consulted: string[] = [];
    const informed: string[] = [];

    Object.entries(activity.assignments).forEach(([role, code]) => {
        if (code === 'R') {
            responsible = role;
        } else if (code === 'A') {
            accountable = role;
        } else if (code === 'C') {
            consulted.push(role);
        } else if (code === 'I') {
            informed.push(role);
        }
    });

    return {
        responsible: responsible || 'Developer',
        accountable: accountable || 'Technical Lead',
        consulted,
        informed,
        defaultRole: responsible || 'Developer'
    };
}

/**
 * Applies RACI default allocations to an array of tasks.
 */
export function applyRaciDefaultsToTasks(tasks: Task[]): Task[] {
    return tasks.map(task => {
        const activity = matchTaskToRaciActivity(task.name + ' ' + (task.description || ''));
        const raci = extractRaciAssignment(activity);

        return {
            ...task,
            // Allocate primary role as Responsible from RACI chart if not set, or update
            role: task.role && task.role !== 'Unassigned' ? task.role : raci.defaultRole,
            raciAssignments: {
                responsible: raci.responsible,
                accountable: raci.accountable,
                consulted: raci.consulted,
                informed: raci.informed
            }
        };
    });
}

/**
 * Standard default resource allocation items based loosely on the RACI roles chart
 * and realistic engineering project labor rates / durations, plus essential tooling.
 */
export const DEFAULT_RESOURCE_ALLOCATIONS: Resource[] = [
    {
        id: 'res-default-pm',
        name: 'Project Manager (Lead)',
        type: 'human',
        role: 'Project Manager',
        unitCost: 135,
        quantity: 120, // 120 hours
        totalCost: 16200
    },
    {
        id: 'res-default-tech-lead',
        name: 'Technical Lead / Solution Architect',
        type: 'human',
        role: 'Technical Lead',
        unitCost: 150,
        quantity: 100, // 100 hours
        totalCost: 15000
    },
    {
        id: 'res-default-dev',
        name: 'Developer / Engineering Implementation',
        type: 'human',
        role: 'Developer',
        unitCost: 115,
        quantity: 160, // 160 hours
        totalCost: 18400
    },
    {
        id: 'res-default-ba',
        name: 'Business Analyst / Requirements & Feasibility',
        type: 'human',
        role: 'Business Analyst',
        unitCost: 105,
        quantity: 80, // 80 hours
        totalCost: 8400
    },
    {
        id: 'res-default-qa',
        name: 'QA Lead / Verification & Acceptance Testing',
        type: 'human',
        role: 'QA Lead',
        unitCost: 95,
        quantity: 60, // 60 hours
        totalCost: 5700
    },
    {
        id: 'res-default-ops',
        name: 'Operations Lead / Deployment & Production Readiness',
        type: 'human',
        role: 'Operations Lead',
        unitCost: 110,
        quantity: 40, // 40 hours
        totalCost: 4400
    },
    {
        id: 'res-default-pmo',
        name: 'PMO / Governance, Risk & Change Control',
        type: 'human',
        role: 'PMO',
        unitCost: 120,
        quantity: 40, // 40 hours
        totalCost: 4800
    },
    {
        id: 'res-default-sponsor',
        name: 'Executive Sponsor / Steering Oversight',
        type: 'human',
        role: 'Executive Sponsor',
        unitCost: 225,
        quantity: 20, // 20 hours
        totalCost: 4500
    },
    {
        id: 'res-default-customer',
        name: 'Customer Representative / Stakeholder Liaison',
        type: 'human',
        role: 'Customer Representative',
        unitCost: 85,
        quantity: 30, // 30 hours
        totalCost: 2550
    },
    {
        id: 'res-default-steering',
        name: 'Steering Committee / Milestone Reviews',
        type: 'human',
        role: 'Steering Committee',
        unitCost: 195,
        quantity: 16, // 16 hours
        totalCost: 3120
    },
    {
        id: 'res-default-cloud',
        name: 'Cloud Compute & CI/CD Pipeline (AWS/GCP/Vercel)',
        type: 'physical',
        unitCost: 350,
        quantity: 3, // 3 project months
        totalCost: 1050
    },
    {
        id: 'res-default-tooling',
        name: 'Engineering Tooling, IDE & Collaboration Licenses',
        type: 'physical',
        unitCost: 65,
        quantity: 12, // 12 seat-months
        totalCost: 780
    }
];

/**
 * Creates a fresh deep-copy of default resource allocations.
 */
export function getDefaultResourceAllocations(): Resource[] {
    return JSON.parse(JSON.stringify(DEFAULT_RESOURCE_ALLOCATIONS));
}

/**
 * Calculates total budget from an array of resources.
 */
export function calculateResourcesTotalBudget(resources: Resource[]): number {
    return resources.reduce((sum, r) => sum + (r.totalCost || (r.unitCost * r.quantity) || 0), 0);
}

