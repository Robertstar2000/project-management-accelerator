
import { COMPLEXITY_INSTRUCTIONS, SPRINT_INSTRUCTIONS, TEAM_SIZE_INSTRUCTIONS } from './instructions.ts';

export const PROMPTS = {
    compactContent: (contentToCompact) => `
You are an expert data compression model. Your task is to take the following project document and compact it into a dense, LLM-readable format.
The goal is to retain ALL information, specifications, numbers, lists, and key concepts, but remove all human-friendly prose, articles, and connectors.
Use abbreviations, symbols, and a JSON-like or YAML-like structure where possible. Eliminate redundancy. The output should be as short as possible without losing any data. This output will be used as context for a future LLM prompt, so it must be information-rich.

DO NOT summarize. You must retain all specific details.

Here is the document to compact:
---
${contentToCompact}
---
`,
    // --- TIMELINE AGENT WORKFLOW PROMPTS ---
    timelineExtractor: (context, project) => `
AGENT ROLE: DATA EXTRACTOR
OBJECTIVE: Analyze project documentation (WBS, SOW) and extract structured data for project tracking.
CONTEXT: 
${context}

PROJECT METADATA:
Name: ${project.name}
Start Date: ${project.startDate}

INSTRUCTIONS:
1.  **Tasks**: Identify every actionable task required to complete the project.
    -   Assign a specific "Role" (e.g., "Frontend Dev", "Project Manager") responsible for it.
    -   Estimate "Duration" in work days (integers only, e.g., 1, 3, 5).
    -   Identify "Dependencies" (exact names of tasks that must finish before this one starts).
2.  **Milestones**: Identify key delivery dates, phase completions, or review points.
3.  **Roles**: List all distinct personnel roles required for the project.

OUTPUT REQUIREMENT:
Return a JSON object matching the provided schema exactly. Ensure "dependencies" is an array of strings.
`,
    timelineScheduler: (extractedJson, startDate) => `
AGENT ROLE: MASTER SCHEDULER
OBJECTIVE: Generate chronological dates and sprint assignments for the provided tasks.
INPUT DATA: ${extractedJson}
PROJECT START: ${startDate}

SCHEDULING RULES:
1.  **Dates**: Calculate "startDate" and "endDate" (YYYY-MM-DD) for every task.
    -   **Sequence**: If Task B depends on Task A, Task B must start AFTER Task A ends.
    -   **Duration**: endDate = startDate + duration (approximate, assuming 5-day work week).
    -   **Start**: The first tasks with no dependencies should start on ${startDate}.
2.  **Resource Leveling**: A single "Role" cannot do two things at once. Sequence tasks for the same role chronologically unless they are explicitly parallelizable.
3.  **Sprints**: Assign each task to a "Sprint" (e.g., "Sprint 1", "Sprint 2"). Assume 2-week (14-day) sprints starting from Project Start.
4.  **Milestones**: Assign a specific "date" (YYYY-MM-DD) to each milestone based on the completion of relevant tasks (e.g., end of a Sprint or Phase).

OUTPUT REQUIREMENT:
Return a JSON object with "tasks" and "milestones" matching the schema. Ensure dates are valid strings.
`,
    jsonQA: (jsonContent, schemaDescription) => `
AGENT ROLE: DATA QUALITY ASSURANCE
OBJECTIVE: Validate, Repair, and Finalize the provided project data JSON.
INPUT JSON: ${jsonContent}
REQUIREMENTS: ${schemaDescription}

CHECKS:
1.  **Syntax**: Ensure the output is valid, parseable JSON.
2.  **Dates**: Ensure all "startDate", "endDate", and "date" fields are in strict YYYY-MM-DD format.
3.  **Logic**: Ensure "endDate" is never before "startDate".
4.  **Completeness**: Ensure every task has a "name", "role", "sprint", and dates.
5.  **Dependencies**: Ensure referenced dependencies exist. If a circular dependency exists, break it.

OUTPUT:
Return the CORRECTED JSON object. Do not wrap in markdown or code blocks. Just the raw JSON string.
`,

    // ... (Keep existing 3-agent prompts below for backward compatibility if needed, or remove if fully replacing)
    plannerAgent: (_context: string) => `...`, // (Existing content)
    doerAgent: (_plannerOutput: string, _context: string) => `...`, // (Existing content)
    qaAgent: (_doerOutput: string) => `...`, // (Existing content)

    generateDocumentList: (discipline, scope = 'internal', teamSize = 'medium', complexity = 'typical') => {
        const docCount = {
            easy: '5 to 7',
            typical: '7 to 10',
            complex: '10 to 15'
        }[complexity];
        
        return `
You are an expert project manager specializing in the "${discipline}" field.
Your task is to generate a list of ${docCount} essential project documents required to plan and execute a project in this discipline.
${TEAM_SIZE_INSTRUCTIONS.complexity[teamSize]}
${COMPLEXITY_INSTRUCTIONS[complexity]}
${scope === 'subcontracted' ? 'This is a subcontracted project. The list MUST include documents for managing the subcontractor. Specifically, you MUST include a "Request for Proposal (RFP)" and a "Draft Contract with T\'s & C\'s". All documents should clearly reflect the division of responsibilities between the internal team and the subcontractor.' : ''}
The project follows a 9-phase methodology (HMAP). You must assign each document to the most appropriate phase. The phases are:
1.  **Develop Concept Proposal**: Define scope, vision, and high-level objectives.
2.  **List Resources & Skills Needed**: Inventory of roles, skills, external partners, and tooling.
3.  **SWOT Analysis & Support Gathering**: Analyze risks, strengths, weaknesses; secure stakeholder buy-in.
4.  **Kickoff Review & Briefing**: Align team, confirm objectives, and set expectations.
5.  **Initial Planning & Statement of Work (SOW)**: Detail boundaries, deliverables, and constraints.
6.  **Preliminary Design Review**: Formal review of the SOW and initial plans.
7.  **Develop Detailed Plans & Timeline**: Create WBS, task lists, and milestones.
8.  **Sprint & Critical Design Planning**: Define sprint-level requirements and conduct final design review.
9.  **Deployment Review & Execution Start**: Final readiness check before starting work.

CRITICAL: You MUST include the following six core HMAP documents, assigned to their correct phases as specified below:
- "Concept Proposal" (must be in phase 1)
- "Resources & Skills List" (must be in phase 2)
- "SWOT Analysis" (must be in phase 3)
- "Kickoff Briefing" (must be in phase 4)
- "Statement of Work (SOW)" (must be in phase 5)
- "Detailed Plans (WBS/WRS)" (must be in phase 7)

CRITICAL: The list MUST also include at least one formal review checklist document, such as "Preliminary Design Review" (Phase 6) or "Critical Design Review" (Phase 8).

Your final output must be a single, raw JSON object, without any surrounding text or markdown formatting. This JSON object must have a single root key named "documents" containing an array of document objects. Each document object must have exactly three keys: "title" (string), "phase" (number), and "sequence" (number).
`;
    },
    phase1: (name, discipline, userInput, mode = 'fullscale', scope = 'internal', teamSize = 'medium', complexity = 'typical') => {
        const subcontractorInstruction = scope === 'subcontracted' ? 'Crucially, the proposal must differentiate between the internal project management team\'s responsibilities and the scope of work to be performed by the subcontractor.' : '';
        const teamSizeInstruction = TEAM_SIZE_INSTRUCTIONS.complexity[teamSize];
        const complexityInstruction = COMPLEXITY_INSTRUCTIONS[complexity];
        
        const userInputSection = userInput && userInput.trim() !== '' 
            ? `The user has provided the following initial project expectations, which you MUST expand upon and incorporate into your response:\n--- USER INPUT ---\n${userInput}\n------------------\n\n`
            : 'The user has not provided any initial input. You must generate the entire proposal from scratch based on the project name and discipline.';

        if (mode === 'minimal') {
            return `Generate an accurate, succinct, bulleted Concept Proposal for a project named "${name}" in the "${discipline}" field. 
${teamSizeInstruction} ${complexityInstruction} 
The proposal must be specific to "${name}". ${subcontractorInstruction} 
Use technical jargon standard to "${discipline}".
${userInputSection}
OUTPUT RULE: Use ONLY bullet points. Zero introductory or concluding filler. Maximise information density.`;
        }
        return `You are a project manager creating a Concept Proposal for a project named "${name}", which is a project in the "${discipline}" field. ${teamSizeInstruction} ${complexityInstruction} The output must be directly and specifically about planning for "${name}". ${subcontractorInstruction}\n\n${userInputSection}Develop a well-structured proposal with clear headings for: "Executive Summary", "Project Vision", "Scope (In-Scope & Out-of-Scope)", "High-Level Objectives", and "Key Success Metrics". The entire proposal must be framed through the lens of the "${discipline}" discipline.`;
    },
    phase2: (name, discipline, context, mode = 'fullscale', scope = 'internal', teamSize = 'medium', complexity = 'typical') => {
        const subcontractorInstruction = scope === 'subcontracted' ? 'The list must distinguish between the internal team roles required to manage the project and the roles expected to be provided by the subcontractor. Clearly label the subcontractor resources.' : '';
        const teamSizeInstruction = TEAM_SIZE_INSTRUCTIONS.roles[teamSize];
        const complexityInstruction = COMPLEXITY_INSTRUCTIONS[complexity];
        if (mode === 'minimal') {
            return `Generate a succinct, accurate, and bulleted **Resources & Skills List** for a project named "${name}" in the "${discipline}" discipline.
--- HIGH-LEVEL CONTEXT ---
${context}
-------------------------
${teamSizeInstruction} ${complexityInstruction} ${subcontractorInstruction}
Use standard industry jargon. Zero filler prose. 

CRITICAL FOR PARSING: Your output MUST use the following exact Markdown headings: "## Required Roles", "## Required Software", "## Required Hardware", "## External Partners". 
Under each heading, provide a succinct, bulleted list of 1-3 essential items. 
No introductory or concluding sentences.`;
        }
        return `You are an expert project manager. Your task is to generate a comprehensive **Resources & Skills List** for a project named "${name}" in the "${discipline}" discipline.\n\n--- HIGH-LEVEL CONTEXT ---\n${context}\n-------------------------\n\n${teamSizeInstruction} ${complexityInstruction} ${subcontractorInstruction} The names for all listed resources must be standard and commonly used in the '${discipline}' industry.\n\nCRITICAL FOR PARSING: Structure your response using the following exact Markdown headings: "## Required Roles", "## Required Software", "## Required Hardware", "## External Partners". Under each heading, provide ONLY a simple bulleted list of names. For each role, list key skills on the same line after a colon (e.g., "- Project Manager: PMP, Agile"). If a category has no items, provide the heading followed by "- None". Your output must not contain any other text.`;
    },
    phase3: (name, discipline, context, mode = 'fullscale', scope = 'internal', teamSize = 'medium', complexity = 'typical') => {
        const subcontractorInstruction = scope === 'subcontracted' ? 'The analysis must consider risks and opportunities related to using a subcontractor.' : '';
        const teamSizeInstruction = `Consider the implications of a ${teamSize}-sized team in your analysis.`;
        const complexityInstruction = COMPLEXITY_INSTRUCTIONS[complexity];
        if (mode === 'minimal') {
            return `Generate an accurate and succinct **SWOT Analysis** for project "${name}" (${discipline}).
--- HIGH-LEVEL CONTEXT ---
${context}
-------------------------
${teamSizeInstruction} ${complexityInstruction} ${subcontractorInstruction} 
OUTPUT RULE: Use ONLY short bullet points for Strengths, Weaknesses, Opportunities, and Threats. Zero filler prose. High information density.`;
        }
        return `You are an expert project manager. Your task is to generate a **SWOT Analysis** for a project named "${name}" in the "${discipline}" discipline.\n\n--- HIGH-LEVEL CONTEXT ---\n${context}\n-------------------------\n\nNow, perform a detailed SWOT analysis. ${teamSizeInstruction} ${complexityInstruction} ${subcontractorInstruction} Also, outline a strategy for gathering support and securing buy-in from key stakeholders.`;
    },
    phase4: (name, discipline, context, mode = 'fullscale', scope = 'internal', teamSize = 'medium', complexity = 'typical') => {
        const subcontractorInstruction = scope === 'subcontracted' ? 'The agenda must include specific items for aligning with the subcontractor.' : '';
        const teamSizeInstruction = `The project team size is ${teamSize}. Tailor the agenda's formality and detail accordingly.`;
        const complexityInstruction = COMPLEXITY_INSTRUCTIONS[complexity];
        if (mode === 'minimal') {
            return `Generate an accurate, succinct, bullet-point-only **Kickoff Briefing** agenda for "${name}".
--- HIGH-LEVEL CONTEXT ---
${context}
-------------------------
${teamSizeInstruction} ${complexityInstruction} ${subcontractorInstruction}
OUTPUT RULE: Bullet points only. Zero introductory or concluding filler.`;
        }
        return `You are an expert project manager. Your task is to generate a **Kickoff Briefing** for a project named "${name}" in the "${discipline}" discipline.\n\n--- HIGH-LEVEL CONTEXT ---\n${context}\n-------------------------\n\nCreate a detailed agenda and briefing document for a project kickoff review. ${teamSizeInstruction} ${complexityInstruction} ${subcontractorInstruction} The document should aim to align the team, confirm project objectives, and set clear expectations.`;
    },
    phase5: (name, discipline, context, mode = 'fullscale', scope = 'internal', teamSize = 'medium', complexity = 'typical') => {
        const subcontractorInstruction = scope === 'subcontracted' ? 'The SOW must be written from the perspective of the internal company managing the project. It must clearly define the scope of work to be performed by the subcontractor versus the work and responsibilities retained by the internal team.' : '';
        const complexityInstruction = COMPLEXITY_INSTRUCTIONS[complexity];
        const teamSizeInstruction = TEAM_SIZE_INSTRUCTIONS.complexity[teamSize];
        if (mode === 'minimal') {
            return `Generate an accurate, succinct **Statement of Work (SOW)** for project "${name}".
--- HIGH-LEVEL CONTEXT ---
${context}
-------------------------
${teamSizeInstruction} ${complexityInstruction} ${subcontractorInstruction}
OUTPUT RULE: Use only section headings and short, accurate bullet points. Zero fluff. Zero verbosity.`;
        }
        return `You are an expert project manager. Your task is to generate a **Statement of Work (SOW)** for a project named "${name}" in the "${discipline}" discipline.\n\n--- HIGH-LEVEL CONTEXT ---\n${context}\n-------------------------\n\nNow, draft a detailed Statement of Work (SOW). ${teamSizeInstruction} ${complexityInstruction} ${subcontractorInstruction} The SOW must be well-structured and use the following exact Markdown headings for its sections: "## Scope of Work", "## Deliverables", "## Acceptance Criteria", "## Project Assumptions", "## Key Constraints", and "## Exclusions (Out of Scope)". IMPORTANT: Do not include a separate section for team roles or resources.`;
    },
    phase6: (name, discipline, context, mode = 'fullscale', scope = 'internal', teamSize = 'medium', complexity = 'typical') => {
        const subcontractorInstruction = scope === 'subcontracted' ? 'The checklist must include items to confirm the subcontractor\'s understanding and agreement with the SOW.' : '';
        const teamSizeInstruction = `The team size is ${teamSize}, so the review's formality should match.`;
        const complexityInstruction = COMPLEXITY_INSTRUCTIONS[complexity];
        if (mode === 'minimal') {
            return `Generate a succinct 3-5 point **Preliminary Review** checklist for project "${name}".
--- HIGH-LEVEL CONTEXT ---
${context}
-------------------------
${teamSizeInstruction} ${complexityInstruction} ${subcontractorInstruction}
OUTPUT RULE: Bullet points only. Zero filler prose. Accurate and technical.`;
        }
        return `You are an expert project manager. Your task is to generate a **Preliminary Review** document for a project named "${name}" in the "${discipline}" discipline.\n\n--- HIGH-LEVEL CONTEXT ---\n${context}\n-------------------------\n\nFor the project "${name}", generate a comprehensive checklist for a Preliminary Design Review. ${teamSizeInstruction} ${complexityInstruction} ${subcontractorInstruction}`;
    },
    phase7: (name, discipline, context, mode = 'fullscale', scope = 'internal', _teamSize = 'medium', complexity = 'typical') => {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 14);
        const projectStartDate = startDate.toLocaleDateString('en-CA'); // YYYY-MM-DD

        const wbsInstruction = complexity === 'easy' ? TEAM_SIZE_INSTRUCTIONS.wbs.small : complexity === 'complex' ? TEAM_SIZE_INSTRUCTIONS.wbs.large : TEAM_SIZE_INSTRUCTIONS.wbs.medium;
        const teamSizeInstruction = wbsInstruction;
        const complexityInstruction = COMPLEXITY_INSTRUCTIONS[complexity];
        const sprintInstruction = SPRINT_INSTRUCTIONS[complexity];

        const subcontractorInstruction = scope === 'subcontracted'
            ? `
This is a subcontracted project. The task list MUST include a "Subcontractor" column. Mark "Yes" in this column for tasks to be performed by the subcontractor, and "No" for internal tasks. The plan must include tasks for managing the subcontractor (e.g., "Review Subcontractor Deliverable").`
            : '';

        if (mode === 'minimal') {
            const subcontractorMinimalInstruction = scope === 'subcontracted' ? `Include a "Subcontractor" column (Yes/No).` : '';
            const subcontractorMinimalColumns = scope === 'subcontracted' ? `| Task Name | Role | Start Date | End Date | Duration (days) | Dependencies | Sprint | Subcontractor |` : `| Task Name | Role | Start Date | End Date | Duration (days) | Dependencies | Sprint |`;
            
          return `You are an expert AI project planner. Your task is to generate a succinct, accurate project plan in Markdown format.
--- HIGH-LEVEL CONTEXT ---
${context}
--------------------------
Generate a minimal project plan for "${name}".
${teamSizeInstruction}
${complexityInstruction}
- The WBS should be a bulleted list, 2 levels deep at most.
- The task list should have a maximum of 5 tasks, presented in chronological order.
- Each sprint should last 7-14 days.
- Do not include any introductory or concluding text. ${subcontractorMinimalInstruction}

CRITICAL INSTRUCTIONS:
- The project MUST start on or after ${projectStartDate}.
- All dates MUST be in YYYY-MM-DD format. Roles must be selected from the provided context.
- The "Tasks" table MUST include a "Duration (days)" column.
- The "Milestones" list MUST include 'Project Start', 'Sprint 1 Complete', and 'Project Completion'.

NOW, GENERATE THE MINIMAL PLAN. Your output must ONLY contain the markdown for "## WBS", "## Tasks" (with the header: ${subcontractorMinimalColumns}), and "## Milestones".`;
        }

        const subcontractorColumns = scope === 'subcontracted' ? `"Task Name", "Role", "Start Date (YYYY-MM-DD)", "End Date (YYYY-MM-DD)", "Duration (days)", "Dependencies", "Sprint", "Subcontractor"` : `"Task Name", "Role", "Start Date (YYYY-MM-DD)", "End Date (YYYY-MM-DD)", "Duration (days)", "Dependencies", "Sprint"`;

        return `You are an expert AI project planner. Your task is to generate a complete and parseable project plan in Markdown format. Adhere STRICTLY to all formatting instructions. Do not add any conversational text or explanations.
The project is named "${name}" in the "${discipline}" field. Use the high-level context below to infer deliverables and tasks.

--- HIGH-LEVEL CONTEXT ---
${context}
--------------------------

${teamSizeInstruction}
${complexityInstruction}
${subcontractorInstruction}
${sprintInstruction}

The task table must contain the following columns: ${subcontractorColumns}.

CRITICAL INSTRUCTIONS FOR PARSING AND CONTENT:
1.  **Project Start Date**: The entire project plan MUST begin on or after ${projectStartDate}. All task and milestone dates must be relative to this start date.
2.  **Dates**: All dates in the "Start Date" and "End Date" columns for both Tasks and Milestones MUST be in the exact "YYYY-MM-DD" format. Do not use any other format.
3.  **Duration**: The "Tasks" table MUST include a "Duration (days)" column.
4.  **Roles**: The "Role" for each task MUST be selected from the roles defined in the "Resources & Skills List" document provided in the context above.
5.  **Dependencies**: The "Dependencies" column must contain the exact "Task Name" of one or more preceding tasks, separated by commas, or be empty.
6.  **Markdown Format**: Adhere strictly to the Markdown table format for Tasks and Milestones, and a bulleted list for the WBS.
7.  **Discipline-Specific Content**: All generated content must use professional, industry-standard terminology specific to the '${discipline}' field.
8.  **Sprints**: ${sprintInstruction}
9.  **Sprint Duration**: 7-14 days.
10. **Logical Dependencies**: A task's "Dependencies" must ONLY list tasks that appear earlier in the table.
11. **Required Milestones**: 'Project Start', 'Preliminary Design Review Complete', Sprint completion milestones, 'Critical Design Review Complete', and 'Project Completion'.
12. **No Commentary**: Consist ONLY of the "## WBS", "## Tasks", and "## Milestones" sections.

## WBS
## Tasks
## Milestones
`;
    },
    phase8_sprintRequirements: (name, discipline, context, mode = 'fullscale', scope = 'internal', teamSize = 'medium', complexity = 'typical') => {
        // ... (Existing implementation)
        return PROMPTS.phase8_generic("Sprint Requirements", name, discipline, context, mode, scope, teamSize, complexity);
    },
    phase8_sprintPlanReview: (name, discipline, context, mode = 'fullscale', scope = 'internal', teamSize = 'medium', complexity = 'typical') => {
        // ... (Existing implementation)
        return PROMPTS.phase8_generic("Sprint Plan Review", name, discipline, context, mode, scope, teamSize, complexity);
    },
    phase8_criticalReview: (name, discipline, context, mode = 'fullscale', scope = 'internal', teamSize = 'medium', complexity = 'typical') => {
        // ... (Existing implementation)
        return PROMPTS.phase8_generic("Critical Review", name, discipline, context, mode, scope, teamSize, complexity);
    },
    phase8_generic: (docTitle, name, discipline, context, mode = 'fullscale', scope = 'internal', teamSize = 'medium', complexity = 'typical') => {
        const subcontractorInstruction = scope === 'subcontracted' ? `Ensure the content reflects the subcontracted nature of the project where relevant.` : '';
        const teamSizeInstruction = `The project team size is ${teamSize}. Scale the detail and complexity.`;
        const complexityInstruction = COMPLEXITY_INSTRUCTIONS[complexity];
        if (mode === 'minimal') {
            return `Generate succinct, accurate content for a document titled **"${docTitle}"** for project "${name}".
--- HIGH-LEVEL CONTEXT ---
${context}
-------------------------
${teamSizeInstruction} ${complexityInstruction} ${subcontractorInstruction}
OUTPUT RULE: Use ONLY short, accurate bullet points. Zero introductory or concluding filler. Maximise info density.`;
        }
        return `You are an expert project manager for the "${discipline}" field. Your task is to generate content for a document titled **"${docTitle}"** for the project "${name}". Structure the document with clear Markdown headings.
This document is part of Phase 8: Sprint & Critical Design Planning.

--- HIGH-LEVEL CONTEXT ---
${context}
--------------------------

${teamSizeInstruction}
${complexityInstruction}
${subcontractorInstruction}`;
    },
    genericDocumentPrompt: (docTitle, phase, name, discipline, context, mode = 'fullscale', scope = 'internal', teamSize = 'medium', complexity = 'typical') => {
        const subcontractorInstruction = scope === 'subcontracted' ? `Ensure the content reflects the subcontracted nature of the project where relevant.` : '';
        const teamSizeInstruction = `The project team size is ${teamSize}. Scale the detail and complexity.`;
        const complexityInstruction = COMPLEXITY_INSTRUCTIONS[complexity];
        const contextSection = context && context.trim() !== ''
            ? `--- HIGH-LEVEL CONTEXT ---\n${context}\n--------------------------\n\n`
            : 'There is no preceding context.\n\n';

        if (mode === 'minimal') {
            return `Generate succinct, accurate content for a document titled **"${docTitle}"** (Phase ${phase}) for project "${name}".
${contextSection}
${teamSizeInstruction} ${complexityInstruction} ${subcontractorInstruction}
OUTPUT RULE: Use ONLY accurate bullet points. Zero filler prose. Zero verbosity.`;
        }
        return `You are an expert project manager for the "${discipline}" field. Your task is to generate content for a document titled **"${docTitle}"** for the project "${name}". Analyze the document title and the provided project context to infer the document's purpose.
This document is part of Phase ${phase} of the project.

${contextSection}
${teamSizeInstruction}
${complexityInstruction}
${subcontractorInstruction}`;
    },
    phase9: (name, discipline, context, mode = 'fullscale', scope = 'internal', teamSize = 'medium', complexity = 'typical') => {
        const subcontractorInstruction = scope === 'subcontracted' ? 'The checklist must include a final sign-off from the subcontractor for their portion of the work.' : '';
        const teamSizeInstruction = `The team size is ${teamSize}.`;
        const complexityInstruction = COMPLEXITY_INSTRUCTIONS[complexity];
        if (mode === 'minimal') {
            return `Generate an accurate, succinct 3-point **Deployment Readiness** checklist for project "${name}".
--- HIGH-LEVEL CONTEXT ---
${context}
-------------------------
${teamSizeInstruction} ${complexityInstruction} ${subcontractorInstruction}
OUTPUT RULE: Bullet points only. Zero introductory or concluding filler. High technical accuracy.`;
        }
        return `You are a project manager. Your task is to generate a **Deployment Readiness Review** document for project "${name}".\n\n--- HIGH-LEVEL CONTEXT ---\n${context}\n-------------------------\n\nGenerate a Deployment Readiness Review checklist. ${teamSizeInstruction} ${complexityInstruction} ${subcontractorInstruction} This document should confirm that all development is complete. Finally, add a concluding statement that the project tracking tool should now be initialized with all data from the planning phases, marking the official start of the execution phase.`;
    },
    estimateChangeImpact: (projectName, discipline, totalBudget, changeRequest) => `
You are a project management cost and schedule estimation AI for a project named "${projectName}" in the "${discipline}" field. The total project budget is ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalBudget)}.

A change request has been submitted:
- Title: "${changeRequest.title}"
- Reason: "${changeRequest.reason}"

Based on this information, estimate the impact on the project's schedule (in full business days) and budget (in USD).
- Provide your response as a JSON object matching the required schema. Do not provide any explanation or surrounding text.
`,
    changeDeploymentPlan: (projectName, discipline, changeRequest, tasks, documents) => `
As an expert project manager for the project "${projectName}" in the "${discipline}" field, a change request has been submitted.
Change Request Title: "${changeRequest.title}"
Reason: "${changeRequest.reason}"
Estimated Impact: "${changeRequest.impactStr}"

Current Project State:
- There are ${tasks.length} tasks in the current plan.
- Key documents include: ${documents.map(d => d.title).join(', ')}.

Generate a Change Deployment Plan. Use the following strict Markdown format.

## Impact Analysis
- **Estimated Delay:** [Provide a quantitative estimate]
- **Disruption Impact:** [Describe the potential disruption]

## Affected Documents
[A bulleted list of document titles that require manual updates based on this change.]

## Task Modifications
[A list of task changes. Each line must start with 'ADD:', 'DELETE:', or 'EDIT:'. For 'ADD' and 'EDIT', provide task details in parentheses like this: (Start: YYYY-MM-DD, End: YYYY-MM-DD, Sprint: Sprint Name, Depends On: Task Name). For 'DELETE', just list the task name.]
`,
    analyzeRisks: (projectDataSummary, keyDocumentsContext) => `
You are an expert project risk analyst. Your task is to analyze the provided project data and identify the top 3 most critical risks to the project's success.

--- KEY PLANNING DOCUMENTS ---
${keyDocumentsContext}
----------------------------

--- CURRENT PROJECT STATE ---
${JSON.stringify(projectDataSummary, null, 2)}
-----------------------------

### 1. [Risk Title 1]
- **Impact:** [Description]
- **Mitigation:** [Suggestion]

### 2. [Risk Title 2]
- **Impact:** [Description]
- **Mitigation:** [Suggestion]

### 3. [Risk Title 3]
- **Impact:** [Description]
- **Mitigation:** [Suggestion]
`,
    selectBestArtifact: (docTitle, docContent, availableArtifacts) => `
You are an expert technical documentation specialist.
Document Title: "${docTitle}"
Document Content Summary: "${docContent.substring(0, 500)}..."

Available Graphical Artifacts:
${availableArtifacts.join(', ')}

Task: Select the SINGLE most appropriate graphical artifact type from the list above that would best visualize the content of this document.
If the document describes a process, choose "Flowchart" or "Process Map".
If it describes structure, choose "Architecture Diagram" or "Mind Map".
If it describes a schedule, choose "Gantt Chart Visualization".
If no artifact is strongly suitable, return "None".

OUTPUT: Provide ONLY the exact name of the artifact from the list. Do not add punctuation or explanation.
`,
    generateStatusSummary: (projectDataSummary, keyDocumentsContext) => `
You are a senior project manager writing a weekly status update for executive stakeholders. Your task is to generate a professional, concise summary based on the provided project data. The project is named "${projectDataSummary.name}".

--- KEY PLANNING DOCUMENTS ---
${keyDocumentsContext}
----------------------------

--- CURRENT PROJECT STATE ---
${JSON.stringify(projectDataSummary, null, 2)}
-----------------------------

## Project Status Summary: ${new Date().toLocaleDateString()}

### Overall Status
### Key Accomplishments (Last 7 Days)
### Upcoming Priorities (Next 7-14 Days)
### Budget Update
### Risks & Blockers
`,
    identifyUnknownTerms: (userInput: string) => `
You are a linguistic analyzer. Your task is to identify any words or terms in the following text that are potentially unknown, ambiguous, or highly specific (e.g., technical jargon, made-up words, or rare proper nouns).
Text: "${userInput}"

If you find any such terms, return them as a JSON array of strings. 
If no such terms are found, return an empty JSON array [].
Return ONLY the JSON array. Do not include any explanation or markdown.
`,
    getDefinitions: (terms: string[]) => `
Provide concise definitions for the following terms: ${terms.join(', ')}.
Use Google Search if necessary to find accurate information.
Return the definitions as a bulleted list.
`
};
