
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Project, Task, Notification, User, Milestone, Document } from '../types';
import { PHASES, PROMPTS, GRAPHICAL_ARTIFACTS } from '../constants/projectData';
import { DashboardView } from '../tools/DashboardView';
import { ProjectPhasesView } from './ProjectPhasesView';
import { DocumentsView } from '../tools/DocumentsView';
import { ProjectTrackingView } from '../tools/ProjectTrackingView';
import { RevisionControlView } from '../tools/RevisionControlView';
import { DownloadModal } from '../components/DownloadModal';
import { logAction } from '../utils/logging';
import { TaskDetailModal } from '../components/TaskDetailModal';
import { AiReportModal } from '../components/AiReportModal';
import { parseMarkdownTable, parseRolesFromMarkdown, parseResourcesFromMarkdown } from '../utils/be-logic';
import { executeTrackingDataWorkflow } from '../utils/trackingDataAgentWorkflow';
import { getGeminiClient } from '../utils/geminiClient';

async function withRetry<T>(fn: () => Promise<T>, retries = 2, delay = 1000): Promise<T> {
    let lastError: Error | any = new Error("Unknown error");
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            console.warn(`Attempt ${i + 1} failed. Retrying...`, error);
            if (error?.message?.includes("API_KEY_INVALID") || error?.message?.includes("safety")) {
                throw error;
            }
            if (i < retries - 1) {
                await new Promise(res => setTimeout(res, delay * Math.pow(2, i)));
            }
        }
    }
    throw lastError;
};

const getPromptFunction = (docTitle: string, phase: number) => {
    const title = docTitle.toLowerCase();
    if (phase === 1 && title.includes('concept proposal')) return PROMPTS.phase1;
    if (title.includes('resources & skills')) return PROMPTS.phase2;
    if (title.includes('swot') || title.includes('risk analysis')) return PROMPTS.phase3;
    if (title.includes('kickoff briefing')) return PROMPTS.phase4;
    if (title.includes('statement of work') || title.includes('sow')) return PROMPTS.phase5;
    if (title.includes('preliminary review')) return PROMPTS.phase6;
    if (title.includes('detailed plans')) return PROMPTS.phase7;
    
    if (phase === 8) {
        if (title.includes('sprint requirements') || title.includes('user story backlog')) return PROMPTS.phase8_sprintRequirements;
        if (title.includes('sprint plan review')) return PROMPTS.phase8_sprintPlanReview;
        if (title.includes('critical review')) return PROMPTS.phase8_criticalReview;
        return (name: string, disc: string, ctx: string, mode: any, scope: any, team: any, comp: any) => PROMPTS.phase8_generic(docTitle, name, disc, ctx, mode, scope, team, comp);
    }
    
    if (phase === 9) return PROMPTS.phase9;

    return (name: string, disc: string, ctx: string, mode: any, scope: any, team: any, comp: any) => PROMPTS.genericDocumentPrompt(docTitle, phase, name, disc, ctx, mode, scope, team, comp);
}

const getRelevantContext = (docToGenerate: any, allDocuments: any[], allPhasesData: any) => {
    const sortedDocuments = [...allDocuments]
        .filter(d => d.type !== 'image')
        .sort((a, b) => a.phase - b.phase || (a.sequence || 1) - (b.sequence || 1));
    const currentIndex = sortedDocuments.findIndex(d => d.id === docToGenerate.id);
    const firstDoc = sortedDocuments[0];
    const firstDocPhaseData = firstDoc ? allPhasesData[firstDoc.id] : null;
    const firstDocContext = (firstDoc && (firstDoc.status === 'Approved' || firstDoc.phase === 1) && firstDocPhaseData?.compactedContent) ? firstDocPhaseData.compactedContent : '';
    const prevDoc = currentIndex > 0 ? sortedDocuments[currentIndex - 1] : null;
    const prevDocPhaseData = prevDoc ? allPhasesData[prevDoc.id] : null;
    const prevDocContext = (prevDoc && (prevDoc.status === 'Approved' || (prevDocPhaseData?.content && prevDocPhaseData.content.length > 50)) && prevDocPhaseData?.compactedContent) ? prevDocPhaseData.compactedContent : '';
    return { firstDocContext, prevDocContext };
};

const MAX_PAYLOAD_CHARS = 25000;
const truncatePrompt = (prompt: string): string => {
    if (prompt.length <= MAX_PAYLOAD_CHARS) return prompt;
    return prompt.substring(0, MAX_PAYLOAD_CHARS) + "\n...[PROMPT TRUNCATED]...";
};

