
import { Document } from '../types';

// Properly type document lists to ensure status is 'Working' | 'Approved' | 'Rejected' | 'Failed'
export const DEFAULT_DOCUMENTS: Document[] = [
    { id: 'doc-default-1', title: 'Concept Proposal', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 1, sequence: 1 },
    { id: 'doc-default-2', title: 'Resources & Skills List', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 2, sequence: 1 },
    { id: 'doc-default-3', title: 'SWOT Analysis', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 3, sequence: 1 },
    { id: 'doc-default-4', title: 'Kickoff Briefing', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 4, sequence: 1 },
    { id: 'doc-default-5', title: 'Statement of Work (SOW)', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 1 },
    { id: 'doc-default-prelim', title: 'Preliminary Design Review', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 6, sequence: 1 },
    { id: 'doc-default-7', title: 'Detailed Plans (WBS/WRS)', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 1 },
    { id: 'doc-default-8', title: 'Critical Review', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 8, sequence: 99 },
    { id: 'doc-default-9', title: 'Deployment Readiness Review', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 9, sequence: 1 },
];

// Document List Definitions
const SOFTWARE_DEV_DOCS: Document[] = [
    ...DEFAULT_DOCUMENTS,
    { id: 'doc-sw-1', title: 'Technical Design Specification', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
    { id: 'doc-sw-2', title: 'User Story Backlog', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 8, sequence: 1 },
];

const MARKETING_DOCS: Document[] = [
    ...DEFAULT_DOCUMENTS,
    { id: 'doc-mkt-1', title: 'Creative Brief', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 1, sequence: 2 },
    { id: 'doc-mkt-2', title: 'Campaign Strategy', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
    { id: 'doc-mkt-3', title: 'Content Calendar', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
];

const PRODUCT_LAUNCH_DOCS: Document[] = [
    ...DEFAULT_DOCUMENTS,
    { id: 'doc-pl-1', title: 'Market Research Report', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 1, sequence: 2 },
    { id: 'doc-pl-2', title: 'Go-to-Market Strategy', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
    { id: 'doc-pl-3', title: 'Sales & Support Plan', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
];

const RESEARCH_DEV_DOCS: Document[] = [
    ...DEFAULT_DOCUMENTS,
    { id: 'doc-rd-1', title: 'Research Proposal', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 1, sequence: 2 },
    { id: 'doc-rd-2', title: 'Data Management Plan', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
    { id: 'doc-rd-3', title: 'Final Study Report', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 9, sequence: 2 },
];

const HR_INITIATIVE_DOCS: Document[] = [
    ...DEFAULT_DOCUMENTS,
    { id: 'doc-hr-1', title: 'Policy Draft', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
    { id: 'doc-hr-2', title: 'Communication Plan', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 4, sequence: 2 },
    { id: 'doc-hr-3', title: 'Training Materials', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
];

const IT_INFRA_DOCS: Document[] = [
    ...DEFAULT_DOCUMENTS,
    { id: 'doc-it-1', title: 'System Architecture Design', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
    { id: 'doc-it-2', title: 'Migration Plan', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
    { id: 'doc-it-3', title: 'Security Assessment', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 3, sequence: 2 },
];

const FILM_PROD_DOCS: Document[] = [
    ...DEFAULT_DOCUMENTS,
    { id: 'doc-film-1', title: 'Script', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 1, sequence: 2 },
    { id: 'doc-film-2', title: 'Shooting Schedule', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
    { id: 'doc-film-3', title: 'Post-Production Plan', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 8, sequence: 1 },
];

const BOOK_PUB_DOCS: Document[] = [
    ...DEFAULT_DOCUMENTS,
    { id: 'doc-book-1', title: 'Manuscript', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 1, sequence: 2 },
    { id: 'doc-book-2', title: 'Editing Schedule', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
    { id: 'doc-book-3', title: 'Marketing & Distribution Plan', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
];

const AI_INTEGRATION_DOCS: Document[] = [
    ...DEFAULT_DOCUMENTS,
    { id: 'doc-ai-1', title: 'AI Ethics & Governance Framework', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 3, sequence: 2 },
    { id: 'doc-ai-2', title: 'Model Evaluation Criteria', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
    { id: 'doc-ai-3', title: 'Data Privacy Impact Assessment', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 3, sequence: 3 },
];

const BRAND_RELAUNCH_DOCS: Document[] = [
    ...DEFAULT_DOCUMENTS,
    { id: 'doc-br-1', title: 'Brand Identity Guidelines', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
    { id: 'doc-br-2', title: 'Visual Asset Inventory', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 2, sequence: 2 },
    { id: 'doc-br-3', title: 'Public Relations Rollout Plan', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
];

const CRM_DEPLOYMENT_DOCS: Document[] = [
    ...DEFAULT_DOCUMENTS,
    { id: 'doc-crm-1', title: 'Customer Data Schema', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
    { id: 'doc-crm-2', title: 'Migration Mapping Document', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
    { id: 'doc-crm-3', title: 'CRM User Training Manual', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 8, sequence: 1 },
];

const CYBERSECURITY_AUDIT_DOCS: Document[] = [
    ...DEFAULT_DOCUMENTS,
    { id: 'doc-cs-1', title: 'Security Perimeter Map', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 2, sequence: 2 },
    { id: 'doc-cs-2', title: 'Vulnerability Assessment Report', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 3, sequence: 2 },
    { id: 'doc-cs-3', title: 'Incident Response Protocol', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
];

const CYBERSECURITY_AUDIT_AUDIT_DOCS = CYBERSECURITY_AUDIT_DOCS;

const OFFICE_RELOCATION_DOCS: Document[] = [
    ...DEFAULT_DOCUMENTS,
    { id: 'doc-off-1', title: 'Floor Plan & Seating Chart', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
    { id: 'doc-off-2', title: 'Logistics & Moving Schedule', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
    { id: 'doc-off-3', title: 'Infrastructure Readiness Checklist', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 9, sequence: 2 },
];

const ISO_CERTIFICATION_DOCS: Document[] = [
    ...DEFAULT_DOCUMENTS,
    { id: 'doc-iso-1', title: 'Quality Manual', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
    { id: 'doc-iso-2', title: 'Internal Audit Schedule', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
    { id: 'doc-iso-3', title: 'Management Review Record', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 8, sequence: 1 },
];

const MERGER_INTEGRATION_DOCS: Document[] = [
    ...DEFAULT_DOCUMENTS,
    { id: 'doc-mi-1', title: 'Integration Synergy Report', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 3, sequence: 2 },
    { id: 'doc-mi-2', title: 'Organizational Structure Map', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
    { id: 'doc-mi-3', title: 'Culture Alignment Strategy', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
];

const SUPPLY_CHAIN_DIGITAL_DOCS: Document[] = [
    ...DEFAULT_DOCUMENTS,
    { id: 'doc-sc-1', title: 'Vendor API Integration Spec', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
    { id: 'doc-sc-2', title: 'Logistics Optimization Algorithm', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
    { id: 'doc-sc-3', title: 'Inventory Visibility Report', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 9, sequence: 2 },
];

const SUSTAINABILITY_INITIATIVE_DOCS: Document[] = [
    ...DEFAULT_DOCUMENTS,
    { id: 'doc-esg-1', title: 'Environmental Baseline Study', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 1, sequence: 2 },
    { id: 'doc-esg-2', title: 'Carbon Neutrality Roadmap', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
    { id: 'doc-esg-3', title: 'ESG Reporting Framework', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 9, sequence: 2 },
];

const ERP_UPGRADE_DOCS: Document[] = [
    ...DEFAULT_DOCUMENTS,
    { id: 'doc-erp-1', title: 'Business Process Mapping', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 2, sequence: 2 },
    { id: 'doc-erp-2', title: 'Functional Upgrade Specs', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
    { id: 'doc-erp-3', title: 'Regression Test Script', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
];

const ECOMMERCE_LAUNCH_DOCS: Document[] = [
    ...DEFAULT_DOCUMENTS,
    { id: 'doc-ecom-1', title: 'Payment Gateway Integration Spec', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
    { id: 'doc-ecom-2', title: 'Customer Acquisition Funnel', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
    { id: 'doc-ecom-3', title: 'Order Fulfillment Protocol', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 9, sequence: 2 },
];

const MOBILE_APP_DEV_DOCS: Document[] = [
    ...DEFAULT_DOCUMENTS,
    { id: 'doc-mob-1', title: 'UI/UX Wireframes', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
    { id: 'doc-mob-2', title: 'API Documentation', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
    { id: 'doc-mob-3', title: 'Beta Testing Plan', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 8, sequence: 1 },
];

const ANNUAL_AUDIT_DOCS: Document[] = [
    ...DEFAULT_DOCUMENTS,
    { id: 'doc-aud-1', title: 'Internal Controls Checklist', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 3, sequence: 2 },
    { id: 'doc-aud-2', title: 'Compliance Test Program', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
    { id: 'doc-aud-3', title: 'Final Auditor\'s Opinion', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 9, sequence: 2 },
];

const DIGITAL_CONTENT_STRATEGY_DOCS: Document[] = [
    ...DEFAULT_DOCUMENTS,
    { id: 'doc-dcs-1', title: 'Audience Persona Map', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 1, sequence: 2 },
    { id: 'doc-dcs-2', title: 'Distribution Channel Matrix', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
    { id: 'doc-dcs-3', title: 'Editorial Style Guide', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
];

const RAW_TEMPLATES = [
    {
        id: 'software-dev',
        name: 'Agile Software Development',
        discipline: 'Software Development',
        documents: SOFTWARE_DEV_DOCS
    },
    {
        id: 'marketing-campaign',
        name: 'Marketing Campaign',
        discipline: 'Marketing & Communications',
        documents: MARKETING_DOCS
    },
    {
        id: 'construction',
        name: 'Construction Project',
        discipline: 'Construction & Engineering',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-con-1', title: 'Permit Applications', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 2, sequence: 2 },
            { id: 'doc-con-2', title: 'Bill of Materials', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
        ] as Document[]
    },
    {
        id: 'event-planning',
        name: 'Event Management',
        discipline: 'Event Management',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-evt-1', title: 'Venue Contract', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
            { id: 'doc-evt-2', title: 'Run of Show', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
        ] as Document[]
    },
    {
        id: 'product-launch',
        name: 'Product Development Accelerator',
        discipline: 'Product Management',
        documents: PRODUCT_LAUNCH_DOCS
    },
    {
        id: 'research-dev',
        name: 'R&D Initiative',
        discipline: 'Scientific Research',
        documents: RESEARCH_DEV_DOCS
    },
    {
        id: 'hr-initiative',
        name: 'HR Strategy Rollout',
        discipline: 'Human Resources',
        documents: HR_INITIATIVE_DOCS
    },
    {
        id: 'it-infra-upgrade',
        name: 'IT Infrastructure Upgrade',
        discipline: 'Information Technology',
        documents: IT_INFRA_DOCS
    },
    {
        id: 'film-production',
        name: 'Film Production Workflow',
        discipline: 'Film & Media',
        documents: FILM_PROD_DOCS
    },
    {
        id: 'book-publishing',
        name: 'Book Publishing Cycle',
        discipline: 'Publishing',
        documents: BOOK_PUB_DOCS
    },
    {
        id: 'non-profit-fundraiser',
        name: 'Non-Profit Fundraiser',
        discipline: 'Non-Profit Management',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-np-1', title: 'Grant Proposal', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 1, sequence: 2 },
            { id: 'doc-np-2', title: 'Donor Outreach Plan', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
            { id: 'doc-np-3', title: 'Impact Report', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 9, sequence: 2 },
        ] as Document[]
    },
    {
        id: 'academic-course-dev',
        name: 'Academic Course Development',
        discipline: 'Education',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-edu-1', title: 'Syllabus', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 1, sequence: 2 },
            { id: 'doc-edu-2', title: 'Lecture Materials', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
            { id: 'doc-edu-3', title: 'Assessment Plan', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 8, sequence: 1 },
        ] as Document[]
    },
    {
        id: 'ai-integration',
        name: 'AI Integration Strategy',
        discipline: 'Technology / AI',
        documents: AI_INTEGRATION_DOCS
    },
    {
        id: 'brand-relaunch',
        name: 'Brand Rebranding & Accelerator',
        discipline: 'Marketing',
        documents: BRAND_RELAUNCH_DOCS
    },
    {
        id: 'cloud-migration',
        name: 'Cloud Migration & Transformation',
        discipline: 'Information Technology',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-cloud-1', title: 'Cloud Architecture Diagram', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
            { id: 'doc-cloud-2', title: 'Data Migration Strategy', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
        ] as Document[]
    },
    {
        id: 'crm-deployment',
        name: 'CRM System Deployment',
        discipline: 'Business Systems',
        documents: CRM_DEPLOYMENT_DOCS
    },
    {
        id: 'cyber-audit',
        name: 'Cybersecurity Framework Audit',
        discipline: 'Security & Compliance',
        documents: CYBERSECURITY_AUDIT_AUDIT_DOCS
    },
    {
        id: 'data-center-reloc',
        name: 'Data Center Relocation',
        discipline: 'Infrastructure',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-dc-1', title: 'Physical Rack Mapping', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 2, sequence: 2 },
            { id: 'doc-dc-2', title: 'Uptime Maintenance Protocol', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
        ] as Document[]
    },
    {
        id: 'digital-content',
        name: 'Digital Content Strategy',
        discipline: 'Media',
        documents: DIGITAL_CONTENT_STRATEGY_DOCS
    },
    {
        id: 'ecom-migration',
        name: 'E-commerce Platform Deployment',
        discipline: 'Retail Technology',
        documents: ECOMMERCE_LAUNCH_DOCS
    },
    {
        id: 'employee-onboarding',
        name: 'Employee Onboarding Program',
        discipline: 'Human Resources',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-ob-1', title: 'Standard Operating Procedures', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
            { id: 'doc-ob-2', title: 'Training Curriculum', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
        ] as Document[]
    },
    {
        id: 'erp-upgrade',
        name: 'ERP System Upgrade',
        discipline: 'Enterprise Systems',
        documents: ERP_UPGRADE_DOCS
    },
    {
        id: 'iso-9001',
        name: 'ISO 9001 Certification',
        discipline: 'Quality Assurance',
        documents: ISO_CERTIFICATION_DOCS
    },
    {
        id: 'lean-manufacturing',
        name: 'Lean Manufacturing Implementation',
        discipline: 'Operations',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-lean-1', title: 'Value Stream Map', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 2, sequence: 2 },
            { id: 'doc-lean-2', title: 'Kaizen Event Schedule', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
        ] as Document[]
    },
    {
        id: 'merger-integration',
        name: 'Merger & Acquisition Integration',
        discipline: 'Corporate Strategy',
        documents: MERGER_INTEGRATION_DOCS
    },
    {
        id: 'mobile-app-dev',
        name: 'Mobile Application Development',
        discipline: 'Software Development',
        documents: MOBILE_APP_DEV_DOCS
    },
    {
        id: 'office-reloc',
        name: 'Office Relocation Project',
        discipline: 'Operations & Facilities',
        documents: OFFICE_RELOCATION_DOCS
    },
    {
        id: 'org-change',
        name: 'Organizational Change Management',
        discipline: 'Human Resources',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-ch-1', title: 'Stakeholder Impact Matrix', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 3, sequence: 2 },
            { id: 'doc-ch-2', title: 'Transformation Roadmap', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
        ] as Document[]
    },
    {
        id: 'financial-audit',
        name: 'Regulatory Financial Audit',
        discipline: 'Finance',
        documents: ANNUAL_AUDIT_DOCS
    },
    {
        id: 'supply-chain-digital',
        name: 'Supply Chain Digitalization',
        discipline: 'Logistics',
        documents: SUPPLY_CHAIN_DIGITAL_DOCS
    },
    {
        id: 'sustainability-esg',
        name: 'Sustainability & ESG Initiative',
        discipline: 'Corporate Responsibility',
        documents: SUSTAINABILITY_INITIATIVE_DOCS
    },
    {
        id: 'website-redesign',
        name: 'Website Redesign & UX',
        discipline: 'Digital Marketing',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-web-1', title: 'SEO Strategy & Audit', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 3, sequence: 2 },
            { id: 'doc-web-2', title: 'Interactive Wireframes', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
            { id: 'doc-web-3', title: 'Conversion Rate Optimization Plan', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
        ] as Document[]
    },
    {
        id: 'mech-eng',
        name: 'Mechanical Engineering Design',
        discipline: 'Mechanical Engineering',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-mech-1', title: 'CAD Models & Drawings', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
            { id: 'doc-mech-2', title: 'Finite Element Analysis (FEA) Report', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 6, sequence: 2 },
            { id: 'doc-mech-3', title: 'Prototype Testing Protocol', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
        ] as Document[]
    },
    {
        id: 'elec-sys',
        name: 'Electrical Systems Design',
        discipline: 'Electrical Engineering',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-elec-1', title: 'Single Line Diagrams (SLD)', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
            { id: 'doc-elec-2', title: 'Load Calculation Report', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 6, sequence: 2 },
            { id: 'doc-elec-3', title: 'Circuit Schematics', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
        ] as Document[]
    },
    {
        id: 'civil-infra',
        name: 'Civil Infrastructure',
        discipline: 'Civil Engineering',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-civ-1', title: 'Topographical Survey', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 2, sequence: 2 },
            { id: 'doc-civ-2', title: 'Grading & Drainage Plan', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
            { id: 'doc-civ-3', title: 'Structural Calculations', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
        ] as Document[]
    },
    {
        id: 'industrial-plant',
        name: 'Industrial Plant Design',
        discipline: 'Industrial Engineering',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-ind-1', title: 'Process Flow Diagrams (PFD)', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
            { id: 'doc-ind-2', title: 'Equipment Layout Plan', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
            { id: 'doc-ind-3', title: 'Piping & Instrumentation Diagram (P&ID)', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 3 },
        ] as Document[]
    },
    {
        id: 'consumer-product',
        name: 'Consumer Product Design',
        discipline: 'Product Design',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-cp-1', title: 'Industrial Design Sketches', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 1, sequence: 2 },
            { id: 'doc-cp-2', title: 'CMF (Color, Material, Finish) Spec', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
            { id: 'doc-cp-3', title: 'Packaging Design Files', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 8, sequence: 1 },
        ] as Document[]
    },
    {
        id: 'aerospace-comp',
        name: 'Aerospace Component Dev',
        discipline: 'Aerospace Engineering',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-aero-1', title: 'Aerodynamic Simulation Report', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 3, sequence: 2 },
            { id: 'doc-aero-2', title: 'Weight & Balance Report', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 6, sequence: 2 },
            { id: 'doc-aero-3', title: 'Flight Readiness Review', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 9, sequence: 1 },
        ] as Document[]
    },
    {
        id: 'biomed-device',
        name: 'Biomedical Device R&D',
        discipline: 'Biomedical Engineering',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-bio-1', title: 'Clinical Trial Strategy', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 3, sequence: 2 },
            { id: 'doc-bio-2', title: 'Regulatory Compliance (FDA/CE) Plan', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
            { id: 'doc-bio-3', title: 'Biocompatibility Test Report', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 8, sequence: 1 },
        ] as Document[]
    },
    {
        id: 'auto-eng',
        name: 'Automotive Systems Eng',
        discipline: 'Automotive Engineering',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-auto-1', title: 'Powertrain Spec Sheet', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
            { id: 'doc-auto-2', title: 'Chassis Design Layout', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
            { id: 'doc-auto-3', title: 'Safety Crash Test Plan', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 8, sequence: 1 },
        ] as Document[]
    },
    {
        id: 'renewable-energy',
        name: 'Renewable Energy Install',
        discipline: 'Energy Engineering',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-ren-1', title: 'Site Solar/Wind Resource Assessment', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 1, sequence: 2 },
            { id: 'doc-ren-2', title: 'Grid Interconnection Study', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 3, sequence: 2 },
            { id: 'doc-ren-3', title: 'Energy Yield Prediction', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
        ] as Document[]
    },
    {
        id: 'chem-process',
        name: 'Chemical Process Eng',
        discipline: 'Chemical Engineering',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-chem-1', title: 'Mass & Energy Balance', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
            { id: 'doc-chem-2', title: 'HAZOP Study Report', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 6, sequence: 2 },
            { id: 'doc-chem-3', title: 'Reactor Design Spec', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
        ] as Document[]
    },
    {
        id: 'robotics-auto',
        name: 'Robotics & Automation',
        discipline: 'Mechatronics',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-robo-1', title: 'Kinematic Analysis', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
            { id: 'doc-robo-2', title: 'Control Logic Flowchart', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
            { id: 'doc-robo-3', title: 'End-Effector Design', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 3 },
        ] as Document[]
    },
    {
        id: 'struct-eng',
        name: 'Structural Eng Analysis',
        discipline: 'Structural Engineering',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-str-1', title: 'Load Case Definition', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 2, sequence: 2 },
            { id: 'doc-str-2', title: 'Structural Analysis Report', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 6, sequence: 2 },
            { id: 'doc-str-3', title: 'Foundation Design Drawings', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
        ] as Document[]
    },
    {
        id: 'env-impact',
        name: 'Environmental Impact Study',
        discipline: 'Environmental Science',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-env-1', title: 'Field Sampling Plan', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 2, sequence: 2 },
            { id: 'doc-env-2', title: 'Ecological Risk Assessment', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
            { id: 'doc-env-3', title: 'Remediation Action Plan', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 8, sequence: 1 },
        ] as Document[]
    },
    {
        id: 'urban-planning',
        name: 'Urban Planning & Dev',
        discipline: 'Urban Planning',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-urb-1', title: 'Zoning Analysis', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 1, sequence: 2 },
            { id: 'doc-urb-2', title: 'Traffic Impact Study', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 3, sequence: 2 },
            { id: 'doc-urb-3', title: 'Master Plan Renderings', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
        ] as Document[]
    },
    {
        id: 'interior-design',
        name: 'Interior Design Fit-out',
        discipline: 'Interior Design',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-int-1', title: 'Mood Board & Concept', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 1, sequence: 2 },
            { id: 'doc-int-2', title: 'Furniture, Fixtures & Equipment (FF&E) Schedule', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
            { id: 'doc-int-3', title: 'Reflected Ceiling Plan', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
        ] as Document[]
    },
    {
        id: 'retail-rollout',
        name: 'Retail Store Rollout',
        discipline: 'Retail Operations',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-ret-1', title: 'Store Layout Standard', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 2, sequence: 2 },
            { id: 'doc-ret-2', title: 'Merchandising Planogram', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
            { id: 'doc-ret-3', title: 'Signage & Graphics Package', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
        ] as Document[]
    },
    {
        id: 'hospitality-resort',
        name: 'Hospitality Resort Dev',
        discipline: 'Hospitality Development',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-hosp-1', title: 'Guest Experience Journey Map', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 1, sequence: 2 },
            { id: 'doc-hosp-2', title: 'Operational Staffing Plan', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 2 },
            { id: 'doc-hosp-3', title: 'Landscape Architecture Plan', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
        ] as Document[]
    },
    {
        id: 'edu-campus',
        name: 'Educational Campus Expansion',
        discipline: 'Education Infrastructure',
        documents: [
            ...DEFAULT_DOCUMENTS,
            { id: 'doc-camp-1', title: 'Student Enrollment Projection', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 1, sequence: 2 },
            { id: 'doc-camp-2', title: 'Facility Usage Analysis', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 3, sequence: 2 },
            { id: 'doc-camp-3', title: 'Classroom Technology Spec', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 7, sequence: 2 },
        ] as Document[]
    }
];

// Export final sorted templates
export const TEMPLATES = [...RAW_TEMPLATES].sort((a, b) => a.name.localeCompare(b.name));
