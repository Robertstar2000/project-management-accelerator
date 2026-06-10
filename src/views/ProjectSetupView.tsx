import React, { useState, useMemo, useCallback } from 'react';
import { Type } from "@google/genai";
import { TEMPLATES, PROMPTS } from '../constants/projectData';
import { User, Project } from '../types';
import { getGeminiClient } from '../utils/geminiClient';

interface ProjectSetupViewProps {
    onBack: () => void;
    onCreateProject: (data: any) => void;
    currentUser: User;
}

// Categorize templates into groups for better organization
const CATEGORIES: Record<string, { label: string; icon: string; keywords: string[] }> = {
    'engineering': { label: 'Engineering & Manufacturing', icon: '🔧', keywords: ['software', 'mechanical', 'electrical', 'civil', 'industrial', 'aerospace', 'automotive', 'chemical', 'structural', 'construction', 'manufacturing', 'robotics'] },
    'technology': { label: 'Technology & IT', icon: '💻', keywords: ['mobile', 'ai', 'cloud', 'it', 'cyber', 'crm', 'erp', 'ecommerce', 'digital', 'data', 'website', 'infrastructure'] },
    'business': { label: 'Business & Strategy', icon: '📊', keywords: ['product', 'marketing', 'brand', 'merger', 'corporate', 'business', 'retail', 'finance', 'sales', 'supply chain'] },
    'science': { label: 'Science & Research', icon: '🔬', keywords: ['research', 'biomedical', 'environmental', 'energy', 'sustainability'] },
    'creative': { label: 'Creative & Media', icon: '🎨', keywords: ['film', 'publishing', 'content', 'interior', 'education', 'hospitality', 'urban'] },
    'operations': { label: 'Operations & HR', icon: '👥', keywords: ['human resources', 'operations', 'event', 'non-profit', 'quality', 'change', 'employee', 'office'] },
};

// Pre-built smart defaults suggestions
const SMART_SUGGESTIONS: Record<string, { mode: string; scope: string; teamSize: string; complexity: string; templateId: string; description: string }> = {
    'mobile': { mode: 'minimal', scope: 'internal', teamSize: 'medium', complexity: 'typical', templateId: 'mobile-app-dev', description: 'Mobile app dev: minimal process, internal team' },
    'app': { mode: 'minimal', scope: 'internal', teamSize: 'medium', complexity: 'typical', templateId: 'mobile-app-dev', description: 'Application dev: minimal process, standard team' },
    'website': { mode: 'fullscale', scope: 'internal', teamSize: 'small', complexity: 'typical', templateId: 'website-redesign', description: 'Website project: full cycle, small design team' },
    'software': { mode: 'fullscale', scope: 'internal', teamSize: 'medium', complexity: 'typical', templateId: 'software-dev', description: 'Software dev: full HMAP cycle, agile team' },
    'ai': { mode: 'fullscale', scope: 'internal', teamSize: 'medium', complexity: 'hard', templateId: 'ai-integration', description: 'AI project: full cycle, complex requirements' },
    'marketing': { mode: 'minimal', scope: 'internal', teamSize: 'small', complexity: 'typical', templateId: 'marketing-campaign', description: 'Marketing: rapid deployment, small team' },
    'construction': { mode: 'fullscale', scope: 'subcontracted', teamSize: 'large', complexity: 'hard', templateId: 'construction', description: 'Construction: full cycle, external vendors' },
    'product': { mode: 'fullscale', scope: 'internal', teamSize: 'medium', complexity: 'typical', templateId: 'product-launch', description: 'Product launch: full cycle, cross-functional team' },
    'research': { mode: 'fullscale', scope: 'internal', teamSize: 'small', complexity: 'hard', templateId: 'research-dev', description: 'R&D: full cycle, small expert team' },
    'event': { mode: 'minimal', scope: 'internal', teamSize: 'medium', complexity: 'typical', templateId: 'event-planning', description: 'Event: rapid deployment, coordination team' },
    'security': { mode: 'fullscale', scope: 'internal', teamSize: 'small', complexity: 'typical', templateId: 'cyber-audit', description: 'Security audit: methodical, small expert team' },
};