export const ProjectDashboard: React.FC<{ project: Project; onBack: () => void; saveProject: (project: Project) => void; currentUser: User; key?: number; }> = ({ project, onBack, saveProject, currentUser }) => {
    const [projectData, setProjectData] = useState<Project>({ ...project });
    const [loadingPhase, setLoadingPhase] = useState<{ docId: string | null; step: string | null }>({ docId: null, step: null });
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('Project Phases');
    useEffect(() => {
        setError('');
    }, [activeTab]);
    const [isAutoGenerating, setIsAutoGenerating] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [aiReport, setAiReport] = useState({ title: '', content: '', isOpen: false });
    const [isGeneratingReport, setIsGeneratingReport] = useState<'risk' | 'summary' | null>(null);
    const [isBasicPlanRunning, setIsBasicPlanRunning] = useState(false);
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
    const [zipBlob, setZipBlob] = useState<Blob | null>(null);
    const isProcessingRef = useRef(false);

    const projectDataRef = useRef(projectData);
    useEffect(() => { projectDataRef.current = projectData; }, [projectData]);

    useEffect(() => {
        // Only reset local state if the project ID has changed (switching projects)
        // This prevents local updates from being overwritten by stale props during saves
        if (project.id !== projectDataRef.current.id) {
            setProjectData(project);
        }
    }, [project.id]);

    const projectPhases = useMemo(() => {
        return [...projectData.documents]
            .filter(d => d.type !== 'image')
            .sort((a, b) => (a.phase - b.phase) || (a.sequence - b.sequence))
            .map(doc => ({
                id: doc.id,
                title: doc.title,
                description: PHASES.find(p => parseInt(p.id.replace('phase', '')) === doc.phase)?.description || '',
                originalPhaseId: `phase${doc.phase}`
            }));
    }, [projectData.documents]);

    const handleSave = useCallback((update: Partial<Project> | ((prev: Project) => Partial<Project>)) => {
        const prevData = projectDataRef.current;
        const dataToMerge = typeof update === 'function' ? update(prevData) : update;
        const newState = { ...prevData, ...dataToMerge };
        
        projectDataRef.current = newState;
        setProjectData(newState);
        saveProject(newState);
    }, [saveProject]);

    const handleTabChange = useCallback((tabName: string) => {
        setActiveTab(tabName);
        localStorage.setItem(`hmap-active-tab-${project.id}`, tabName);
    }, [project.id]);

    useEffect(() => {
        const savedTab = localStorage.getItem(`hmap-active-tab-${project.id}`);
        setActiveTab(savedTab || 'Project Phases');
    }, [project.id]);

    const handleGenerateImages = useCallback(async (docId: string, artifacts: string[], textContent: string, bypassLock = false) => {
        if (artifacts.length === 0) return;
        if (isProcessingRef.current && !bypassLock) return;
        
        if (!bypassLock) isProcessingRef.current = true;
        const ai = getGeminiClient();
        const parentDoc = projectDataRef.current.documents.find(d => d.id === docId);
        if (!parentDoc) {
            if (!bypassLock) isProcessingRef.current = false;
            return;
        }

        setLoadingPhase({ docId, step: 'imaging' });
        try {
            const generatedImages: string[] = [];
            const artifactDocs: Document[] = [];

            for (const artifact of artifacts) {
                // Robust prompt generation
                let contextText = textContent;
                if (!contextText || contextText.length < 50) {
                    contextText = `Project: ${projectDataRef.current.name}. Description: ${projectDataRef.current.discipline} project. Phase: ${parentDoc.title}.`;
                }
                
                const prompt = `Generate a professional technical ${artifact} for a project named "${projectDataRef.current.name}". 
                Context: ${contextText.substring(0, 500)}. 
                Style: High-quality, detailed, schematic, professional diagram. 
                Requirements: Clear lines, legible text if any, modern technical aesthetic.`;
                
                console.log(`Generating image for ${artifact} with prompt length: ${prompt.length}`);

                const result = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                    model: 'gemini-2.5-flash-image',
                    contents: { parts: [{ text: prompt }] },
                    config: { imageConfig: { aspectRatio: "16:9" } }
                }));
                
                const firstCandidate = result.candidates?.[0];
                if (!firstCandidate) {
                    console.warn("No candidates returned for image generation");
                    continue;
                }

                let imageFound = false;
                for (const part of firstCandidate.content.parts) {
                    if (part.inlineData) {
                        const dataUrl = `data:image/png;base64,${part.inlineData.data}`;
                        generatedImages.push(dataUrl);
                        artifactDocs.push({
                            id: `artifact-${docId}-${artifact.toLowerCase().replace(/\s/g, '-')}-${Date.now()}`,
                            title: `${parentDoc.title} - ${artifact}`,
                            version: 'v1.0', status: 'Working', owner: currentUser.username,
                            phase: parentDoc.phase, sequence: parentDoc.sequence + 1, type: 'image', parentDocId: docId,
                            metadata: { created: new Date().toISOString(), artifactType: artifact }
                        });
                        imageFound = true;
                    }
                }
                
                if (!imageFound) {
                    console.warn("No inlineData found in response parts", firstCandidate.content.parts);
                }
            }

            if (generatedImages.length > 0) {
                handleSave(prev => {
                    const otherDocs = prev.documents.filter(d => d.parentDocId !== docId || d.type !== 'image');
                    const newPhasesData = { ...prev.phasesData };
                    newPhasesData[docId] = { ...newPhasesData[docId], images: generatedImages, selectedArtifacts: artifacts };
                    artifactDocs.forEach((aDoc, idx) => { newPhasesData[aDoc.id] = { content: generatedImages[idx] }; });
                    return { documents: [...otherDocs, ...artifactDocs], phasesData: newPhasesData };
                });
            } else {
                setError("No images could be generated. Please try again.");
            }
        } catch (err: any) {
            console.error("Image generation failed:", err);
            setError(`Image generation failed: ${err.message}`);
        } finally {
            // Only clear loading state if we are not in a larger flow (or if we want to show 'imaging' specifically)
            // Actually, we should clear 'imaging' status regardless, but maybe not the lock if bypassed.
            if (!bypassLock) {
                 setLoadingPhase({ docId: null, step: null });
                 isProcessingRef.current = false;
            } else {
                // If bypassing lock, we restore the previous step or just clear the step but keep the lock?
                // The caller (handleGenerateContent) will clear the lock and step in its finally block.
                // But we might want to update the UI to show we are done with imaging.
                // Let's just not clear the lock.
            }
        }
    }, [handleSave, currentUser.username]);

    const handleGenerateContent = useCallback(async (docId: string, userInput: string, projectStateOverride?: Project) => {
        // Allow auto-pilot recursive calls to proceed if they are part of the same flow, 
        // but block manual concurrent calls. 
        // Since isAutoGenerating controls the loop, this check effectively debounces manual clicks.
        if (isProcessingRef.current && !isAutoGenerating) {
            console.warn("Generation in progress");
            return { success: false, newContent: null, newCompactedContent: null };
        }

        const ai = getGeminiClient();
        const currentProjectData = projectStateOverride || projectDataRef.current;
        const docToGenerate = currentProjectData.documents.find(d => d.id === docId);
        if (!docToGenerate) return { success: false, newContent: null, newCompactedContent: null };

        isProcessingRef.current = true;
        setLoadingPhase({ docId, step: 'generating' });
        setError('');
        try {
            const { firstDocContext, prevDocContext } = getRelevantContext(docToGenerate, currentProjectData.documents, currentProjectData.phasesData);
            
            // --- Term Checking Logic ---
            let enrichedUserInput = userInput;
            if (docToGenerate.phase === 1 && userInput && userInput.trim().length > 0) {
                setLoadingPhase({ docId, step: 'checking terms' });
                try {
                    const termResult = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                        model: 'gemini-3-flash-preview',
                        contents: PROMPTS.identifyUnknownTerms(userInput),
                        config: { responseMimeType: 'application/json' }
                    }));
                    const unknownTerms = JSON.parse(termResult.text || '[]');
                    if (unknownTerms.length > 0) {
                        setLoadingPhase({ docId, step: 'searching definitions' });
                        const defResult = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                            model: 'gemini-3-flash-preview',
                            contents: PROMPTS.getDefinitions(unknownTerms),
                            config: { tools: [{ googleSearch: {} }] }
                        }));
                        const definitions = defResult.text || '';
                        if (definitions) {
                            enrichedUserInput = `--- DEFINITIONS FOR UNKNOWN TERMS ---\n${definitions}\n--------------------------------------\n\n${userInput}`;
                        }
                    }
                } catch (e) {
                    console.warn("Term checking/searching failed", e);
                }
            }

            setLoadingPhase({ docId, step: 'generating' });
            const promptFn = getPromptFunction(docToGenerate.title, docToGenerate.phase);
            const primaryInput = docToGenerate.phase === 1 ? (enrichedUserInput || "Starting documentation") : (`${firstDocContext}\n\n${prevDocContext}`.trim() || userInput);
            const promptText = promptFn(
                currentProjectData.name, 
                currentProjectData.discipline, 
                primaryInput, 
                currentProjectData.mode || 'fullscale', 
                currentProjectData.scope || 'internal', 
                currentProjectData.teamSize || 'medium', 
                currentProjectData.complexity || 'typical'
            );

            console.log(`Generating content for ${docToGenerate.title} (Phase ${docToGenerate.phase}) with prompt length: ${promptText.length}`);

            const result = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({ 
                model: 'gemini-3-flash-preview', contents: truncatePrompt(promptText),
                config: { temperature: 0.7, thinkingConfig: { thinkingBudget: 0 } }
            }));
            const newContent = result.text || '';
            if (!newContent) throw new Error("Empty response.");

            setLoadingPhase({ docId, step: 'compacting' });
            const compactRes = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({ 
                model: 'gemini-3-flash-preview', contents: PROMPTS.compactContent(newContent),
                config: { thinkingConfig: { thinkingBudget: 0 } }
            }));
            const newCompacted = compactRes.text || newContent.substring(0, 500);

            // --- Auto-Select and Generate Artifact ---
            let selectedArtifacts: string[] = [];
            try {
                const artifactRes = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({
                    model: 'gemini-3-flash-preview',
                    contents: PROMPTS.selectBestArtifact(docToGenerate.title, newContent, GRAPHICAL_ARTIFACTS)
                }));
                let bestArtifact = artifactRes.text?.trim() || '';
                // Clean up response (remove quotes, periods)
                bestArtifact = bestArtifact.replace(/['".]/g, '');
                
                // Find matching artifact (case-insensitive)
                const match = GRAPHICAL_ARTIFACTS.find(a => a.toLowerCase() === bestArtifact.toLowerCase());
                
                if (match) {
                    selectedArtifacts = [match];
                    console.log(`Auto-selected artifact for ${docToGenerate.title}: ${match}`);
                } else {
                    console.log(`No matching artifact found for response: "${bestArtifact}"`);
                }
            } catch (e) {
                console.warn("Failed to auto-select artifact", e);
            }
            
            // Save content first
            handleSave(prev => ({ phasesData: { ...prev.phasesData, [docId]: { ...(prev.phasesData[docId] || {}), content: newContent, compactedContent: newCompacted, selectedArtifacts } } }));
            
            // Trigger image generation if an artifact was selected
            if (selectedArtifacts.length > 0) {
                 await handleGenerateImages(docId, selectedArtifacts, newContent, true);
            }

            return { success: true, newContent, newCompactedContent: newCompacted };
        } catch (err: any) {
            setError(`AI Error: ${err.message}`);
            return { success: false, newContent: null, newCompactedContent: null };
        } finally {
            setLoadingPhase({ docId: null, step: null });
            isProcessingRef.current = false;
        }
    }, [handleSave, isAutoGenerating]);

    const handleUpdatePhaseData = useCallback(async (docId: string, content: string) => {
        handleSave(prev => ({ phasesData: { ...prev.phasesData, [docId]: { ...(prev.phasesData[docId] || {}), content } } }));
        const currentData = projectDataRef.current.phasesData[docId];
        if (currentData?.selectedArtifacts?.length) await handleGenerateImages(docId, currentData.selectedArtifacts, content);
    }, [handleSave, handleGenerateImages]);

    const handleChatToChange = useCallback(async (docId: string, userInstruction: string) => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        
        const ai = getGeminiClient();
        const currentContent = projectDataRef.current.phasesData[docId]?.content || '';
        setLoadingPhase({ docId, step: 'generating' });
        setError('');
        try {
            const prompt = `Modify this project document: "${userInstruction}".\n\nOriginal:\n${currentContent}`;
            const result = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
            const newContent = result.text || '';
            const compactRes = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: PROMPTS.compactContent(newContent) });
            handleSave(prev => ({ phasesData: { ...prev.phasesData, [docId]: { ...(prev.phasesData[docId] || {}), content: newContent, compactedContent: compactRes.text } } }));
        } catch (e: any) { setError(`Instruction failed: ${e.message}`); }
        finally { 
            setLoadingPhase({ docId: null, step: null }); 
            isProcessingRef.current = false;
        }
    }, [handleSave]);

    const handleCompletePhase = useCallback((docId: string) => {
        const doc = projectDataRef.current.documents.find(d => d.id === docId);
        const content = projectDataRef.current.phasesData[docId]?.content || '';
        
        handleSave(prev => {
            const updatedDocs = prev.documents.map(d => d.id === docId ? { ...d, status: 'Approved' } : d);
            let updatedTeam = prev.team;
            let updatedResources = prev.resources;

            if (doc?.title === 'Resources & Skills List') {
                const roles = parseRolesFromMarkdown(content);
                const resources = parseResourcesFromMarkdown(content);

                // Map roles to TeamMember objects
                const newTeamMembers = roles.map(role => ({
                    userId: `role-${role.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substring(2, 5)}`,
                    role,
                    name: role,
                    email: `${role.toLowerCase().replace(/\s+/g, '.')}@project.local`,
                    isLeader: role.toLowerCase().includes('manager') || role.toLowerCase().includes('lead')
                }));

                // Map resources to Resource objects
                const newResources = resources.map(res => ({
                    id: `res-${res.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substring(2, 5)}`,
                    name: res,
                    type: 'physical' as const,
                    unitCost: 0,
                    quantity: 1,
                    totalCost: 0
                }));

                // Filter out duplicates
                const filteredNewTeam = newTeamMembers.filter(nm => !prev.team.some(tm => tm.role === nm.role));
                const filteredNewResources = newResources.filter(nr => !prev.resources.some(r => r.name === nr.name));

                updatedTeam = [...prev.team, ...filteredNewTeam];
                updatedResources = [...prev.resources, ...filteredNewResources];
            }

            return { 
                documents: updatedDocs,
                team: updatedTeam,
                resources: updatedResources
            };
        });
    }, [handleSave]);

    const handleAttachFile = useCallback((docId: string, file: { name: string, data: string }) => {
        handleSave(prev => ({ phasesData: { ...prev.phasesData, [docId]: { ...(prev.phasesData[docId] || {}), attachments: [...(prev.phasesData[docId]?.attachments || []), file] } } }));
    }, [handleSave]);

    const handleRemoveAttachment = useCallback((docId: string, fileName: string) => {
        handleSave(prev => ({ phasesData: { ...prev.phasesData, [docId]: { ...(prev.phasesData[docId] || {}), attachments: (prev.phasesData[docId]?.attachments || []).filter(a => a.name !== fileName) } } }));
    }, [handleSave]);

    const handleSetGenerationMode = (mode: 'manual' | 'automatic') => handleSave({ generationMode: mode });

    const handleBasicPlan = useCallback(async () => {
        if (isBasicPlanRunning || isProcessingRef.current) return;
        setIsBasicPlanRunning(true);
        setError('');
        try {
            let state = { ...projectDataRef.current };
            const docs = [...state.documents].filter(d => d.type !== 'image').sort((a, b) => a.phase - b.phase || (a.sequence || 1) - (b.sequence || 1));
            
            for (const doc of docs) {
                if (doc.status === 'Approved') continue;
                // Use a slightly longer delay to ensure stability
                await new Promise(r => setTimeout(r, 500));
                const res = await handleGenerateContent(doc.id, '', state);
                if (!res.success) break;
                handleCompletePhase(doc.id);
                
                // Update local state for next iteration
                state = { 
                    ...state, 
                    documents: state.documents.map(d => d.id === doc.id ? { ...d, status: 'Approved' } : d), 
                    phasesData: { 
                        ...state.phasesData, 
                        [doc.id]: { 
                            ...state.phasesData[doc.id], 
                            content: res.newContent, 
                            compactedContent: res.newCompactedContent 
                        } 
                    } 
                };
            }

            // All generated. Now create ZIP.
            const JSZipModule = await import('jszip');
            const JSZip = JSZipModule.default;
            const zip = new JSZip();
            
            const finalState = projectDataRef.current;
            const finalDocs = finalState.documents;
            const finalPhasesData = finalState.phasesData;

            finalDocs.forEach(doc => {
                const data = finalPhasesData[doc.id];
                if (doc.type === 'image') {
                    const base64Data = data?.content?.split(',')[1];
                    if (base64Data) {
                        zip.file(`${doc.title.replace(/[^a-z0-9]/gi, '_')}.png`, base64Data, { base64: true });
                    }
                } else {
                    zip.file(`${doc.title.replace(/[^a-z0-9]/gi, '_')}.md`, data?.content || '');
                }
            });

            const blob = await zip.generateAsync({ type: 'blob' });
            setZipBlob(blob);
            setIsDownloadModalOpen(true);
            
            // Mark as started/complete to unlock everything
            handleSave({ isStarted: true });
        } catch (e: any) {
            console.error("Basic Plan Error:", e);
            setError("Basic Plan generation failed: " + e.message);
        } finally {
            setIsBasicPlanRunning(false);
        }
    }, [handleGenerateContent, handleCompletePhase, handleSave]);

    const runAutomaticGeneration = useCallback(async () => {
        if (isAutoGenerating || isProcessingRef.current) return;
        setIsAutoGenerating(true);
        // Note: We don't set isProcessingRef to true here because the loop calls handleGenerateContent which manages the lock.
        // However, handleGenerateContent checks !isAutoGenerating to allow recursive calls. 
        setError('');
        try {
            let state = { ...projectDataRef.current };
            const docs = [...state.documents].filter(d => d.type !== 'image').sort((a, b) => a.phase - b.phase || (a.sequence || 1) - (b.sequence || 1));
            for (const doc of docs) {
                if (doc.status === 'Approved') continue;
                const res = await handleGenerateContent(doc.id, '', state);
                if (!res.success) break;
                handleCompletePhase(doc.id);
                state = { ...state, documents: state.documents.map(d => d.id === doc.id ? { ...d, status: 'Approved' } : d), phasesData: { ...state.phasesData, [doc.id]: { ...state.phasesData[doc.id], content: res.newContent, compactedContent: res.newCompactedContent } } };
                await new Promise(r => setTimeout(r, 2000));
            }
        } finally { setIsAutoGenerating(false); }
    }, [handleGenerateContent, handleCompletePhase, isAutoGenerating]);

    useEffect(() => { if (projectData.generationMode === 'automatic' && !isAutoGenerating) runAutomaticGeneration(); }, [projectData.generationMode, isAutoGenerating, runAutomaticGeneration]);

    const generateAgentPlan = useCallback(async () => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        setLoadingPhase({ docId: 'agent', step: 'Planner Agent: Processing...' });
        try {
            const { tasks, milestones } = await executeTrackingDataWorkflow(projectData, (msg) => setLoadingPhase({ docId: 'agent', step: msg }));
            handleSave({ tasks, milestones, isStarted: true });
            handleTabChange('Project Tracking');
        } catch (e: any) { setError("Agentic planning failed: " + e.message); }
        finally { 
            setLoadingPhase({ docId: null, step: null }); 
            isProcessingRef.current = false;
        }
    }, [projectData, handleSave, handleTabChange]);

    const handleUpdateTask = (taskId: string, update: Partial<Task>) => {
        handleSave(prev => {
            const newTasks = prev.tasks.map(t => t.id === taskId ? { ...t, ...update } : t);
            const updatedTask = newTasks.find(t => t.id === taskId);
            
            // Sync with Milestones if status changed
            let newMilestones = prev.milestones;
            if (update.status && updatedTask) {
                newMilestones = prev.milestones.map(m => {
                    if (m.name === updatedTask.name) {
                        return { ...m, status: update.status as any };
                    }
                    return m;
                });
            }

            const newNotifications = [...(prev.notifications || [])];

            if (update.status === 'done' && updatedTask) {
                newTasks.forEach(t => {
                    if (t.dependsOn.includes(taskId)) {
                        const isNowUnblocked = t.dependsOn.every(depId => newTasks.find(dt => dt.id === depId)?.status === 'done');
                        if (isNowUnblocked) {
                            newNotifications.push({
                                id: `notif-${Date.now()}-${t.id}`,
                                timestamp: new Date().toISOString(),
                                recipientId: t.role || 'Unassigned',
                                text: `Task "${t.name}" is now unblocked and ready for work!`,
                                read: false, taskId: t.id
                            });
                        }
                    }
                });
            }
            return { tasks: newTasks, milestones: newMilestones, notifications: newNotifications };
        });
    };

    const handleUpdateMilestone = (mId: string, update: Partial<Milestone>) => {
        handleSave(prev => {
            const newMilestones = prev.milestones.map(m => m.id === mId ? { ...m, ...update } : m);
            const updatedMilestone = newMilestones.find(m => m.id === mId);

            // Sync with Tasks if status changed
            let newTasks = prev.tasks;
            if (update.status && updatedMilestone) {
                newTasks = prev.tasks.map(t => {
                    if (t.name === updatedMilestone.name) {
                        return { ...t, status: update.status as any };
                    }
                    return t;
                });
            }

            return { milestones: newMilestones, tasks: newTasks };
        });
    };

    const [isEstimatingCosts, setIsEstimatingCosts] = useState(false);

    const handleEstimateCosts = useCallback(async () => {
        if (isEstimatingCosts) return;
        setIsEstimatingCosts(true);
        const ai = getGeminiClient();
        
        try {
            const resourceNames = projectData.resources.map(r => r.name);
            const prompt = `You are a project manager. Estimate the costs for the following resources for a project titled "${projectData.name}".
            Project Description: ${projectData.discipline} project.
            Resources: ${JSON.stringify(resourceNames)}
            
            For each resource:
            1. Determine if it is 'human' or 'physical'.
            2. If 'human', estimate a typical hourly rate (unitCost) and total hours needed (quantity) based on the project scope.
            3. If 'physical', estimate the purchase price (unitCost) and quantity needed.
            
            Return a JSON array of objects with these exact keys: { "name": string, "type": "human" | "physical", "unitCost": number, "quantity": number }.
            Ensure reasonable estimates. Return ONLY the JSON array.`;

            const result = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });

            const estimates = JSON.parse(result.text || '[]');
            
            handleSave(prev => {
                const updatedResources = prev.resources.map(r => {
                    const estimate = estimates.find((e: any) => e.name === r.name);
                    if (estimate) {
                        return {
                            ...r,
                            type: estimate.type,
                            unitCost: estimate.unitCost,
                            quantity: estimate.quantity,
                            totalCost: estimate.unitCost * estimate.quantity
                        };
                    }
                    return r;
                });
                
                const totalBudget = updatedResources.reduce((sum, r) => sum + (r.totalCost || 0), 0);
                return { resources: updatedResources, budget: totalBudget };
            });

        } catch (e: any) {
            console.error("Cost estimation failed", e);
            setError(`Cost estimation failed: ${e.message}`);
        } finally {
            setIsEstimatingCosts(false);
        }
    }, [projectData.name, projectData.discipline, projectData.resources, handleSave, isEstimatingCosts]);

    const handleAnalyzeRisks = async () => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        const ai = getGeminiClient();
        setIsGeneratingReport('risk');
        setError('');
        try {
            const context = projectPhases.slice(0, 8).map(p => {
                const data = projectData.phasesData[p.id];
                return data?.compactedContent || data?.content?.substring(0, 200) || '';
            }).filter(c => c.length > 0).join('\n\n');

            const projectSummary = {
                name: projectData.name,
                discipline: projectData.discipline,
                budget: projectData.budget,
                teamSize: projectData.team.length,
                tasksCount: projectData.tasks.length,
                milestonesCount: projectData.milestones.length,
                progress: projectData.tasks.length > 0 ? Math.round((projectData.tasks.filter(t => t.status === 'done').length / projectData.tasks.length) * 100) : 0
            };

            const prompt = PROMPTS.analyzeRisks(projectSummary, context);
            const res = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({ 
                model: 'gemini-3-flash-preview', 
                contents: truncatePrompt(prompt) 
            }));
            
            const content = res.text || '';
            if (!content) throw new Error("AI returned an empty report.");
            
            setAiReport({ title: 'Deep Risk Audit', content, isOpen: true });
        } catch (e: any) { 
            console.error('Risk analysis failed:', e);
            setError(`Risk analysis failed: ${e.message}`); 
        } finally { 
            setIsGeneratingReport(null); 
            isProcessingRef.current = false;
        }
    };

    const handleGenerateSummary = async () => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        const ai = getGeminiClient();
        setIsGeneratingReport('summary');
        setError('');
        try {
            const context = projectPhases.slice(0, 8).map(p => {
                const data = projectData.phasesData[p.id];
                return data?.compactedContent || data?.content?.substring(0, 200) || '';
            }).filter(c => c.length > 0).join('\n\n');

            const projectSummary = {
                name: projectData.name,
                discipline: projectData.discipline,
                budget: projectData.budget,
                team: projectData.team.map(t => ({ name: t.name, role: t.role })),
                tasks: projectData.tasks.map(t => ({ name: t.name, status: t.status })),
                milestones: projectData.milestones.map(m => ({ name: m.name, status: m.status }))
            };

            const prompt = PROMPTS.generateStatusSummary(projectSummary, context);
            const res = await withRetry<GenerateContentResponse>(() => ai.models.generateContent({ 
                model: 'gemini-3-flash-preview', 
                contents: truncatePrompt(prompt) 
            }));
            
            const content = res.text || '';
            if (!content) throw new Error("AI returned an empty report.");

            setAiReport({ title: 'Project Pulse Summary', content, isOpen: true });
        } catch (e: any) { 
            console.error('Summary generation failed:', e);
            setError(`Summary generation failed: ${e.message}`); 
        } finally { 
            setIsGeneratingReport(null); 
            isProcessingRef.current = false;
        }
    };

    const handleAddToDocuments = (title: string, content: string) => {
        const newDoc: Document = { id: `doc-ai-${Date.now()}`, title, version: 'v1.0', status: 'Working', owner: currentUser.username, phase: 8, sequence: 10 };
        handleSave(prev => ({ documents: [...prev.documents, newDoc], phasesData: { ...prev.phasesData, [newDoc.id]: { content } } }));
    };

    // Only show global spinner if NOT in Phases tab, OR if the loading item is NOT a document (e.g. 'agent' or global task)
    const showGlobalSpinner = loadingPhase.step && (
        activeTab !== 'Project Phases' || 
        !projectData.documents.some(d => d.id === loadingPhase.docId)
    );

    return (
        <section className="dashboard-container" style={{ maxWidth: '1600px', margin: '0 auto' }}>
            <div className="dashboard-header-wrapper" style={{ 
                marginBottom: '2rem', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                background: 'var(--card-background)',
                padding: '1.5rem',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--card-border)',
                backdropFilter: 'blur(12px)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <button onClick={onBack} className="button" style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ←
                    </button>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', marginBottom: '0.2rem', lineHeight: 1.2, background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{projectData.name}</h1>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <span style={{ 
                                background: 'rgba(255,255,255,0.05)', 
                                border: '1px solid var(--card-border)',
                                padding: '0.2rem 0.8rem', 
                                borderRadius: '100px', 
                                fontSize: '0.75rem', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.05em',
                                color: 'var(--accent-color)'
                            }}>
                                {projectData.discipline}
                            </span>
                            <span style={{ color: 'var(--secondary-text)', fontSize: '0.9rem' }}>
                                {projectData.isStarted ? 'Execution Phase' : 'Planning Phase'}
                            </span>
                            <span style={{ color: 'rgba(0,255,170,0.5)', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '1px' }}>
                                VER: 5.0.0-VERIFIED
                            </span>
                        </div>
                    </div>
                </div>
                
                <div style={{ display: 'flex', gap: '2rem', textAlign: 'right' }}>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Budget</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary-text)' }}>${projectData.budget.toLocaleString()}</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Team</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--primary-text)' }}>{projectData.team.length} Members</div>
                    </div>
                </div>
            </div>

            {error && (
                <div style={{ 
                    background: 'rgba(248, 113, 113, 0.1)', 
                    border: '1px solid var(--error-color)', 
                    color: 'var(--error-color)', 
                    padding: '1rem', 
                    borderRadius: 'var(--radius-sm)', 
                    marginBottom: '2rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span>{error}</span>
                    <button onClick={() => setError('')} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                </div>
            )}

            <nav className="dashboard-nav" style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                marginBottom: '2rem', 
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '1rem'
            }}>
                {['Dashboard', 'Project Phases', 'Documents', 'Project Tracking', 'Revision Control'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => handleTabChange(tab)} 
                        className={activeTab === tab ? 'active' : ''}
                        style={{
                            background: activeTab === tab ? 'var(--primary-gradient)' : 'transparent',
                            color: activeTab === tab ? '#fff' : 'var(--secondary-text)',
                            border: 'none',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '100px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: activeTab === tab ? '0 4px 12px rgba(99, 102, 241, 0.3)' : 'none'
                        }}
                    >
                        {tab}
                    </button>
                ))}
            </nav>

            {showGlobalSpinner && (
                <div className="status-message loading" style={{marginBottom: '2rem'}}>
                    <div className="spinner"></div>
                    <p>{loadingPhase.step}</p>
                </div>
            )}

            {activeTab === 'Dashboard' && (
                <DashboardView 
                    project={projectData} phasesData={projectData.phasesData} 
                    isPlanningComplete={projectData.documents.filter(d => d.type !== 'image').every(d => d.status === 'Approved')} 
                    projectPhases={projectPhases} onAnalyzeRisks={handleAnalyzeRisks} 
                    onGenerateSummary={handleGenerateSummary} isGeneratingReport={isGeneratingReport} 
                />
            )}
            
            {activeTab === 'Project Phases' && (
                <div>
                    <ProjectPhasesView 
                        project={projectData} projectPhases={projectPhases} phasesData={projectData.phasesData} 
                        documents={projectData.documents} error={error} loadingPhase={loadingPhase} 
                        handleUpdatePhaseData={handleUpdatePhaseData} handleCompletePhase={handleCompletePhase} 
                        handleGenerateContent={handleGenerateContent} handleGenerateImages={handleGenerateImages}
                        handleChatToChange={handleChatToChange} handleAttachFile={handleAttachFile} 
                        handleRemoveAttachment={handleRemoveAttachment} generationMode={projectData.generationMode} 
                        onSetGenerationMode={handleSetGenerationMode} isAutoGenerating={isAutoGenerating} 
                        onBasicPlan={handleBasicPlan} isBasicPlanRunning={isBasicPlanRunning}
                    />
                    {!projectData.isStarted && projectData.documents.filter(d => d.type !== 'image').every(d => d.status === 'Approved') && (
                        <div style={{textAlign: 'center', marginTop: '4rem', padding: '4rem', background: 'rgba(0,255,170,0.05)', borderRadius: '12px', border: '1px dashed var(--success-color)'}}>
                            <h2 style={{color: 'var(--success-color)', marginBottom: '1rem'}}>Planning Complete!</h2>
                            <p style={{marginBottom: '2rem', color: 'var(--secondary-text)'}}>Run the Tracking Data Agent Workflow to generate your timeline and tasks using multi-agent synthesis.</p>
                            <button className="button button-generate" onClick={generateAgentPlan} style={{fontSize: '1.2rem', padding: '1.5rem 3rem'}}>Run 6-Agent Synthesis Workflow</button>
                        </div>
                    )}
                </div>
            )}
            
            {activeTab === 'Documents' && <DocumentsView project={projectData} documents={projectData.documents} onUpdateDocument={(id, status) => handleSave(p => ({ documents: p.documents.map(d => d.id === id ? { ...d, status } : d) }))} phasesData={projectData.phasesData} />}
            
            {activeTab === 'Project Tracking' && (
                <ProjectTrackingView 
                    project={projectData} onUpdateTask={handleUpdateTask} 
                    onUpdateMilestone={handleUpdateMilestone} 
                    onUpdateTeam={(newTeam, newOwnerId) => handleSave({ team: newTeam, ownerId: newOwnerId || projectData.ownerId })} 
                    onUpdateProject={handleSave} onTaskClick={setSelectedTask} currentUser={currentUser} 
                    onEstimateCosts={handleEstimateCosts} isEstimating={isEstimatingCosts}
                />
            )}
            
            {activeTab === 'Revision Control' && <RevisionControlView project={projectData} onUpdateProject={handleSave} />}

            {selectedTask && (
                <TaskDetailModal 
                    isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} 
                    onSave={(t) => handleUpdateTask(t.id, t)} task={selectedTask} 
                    project={projectData} currentUser={currentUser} 
                />
            )}

            <AiReportModal 
                isOpen={aiReport.isOpen} onClose={() => setAiReport(prev => ({ ...prev, isOpen: false }))} 
                title={aiReport.title} content={aiReport.content} onAddToDocuments={handleAddToDocuments} 
            />

            <DownloadModal 
                isOpen={isDownloadModalOpen} 
                onClose={() => setIsDownloadModalOpen(false)} 
                zipBlob={zipBlob} 
                projectName={projectData.name} 
            />
        </section>
    );
};
