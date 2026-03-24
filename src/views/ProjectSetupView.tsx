
import React, { useState } from 'react';
import { Type } from "@google/genai";
import { TEMPLATES, PROMPTS } from '../constants/projectData';
import { User, Project } from '../types';
import { getGeminiClient } from '../utils/geminiClient';

interface ProjectSetupViewProps {
    onBack: () => void;
    onCreateProject: (data: any) => void;
    currentUser: User;
}

export const ProjectSetupView: React.FC<ProjectSetupViewProps> = ({ onBack, onCreateProject, currentUser }) => {
    const [name, setName] = useState('');
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
    const [projectMode, setProjectMode] = useState('fullscale');
    const [projectScope, setProjectScope] = useState('internal');
    const [teamSize, setTeamSize] = useState('medium');
    const [projectComplexity, setProjectComplexity] = useState('typical');
    const [creationMode, setCreationMode] = useState('template');
    const [customDiscipline, setCustomDiscipline] = useState('');
    const [isGeneratingDocs, setIsGeneratingDocs] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) { setError("Please enter a project name."); return; }
        
        let template;
        if (creationMode === 'template') {
            template = TEMPLATES.find(t => t.id === selectedTemplateId);
            if (!template) { setError("Please select a template."); return; }
            onCreateProject({ name, template, mode: projectMode, scope: projectScope, teamSize, complexity: projectComplexity });
        } else {
            if (!customDiscipline.trim()) { setError("Please enter a custom project type."); return; }
            
            setIsGeneratingDocs(true);
            try {
                const ai = getGeminiClient();
                
                const prompt = PROMPTS.generateDocumentList(customDiscipline.trim(), projectScope, teamSize, projectComplexity);
                const schema = {
                    type: Type.OBJECT, 
                    properties: { 
                        documents: {
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT, 
                                properties: {
                                    title: { type: Type.STRING },
                                    phase: { type: Type.NUMBER },
                                    sequence: { type: Type.NUMBER }
                                }, 
                                required: ['title', 'phase', 'sequence']
                            }
                        }
                    }, 
                    required: ['documents']
                };
                
                const response = await ai.models.generateContent({
                    model: 'gemini-3-flash-preview', 
                    contents: prompt, 
                    config: { 
                        responseMimeType: "application/json", 
                        responseSchema: schema,
                        thinkingConfig: { thinkingBudget: 0 }
                    },
                });

                const text = response.text;
                if (!text) throw new Error("The AI returned an empty response.");

                const parsedResponse = JSON.parse(text);
                const rawDocs = parsedResponse.documents;
                const generatedDocs = rawDocs.map((doc: any, i: number) => ({
                    id: `doc-custom-${i}-${Date.now()}`, 
                    title: doc.title, 
                    version: 'v1.0', 
                    status: 'Working', 
                    owner: currentUser.username, 
                    phase: doc.phase, 
                    sequence: doc.sequence,
                }));

                template = { id: 'custom', name: 'Custom Project', discipline: customDiscipline.trim(), documents: generatedDocs };
                onCreateProject({ name, template, mode: projectMode, scope: projectScope, teamSize, complexity: projectComplexity });
            } catch (err: any) {
                console.error("Project Generation Error:", err);
                setError(`Failed to generate project structure: ${err.message || 'Unknown error'}`);
            } finally {
                setIsGeneratingDocs(false);
            }
        }
    };

    return (
        <div className="setup-container" style={{ animation: 'slideUp 0.6s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button onClick={onBack} className="button">← Back</button>
                <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Set up project</h1>
            </div>

            <div style={{ 
                backgroundColor: 'rgba(250, 204, 21, 0.15)', 
                color: '#FDE047', 
                padding: '1.5rem', 
                borderRadius: '8px', 
                marginBottom: '3rem', 
                border: '1px solid rgba(250, 204, 21, 0.4)', 
                lineHeight: '1.6', 
                fontSize: '1.1rem',
                fontWeight: 500,
                wordBreak: 'break-word',
                whiteSpace: 'pre-wrap'
            }}>
                Start by creating a descriptive title for your project &gt; then select all the options, then add any specs or constraints and initialize project &gt; push generate &gt; after the generation is complete review and if required edit the first document, when it describes your project well push mark as approved &gt; repeat this for all documents &gt; after the last document push use the 6 agent planner to create milestone charts resource lists, kanban, etc and to track your project activities.
            </div>

            <div className="setup-grid">
                <form onSubmit={handleSubmit} className="glass-card form-stack">
                    <div className="form-group">
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                            <label style={{margin:0}}>Project Name</label>
                            <span style={{fontSize: '0.8rem', color: 'var(--secondary-text)'}}>{name.length}/256</span>
                        </div>
                        <textarea 
                            value={name} 
                            onChange={(e) => setName(e.target.value)} 
                            placeholder="e.g., Orbital Infrastructure Alpha - Phase 1" 
                            required 
                            maxLength={256}
                            rows={3}
                        />
                    </div>

                    <div className="form-group">
                        <label>Execution Mode</label>
                        <div className="selection-grid">
                            <button type="button" className={`selection-button ${projectMode === 'fullscale' ? 'active' : ''}`} onClick={() => setProjectMode('fullscale')}>
                                <strong>Full Scale</strong>
                                <span>Complete HMAP cycle</span>
                            </button>
                            <button type="button" className={`selection-button ${projectMode === 'minimal' ? 'active' : ''}`} onClick={() => setProjectMode('minimal')}>
                                <strong>Minimal</strong>
                                <span>Rapid deployment</span>
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Operational Scope</label>
                        <div className="selection-grid">
                            <button type="button" className={`selection-button ${projectScope === 'internal' ? 'active' : ''}`} onClick={() => setProjectScope('internal')}>
                                <strong>Internal</strong>
                                <span>Core team execution</span>
                            </button>
                            <button type="button" className={`selection-button ${projectScope === 'subcontracted' ? 'active' : ''}`} onClick={() => setProjectScope('subcontracted')}>
                                <strong>Subcontracted</strong>
                                <span>External vendor support</span>
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Intelligence / Team Scale</label>
                        <div className="selection-grid-3">
                            <button type="button" className={`selection-button ${teamSize === 'small' ? 'active' : ''}`} onClick={() => setTeamSize('small')}>
                                <strong>Small</strong>
                                <span>1-3 People</span>
                            </button>
                            <button type="button" className={`selection-button ${teamSize === 'medium' ? 'active' : ''}`} onClick={() => setTeamSize('medium')}>
                                <strong>Medium</strong>
                                <span>4-15 People</span>
                            </button>
                            <button type="button" className={`selection-button ${teamSize === 'large' ? 'active' : ''}`} onClick={() => setTeamSize('large')}>
                                <strong>Large</strong>
                                <span>16+ People</span>
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Project Complexity</label>
                        <div className="selection-grid-3">
                            <button type="button" className={`selection-button ${projectComplexity === 'easy' ? 'active' : ''}`} onClick={() => setProjectComplexity('easy')}>
                                <strong>Easy</strong>
                                <span>Straightforward</span>
                            </button>
                            <button type="button" className={`selection-button ${projectComplexity === 'typical' ? 'active' : ''}`} onClick={() => setProjectComplexity('typical')}>
                                <strong>Typical</strong>
                                <span>Standard Requirements</span>
                            </button>
                            <button type="button" className={`selection-button ${projectComplexity === 'hard' ? 'active' : ''}`} onClick={() => setProjectComplexity('hard')}>
                                <strong>Complex</strong>
                                <span>High Risk / Ambiguity</span>
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Project Discipline & Logic</label>
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                            <button type="button" className={`button ${creationMode === 'template' ? 'active' : ''}`} onClick={() => setCreationMode('template')}>Use Template</button>
                            <button type="button" className={`button ${creationMode === 'custom' ? 'active' : ''}`} onClick={() => setCreationMode('custom')}>Custom Logic</button>
                        </div>
                        {creationMode === 'template' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', maxHeight: '300px', overflowY: 'auto', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                                {TEMPLATES.map(t => (
                                    <button key={t.id} type="button" className={`selection-button ${selectedTemplateId === t.id ? 'active' : ''}`} onClick={() => setSelectedTemplateId(t.id)}>
                                        <strong>{t.name}</strong>
                                        <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>{t.discipline}</span>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <input type="text" value={customDiscipline} onChange={(e) => setCustomDiscipline(e.target.value)} placeholder="e.g., Deep Sea Mining Protocol" />
                        )}
                    </div>

                    {error && <p className="status-message error">{error}</p>}
                    
                    <button type="submit" className="button button-primary button-large" disabled={isGeneratingDocs} style={{ width: '100%', marginTop: '1rem' }}>
                        {isGeneratingDocs ? <div className="spinner"></div> : 'INITIALIZE PROJECT'}
                    </button>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-card" style={{ padding: '2rem', fontSize: '1rem', color: 'var(--secondary-text)' }}>
                        <h4 style={{ color: '#fff', marginBottom: '1rem' }}>SYSTEM ADVISORY</h4>
                        <p>Initializing a new workspace requires neural synthesis of the HMAP framework. This ensures your project follows first-principles thinking and extreme agility standards.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