export const ProjectSetupView: React.FC<ProjectSetupViewProps> = ({ onBack, onCreateProject, currentUser }) => {
    const [step, setStep] = useState(1);
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
    const [disciplineSearch, setDisciplineSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [suggestedSetup, setSuggestedSetup] = useState<string | null>(null);

    // Group templates by category
    const categorizedTemplates = useMemo(() => {
        const grouped: Record<string, typeof TEMPLATES> = {};
        const uncategorized: typeof TEMPLATES = [];
        
        TEMPLATES.forEach(t => {
            const lowerName = t.name.toLowerCase() + ' ' + t.discipline.toLowerCase();
            let found = false;
            for (const [key, cat] of Object.entries(CATEGORIES)) {
                if (cat.keywords.some(kw => lowerName.includes(kw))) {
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(t);
                    found = true;
                    break;
                }
            }
            if (!found) uncategorized.push(t);
        });
        
        if (uncategorized.length > 0) grouped['other'] = uncategorized;
        return grouped;
    }, []);

    // Filter templates based on search
    const filteredAndGrouped = useMemo(() => {
        if (!disciplineSearch.trim()) {
            return { grouped: categorizedTemplates, hasFilter: false };
        }
        const search = disciplineSearch.toLowerCase();
        const filtered: Record<string, typeof TEMPLATES> = {};
        
        for (const entry of Object.entries(categorizedTemplates)) {
            const key = entry[0];
            const templates = entry[1] as typeof TEMPLATES;
            const matched = templates.filter(t => 
                t.name.toLowerCase().includes(search) || 
                t.discipline.toLowerCase().includes(search)
            );
            if (matched.length > 0) filtered[key] = matched;
        }
        return { grouped: filtered, hasFilter: true };
    }, [categorizedTemplates, disciplineSearch]);

    // Smart defaults based on project name
    const smartDefault = useMemo(() => {
        if (!name.trim()) return null;
        const lowered = name.toLowerCase();
        for (const [keyword, config] of Object.entries(SMART_SUGGESTIONS)) {
            if (lowered.includes(keyword)) return config;
        }
        return null;
    }, [name]);

    const applySmartDefaults = useCallback(() => {
        if (!smartDefault) return;
        setProjectMode(smartDefault.mode);
        setProjectScope(smartDefault.scope);
        setTeamSize(smartDefault.teamSize);
        setProjectComplexity(smartDefault.complexity);
        setSelectedTemplateId(smartDefault.templateId);
        setSuggestedSetup(smartDefault.description);
    }, [smartDefault]);

    const totalSteps = 3;

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

    const canProceedFromStep1 = name.trim().length > 0;
    const canProceedFromStep2 = true; // All steps have defaults
    const canProceedFromStep3 = creationMode === 'template' ? selectedTemplateId !== null : customDiscipline.trim().length > 0;

    const getStepLabel = (s: number) => {
        switch (s) {
            case 1: return 'Project Identity';
            case 2: return 'Team & Scope';
            case 3: return 'Discipline & Logic';
            default: return '';
        }
    };

    return (
        <div className="setup-container" style={{ animation: 'slideUp 0.6s ease' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <button onClick={step > 1 ? () => setStep(step - 1) : onBack} className="button">
                    {step > 1 ? '← Previous' : '← Back'}
                </button>
                <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Set up project</h1>
            </div>

            {/* Step Progress Indicator */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                marginBottom: '2rem', padding: '1rem 1.5rem',
                background: 'rgba(30, 41, 59, 0.4)', borderRadius: 'var(--radius)',
                border: '1px solid var(--card-border)'
            }}>
                {[1, 2, 3].map(s => (
                    <React.Fragment key={s}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                            cursor: s <= step ? 'pointer' : 'default',
                            opacity: s <= step ? 1 : 0.4
                        }} onClick={() => s < step && setStep(s)}>
                            <div style={{
                                width: '32px', height: '32px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '0.85rem',
                                background: s <= step ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.05)',
                                border: s <= step ? 'none' : '1px solid var(--card-border)',
                                color: s <= step ? '#fff' : 'var(--secondary-text)',
                                transition: 'all 0.3s ease'
                            }}>{s}</div>
                            <span style={{
                                fontSize: '0.85rem', fontWeight: 600,
                                color: s <= step ? 'var(--primary-text)' : 'var(--secondary-text)'
                            }}>{getStepLabel(s)}</span>
                        </div>
                        {s < 3 && (
                            <div style={{
                                flex: 1, height: '2px',
                                background: s < step ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.1)',
                                borderRadius: '1px', maxWidth: '80px',
                                transition: 'all 0.3s ease'
                            }} />
                        )}
                    </React.Fragment>
                ))}
                <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--secondary-text)' }}>
                    Step {step} of {totalSteps}
                </div>
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
                Start by creating a descriptive title for your project → then select all the options, then add any specs or constraints and initialize project → push generate → after the generation is complete review and if required edit the first document, when it describes your project well push mark as approved → repeat this for all documents → after the last document push use the 6 agent planner to create milestone charts resource lists, kanban, etc and to track your project activities.
            </div>

            <div className="setup-grid">
                <form onSubmit={handleSubmit} className="glass-card form-stack">
                    {/* STEP 1: Project Identity */}
                    {step === 1 && (
                        <div style={{ animation: 'slideUp 0.4s ease' }}>
                            <div className="form-group">
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                                    <label style={{margin:0}}>Project Name</label>
                                    <span style={{fontSize: '0.8rem', color: 'var(--secondary-text)'}}>{name.length}/256</span>
                                </div>
                                <textarea 
                                    value={name} 
                                    onChange={(e) => setName(e.target.value)} 
                                    placeholder="e.g., Mobile Banking App, Marketing Campaign Q3, Research Study" 
                                    required 
                                    maxLength={256}
                                    rows={3}
                                />
                            </div>

                            {/* AI Quick Setup — smart defaults based on project name */}
                            {smartDefault && !suggestedSetup && (
                                <div style={{
                                    padding: '1rem 1.5rem', borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.3)',
                                    marginBottom: '1.5rem'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ fontSize: '1.2rem' }}>⚡</span>
                                        <div>
                                            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Quick Setup Available</p>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--secondary-text)' }}>
                                                Based on "{name}", we suggest: {smartDefault.description}
                                            </p>
                                        </div>
                                        <button type="button" onClick={applySmartDefaults} className="button button-primary" style={{ marginLeft: 'auto', whiteSpace: 'nowrap', fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                                            Apply ⚡
                                        </button>
                                    </div>
                                </div>
                            )}

                            {suggestedSetup && (
                                <div style={{
                                    padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
                                    background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)',
                                    marginBottom: '1.5rem', fontSize: '0.85rem', color: '#34d399'
                                }}>
                                    ✓ Smart setup applied: {suggestedSetup}
                                </div>
                            )}

                            <div className="form-group">
                                <label>Execution Mode</label>
                                <div className="selection-grid">
                                    <button type="button" className={`selection-button ${projectMode === 'fullscale' ? 'active' : ''}`} onClick={() => setProjectMode('fullscale')}>
                                        <strong>Full Scale</strong>
                                        <span>Complete HMAP cycle — best for complex, long-duration projects</span>
                                    </button>
                                    <button type="button" className={`selection-button ${projectMode === 'minimal' ? 'active' : ''}`} onClick={() => setProjectMode('minimal')}>
                                        <strong>Minimal</strong>
                                        <span>Rapid deployment — streamlined process for quick-turn projects</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Team & Scope */}
                    {step === 2 && (
                        <div style={{ animation: 'slideUp 0.4s ease' }}>
                            <div className="form-group">
                                <label>Operational Scope</label>
                                <div className="selection-grid">
                                    <button type="button" className={`selection-button ${projectScope === 'internal' ? 'active' : ''}`} onClick={() => setProjectScope('internal')}>
                                        <strong>Internal</strong>
                                        <span>Core team execution — no external vendors</span>
                                    </button>
                                    <button type="button" className={`selection-button ${projectScope === 'subcontracted' ? 'active' : ''}`} onClick={() => setProjectScope('subcontracted')}>
                                        <strong>Subcontracted</strong>
                                        <span>External vendor support — includes RFP & contract documents</span>
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Intelligence / Team Scale</label>
                                <div className="selection-grid-3">
                                    <button type="button" className={`selection-button ${teamSize === 'small' ? 'active' : ''}`} onClick={() => setTeamSize('small')}>
                                        <strong>Small</strong>
                                        <span>1-3 People — tight-knit, fast-moving</span>
                                    </button>
                                    <button type="button" className={`selection-button ${teamSize === 'medium' ? 'active' : ''}`} onClick={() => setTeamSize('medium')}>
                                        <strong>Medium</strong>
                                        <span>4-15 People — standard cross-functional</span>
                                    </button>
                                    <button type="button" className={`selection-button ${teamSize === 'large' ? 'active' : ''}`} onClick={() => setTeamSize('large')}>
                                        <strong>Large</strong>
                                        <span>16+ People — multi-team coordination</span>
                                    </button>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Project Complexity</label>
                                <div className="selection-grid-3">
                                    <button type="button" className={`selection-button ${projectComplexity === 'easy' ? 'active' : ''}`} onClick={() => setProjectComplexity('easy')}>
                                        <strong>Easy</strong>
                                        <span>Straightforward — low risk, clear requirements</span>
                                    </button>
                                    <button type="button" className={`selection-button ${projectComplexity === 'typical' ? 'active' : ''}`} onClick={() => setProjectComplexity('typical')}>
                                        <strong>Typical</strong>
                                        <span>Standard Requirements — moderate complexity</span>
                                    </button>
                                    <button type="button" className={`selection-button ${projectComplexity === 'hard' ? 'active' : ''}`} onClick={() => setProjectComplexity('hard')}>
                                        <strong>Complex</strong>
                                        <span>High Risk / Ambiguity — advanced planning needed</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Discipline & Logic */}
                    {step === 3 && (
                        <div style={{ animation: 'slideUp 0.4s ease' }}>
                            <div className="form-group">
                                <label>Project Discipline & Logic</label>
                                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <button type="button" className={`button ${creationMode === 'template' ? 'active' : ''}`} onClick={() => setCreationMode('template')}>Use Template</button>
                                    <button type="button" className={`button ${creationMode === 'custom' ? 'active' : ''}`} onClick={() => setCreationMode('custom')}>Custom Logic</button>
                                </div>

                                {creationMode === 'template' ? (
                                    <>
                                        {/* Discipline Search */}
                                        <div style={{ marginBottom: '1rem', position: 'relative' }}>
                                            <input
                                                type="text"
                                                placeholder="🔍 Search disciplines... (e.g., aerospace, mobile, construction)"
                                                value={disciplineSearch}
                                                onChange={(e) => setDisciplineSearch(e.target.value)}
                                                style={{ paddingLeft: '2.5rem' }}
                                            />
                                        </div>

                                        {/* Filtered Count */}
                                        <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', marginBottom: '0.75rem' }}>
                                            {(() => {
                                                const vals = Object.values(filteredAndGrouped.grouped) as typeof TEMPLATES[];
                                                const total = vals.reduce((sum, arr) => sum + arr.length, 0);
                                                return `${total} of ${TEMPLATES.length} disciplines`;
                                            })()} 
                                            {filteredAndGrouped.hasFilter && ' match your search'}
                                        </div>

                                        {/* Category Tabs */}
                                        <div style={{
                                            display: 'flex', gap: '0.4rem', flexWrap: 'wrap',
                                            marginBottom: '1rem'
                                        }}>
                                            {Object.entries(CATEGORIES).map(([key, cat]) => {
                                                const count = categorizedTemplates[key]?.length || 0;
                                                return (
                                                    <button
                                                        key={key}
                                                        type="button"
                                                        onClick={() => setActiveCategory(activeCategory === key ? null : key)}
                                                        style={{
                                                            padding: '0.35rem 0.75rem', borderRadius: '100px', border: '1px solid var(--card-border)',
                                                            background: activeCategory === key ? 'var(--primary-gradient)' : 'rgba(255,255,255,0.03)',
                                                            color: activeCategory === key ? '#fff' : 'var(--secondary-text)',
                                                            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                                                            transition: 'all 0.2s'
                                                        }}
                                                    >
                                                        {cat.icon} {cat.label} ({count})
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* Template Grid */}
                                        <div style={{
                                            display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                            gap: '0.75rem', maxHeight: '350px', overflowY: 'auto',
                                            padding: '1rem', background: 'rgba(0,0,0,0.2)',
                                            borderRadius: '12px', border: '1px solid var(--border-color)'
                                        }}>
                                            {Object.entries(filteredAndGrouped.grouped).map((entry: [string, unknown]) => {
                                                const category = entry[0];
                                                const templates = entry[1] as typeof TEMPLATES;
                                                if (activeCategory && category !== activeCategory && category !== 'other') return null;
                                                return (
                                                    <React.Fragment key={category}>
                                                        {!filteredAndGrouped.hasFilter && !activeCategory && (
                                                            <div style={{ gridColumn: '1 / -1', fontSize: '0.75rem', color: 'var(--tertiary-text)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, padding: '0.5rem 0 0.25rem' }}>
                                                                {CATEGORIES[category]?.icon} {CATEGORIES[category]?.label || category}
                                                            </div>
                                                        )}
                                                        {templates.map(t => (
                                                            <button
                                                                key={t.id}
                                                                type="button"
                                                                className={`selection-button ${selectedTemplateId === t.id ? 'active' : ''}`}
                                                                onClick={() => setSelectedTemplateId(t.id)}
                                                                style={{ minHeight: '100px', padding: '1rem' }}
                                                            >
                                                                <strong style={{ fontSize: '0.85rem' }}>{t.name}</strong>
                                                                <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{t.discipline}</span>
                                                            </button>
                                                        ))}
                                                    </React.Fragment>
                                                );
                                            })}
                                            {Object.keys(filteredAndGrouped.grouped).length === 0 && (
                                                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--secondary-text)' }}>
                                                    No disciplines match "{disciplineSearch}". Try a different search term.
                                                </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <p style={{ color: 'var(--secondary-text)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                            Describe your custom project type and AI will generate the appropriate document structure.
                                        </p>
                                        <input 
                                            type="text" 
                                            value={customDiscipline} 
                                            onChange={(e) => setCustomDiscipline(e.target.value)} 
                                            placeholder="e.g., Deep Sea Mining Protocol, Space Habitat Design" 
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {error && <p className="status-message error">{error}</p>}
                    
                    {/* Navigation buttons */}
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                        {step < totalSteps ? (
                            <button 
                                type="button" 
                                className="button button-primary button-large" 
                                style={{ flex: 1 }} 
                                disabled={step === 1 ? !canProceedFromStep1 : step === 2 ? !canProceedFromStep2 : !canProceedFromStep3}
                                onClick={() => setStep(step + 1)}
                            >
                                Continue → {getStepLabel(step + 1)}
                            </button>
                        ) : (
                            <button 
                                type="submit" 
                                className="button button-primary button-large" 
                                disabled={isGeneratingDocs || (creationMode === 'template' ? !selectedTemplateId : !customDiscipline.trim())}
                                style={{ flex: 1 }}
                            >
                                {isGeneratingDocs ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div className="spinner" style={{ width: '18px', height: '18px' }}></div>
                                        Synthesizing Project...
                                    </span>
                                ) : '🚀 INITIALIZE PROJECT'}
                            </button>
                        )}
                    </div>
                </form>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-card" style={{ padding: '2rem', fontSize: '1rem', color: 'var(--secondary-text)' }}>
                        <h4 style={{ color: '#fff', marginBottom: '1rem' }}>
                            {step === 1 && '📝 PROJECT IDENTITY'}
                            {step === 2 && '👥 TEAM & SCOPE'}
                            {step === 3 && '🎯 DISCIPLINE SELECTION'}
                        </h4>
                        {step === 1 && (
                            <p>Name your project and choose the execution mode. Full Scale follows the complete HMAP cycle. Minimal is a streamlined rapid-deployment path.</p>
                        )}
                        {step === 2 && (
                            <p>Define your operational scope, team size, and complexity. These settings determine the documentation depth and planning rigor.</p>
                        )}
                        {step === 3 && (
                            <p>Select a discipline template that matches your project type. Use the search bar or category filters to quickly find the right template.</p>
                        )}
                        <p style={{ marginTop: '1rem', opacity: 0.6, fontSize: '0.85rem' }}>
                            Initializing a new workspace requires neural synthesis of the HMAP framework. This ensures your project follows first-principles thinking and extreme agility standards.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};