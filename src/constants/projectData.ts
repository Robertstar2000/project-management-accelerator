import { TEMPLATES as allTemplates, DEFAULT_DOCUMENTS as defaultDocs } from './templates';
import { PHASES, PHASE_DOCUMENT_REQUIREMENTS, DEFAULT_SPRINTS, DEFAULT_TASKS, DEFAULT_MILESTONES } from './workflow';
import { PROMPTS } from './prompts';

export const TEMPLATES = allTemplates;
export const DEFAULT_DOCUMENTS = defaultDocs;
export { PHASES, PHASE_DOCUMENT_REQUIREMENTS, DEFAULT_SPRINTS, DEFAULT_TASKS, DEFAULT_MILESTONES, PROMPTS };

export const GRAPHICAL_ARTIFACTS = [
    "Flowchart",
    "Architecture Diagram",
    "Mind Map",
    "SWOT Matrix",
    "UI Mockup",
    "Infographic",
    "Sequence Diagram",
    "Data Model Diagram",
    "Process Map",
    "Risk Heatmap",
    "Gantt Chart Visualization",
    "User Journey Map",
    "Schematics",
    "Mechanical Drawing",
    "3D Drawing",
    "Illustration"
];