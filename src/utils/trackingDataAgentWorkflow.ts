
import { Type } from "@google/genai";
import { Project, Task, Milestone } from '../types';
import { PROMPTS } from '../constants/projectData';
import { getGeminiClient } from './geminiClient';

// Helper to ensure valid JSON string is extracted if model adds backticks
const cleanJson = (text: string) => {
    return text.replace(/```json/g, '').replace(/```/g, '').trim();
};

export const executeTrackingDataWorkflow = async (
    project: Project,
    onProgress: (msg: string) => void
): Promise<{ tasks: Task[]; milestones: Milestone[]; roles: string[] }> => {
    const ai = getGeminiClient();
    const model = 'gemini-3-flash-preview';

    onProgress("Agent 1/4 (Extractor): Analyzing project documentation...");
    
    // Gather Context
    const wbsDoc = project.documents.find(d => 
        d.title.toLowerCase().includes("detailed plans") || 
        d.title.toLowerCase().includes("wbs")
    );
    const context = (wbsDoc && project.phasesData[wbsDoc.id]?.content) 
        ? project.phasesData[wbsDoc.id].content 
        : "No detailed plan content found.";

    if (context === "No detailed plan content found.") {
        throw new Error("Cannot generate timeline: 'Detailed Plans (WBS/WRS)' document is missing or empty.");
    }

    // STEP 1: EXTRACTION AGENT
    const extractSchema = {
        type: Type.OBJECT,
        properties: {
            tasks: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        role: { type: Type.STRING },
                        duration: { type: Type.NUMBER },
                        dependencies: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ['name', 'role', 'duration']
                }
            },
            milestones: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING }
                    },
                    required: ['name']
                }
            },
            roles: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['tasks', 'milestones', 'roles']
    };

    const extractorRes = await ai.models.generateContent({
        model,
        contents: PROMPTS.timelineExtractor(context, project),
        config: { 
            responseMimeType: "application/json", 
            responseSchema: extractSchema,
            thinkingConfig: { thinkingBudget: 0 }
        }
    });

    let extractedData;
    try {
        extractedData = JSON.parse(cleanJson(extractorRes.text || "{}"));
    } catch (e) {
        console.error("Extraction JSON parse failed", e);
        throw new Error("Failed to parse extracted plan data.");
    }

    // STEP 2: QA AGENT (JSON & LOGIC CHECK 1)
    onProgress("Agent 2/4 (QA): Validating extraction integrity...");
    // We re-use extractSchema here to ensure structure is maintained before scheduling
    const qa1Res = await ai.models.generateContent({
        model,
        contents: PROMPTS.jsonQA(JSON.stringify(extractedData), "Valid list of tasks, milestones, and roles. IDs must be unique."),
        config: { 
            responseMimeType: "application/json", 
            responseSchema: extractSchema,
            thinkingConfig: { thinkingBudget: 0 }
        }
    });
    
    try {
        extractedData = JSON.parse(cleanJson(qa1Res.text || "{}"));
    } catch (e) {
        console.warn("QA1 JSON parse failed, falling back to extractor output.");
    }

    // STEP 3: SCHEDULER AGENT (SERIAL EXECUTION LOGIC)
    onProgress("Agent 3/4 (Scheduler): Optimizing workflow & calculating serial dates...");
    
    const scheduleSchema = {
        type: Type.OBJECT,
        properties: {
            tasks: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        role: { type: Type.STRING },
                        startDate: { type: Type.STRING },
                        endDate: { type: Type.STRING },
                        dependencies: { type: Type.ARRAY, items: { type: Type.STRING } },
                        sprint: { type: Type.STRING }
                    },
                    required: ['name', 'startDate', 'endDate', 'sprint']
                }
            },
            milestones: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        name: { type: Type.STRING },
                        date: { type: Type.STRING }
                    },
                    required: ['name', 'date']
                }
            },
            roles: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ['tasks', 'milestones']
    };

    const schedulerRes = await ai.models.generateContent({
        model,
        contents: PROMPTS.timelineScheduler(JSON.stringify(extractedData), project.startDate),
        config: { 
            responseMimeType: "application/json", 
            responseSchema: scheduleSchema,
            thinkingConfig: { thinkingBudget: 0 }
        }
    });

    let scheduledData;
    try {
        scheduledData = JSON.parse(cleanJson(schedulerRes.text || "{}"));
    } catch (e) {
        console.error("Scheduler JSON parse failed", e);
        throw new Error("Failed to parse scheduled plan data.");
    }

    // STEP 4: QA AGENT (FINAL VALIDATION)
    onProgress("Agent 4/4 (QA): Final validation of timeline logic...");
    const qa2Res = await ai.models.generateContent({
        model,
        contents: PROMPTS.jsonQA(JSON.stringify(scheduledData), "Valid project schedule. Task EndDate must be >= StartDate. No overlapping tasks for same role."),
        config: { 
            responseMimeType: "application/json", 
            responseSchema: scheduleSchema,
            thinkingConfig: { thinkingBudget: 0 }
        }
    });
    
    try {
        scheduledData = JSON.parse(cleanJson(qa2Res.text || "{}"));
    } catch (e) {
        console.warn("QA2 JSON parse failed, falling back to scheduler output.");
    }

    // Final Transformation to Application Types
    const finalTasks: Task[] = (scheduledData.tasks || []).map((t: any, i: number) => ({
        id: t.id || `task-${Date.now()}-${i}`,
        name: t.name,
        role: t.role,
        startDate: t.startDate,
        endDate: t.endDate,
        status: 'todo',
        sprintId: t.sprint ? t.sprint.toLowerCase().replace(/\s/g, '') : 'sprint1',
        dependsOn: t.dependencies || [],
        isSubcontracted: false,
        comments: [],
        attachments: [],
        actualTime: null,
        actualCost: null,
        actualEndDate: null
    }));

    const finalMilestones: Milestone[] = (scheduledData.milestones || []).map((m: any, i: number) => ({
        id: m.id || `milestone-${Date.now()}-${i}`,
        name: m.name,
        plannedDate: m.date,
        status: 'Planned'
    }));
    
    // Ensure roles are passed through from the scheduler/extractor if available
    // Note: The scheduler schema includes 'roles' but the model might not populate it if not strictly asked.
    // We fall back to extraction data if needed.
    const finalRoles: string[] = scheduledData.roles || extractedData.roles || [];

    return { tasks: finalTasks, milestones: finalMilestones, roles: finalRoles };
};
