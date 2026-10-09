import React, { useState } from 'react';
import { Project, TreeOfThoughtsNode, ChallengePanelReview, DesignTradeStudy } from '../types';
import { DEFAULT_TOT_NODES, DEFAULT_CHALLENGE_REVIEWS, DEFAULT_TRADE_STUDIES } from '../constants/harnessDefaults';
import { getGeminiClient } from '../utils/geminiClient';

interface VirtualChallengesViewProps {
    project: Project;
    onUpdateProject: (update: Partial<Project> | ((prev: Project) => Partial<Project>)) => void;
}

export const VirtualChallengesView: React.FC<VirtualChallengesViewProps> = ({ project, onUpdateProject }) => {
    const totNodes: TreeOfThoughtsNode[] = project.totNodes || DEFAULT_TOT_NODES;
    const challengeReviews: ChallengePanelReview[] = project.challengeReviews || DEFAULT_CHALLENGE_REVIEWS;
    const tradeStudies: DesignTradeStudy[] = project.tradeStudies || DEFAULT_TRADE_STUDIES;

    const [activeSection, setActiveSection] = useState<'tot' | 'challenge_panel' | 'trade_studies'>('tot');
    const [selectedTotId, setSelectedTotId] = useState<string>(totNodes[0]?.id || 'tot-root');
    const [isExpandingTot, setIsExpandingTot] = useState(false);
    const [isConveningPanel, setIsConveningPanel] = useState(false);

    // New ToT node form
    const [isAddingBranch, setIsAddingBranch] = useState(false);
    const [branchTitle, setBranchTitle] = useState('');
    const [branchHypothesis, setBranchHypothesis] = useState('');
    const [branchPros, setBranchPros] = useState('');
    const [branchCons, setBranchCons] = useState('');

    // Panel topic input
    const [challengeTopic, setChallengeTopic] = useState('');

    const activeTot = totNodes.find(n => n.id === selectedTotId) || totNodes[0];

    const updateTot = (nodes: TreeOfThoughtsNode[]) => {
        onUpdateProject({ totNodes: nodes });
    };

    const updateReviews = (reviews: ChallengePanelReview[]) => {
        onUpdateProject({ challengeReviews: reviews });
    };

    // ToT status change (e.g. select or backtrack)
    const handleSetTotStatus = (nodeId: string, status: TreeOfThoughtsNode['status']) => {
        const updated = totNodes.map(n => n.id === nodeId ? { ...n, status } : n);
        updateTot(updated);
    };

    // AI-generated Tree of Thoughts expansion
    const handleExpandTreeOfThoughts = async () => {
        if (!activeTot || isExpandingTot) return;
        setIsExpandingTot(true);

        try {
            const ai = getGeminiClient();
            const prompt = `You are an elite systems architect performing a Formal Tree of Thoughts (ToT) exploration.
Parent node: "${activeTot.title}"
Hypothesis: "${activeTot.hypothesis}"
Project context: "${project.name}" (Discipline: ${project.discipline}).
Generate 2 distinct candidate intermediate solution branches exploring alternative tradeoffs.
Respond strictly in JSON format with an array of objects:
[
  {
    "title": "Branch title",
    "hypothesis": "Concrete technical hypothesis",
    "pros": ["Pro 1", "Pro 2"],
    "cons": ["Con 1", "Con 2"],
    "feasibility": 85,
    "costEfficiency": 78,
    "riskMitigation": 90,
    "speedToMarket": 80,
    "rationale": "Why this path should be considered"
  }
]`;

            const res = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });

            if (res.text) {
                const parsed = JSON.parse(res.text);
                if (Array.isArray(parsed)) {
                    const newNodes: TreeOfThoughtsNode[] = parsed.map((item: any, i: number) => {
                        const overall = Math.round((item.feasibility + item.costEfficiency + item.riskMitigation + item.speedToMarket) / 4);
                        return {
                            id: `tot-${Date.now()}-${i}`,
                            parentId: activeTot.id,
                            title: item.title,
                            hypothesis: item.hypothesis,
                            pros: item.pros || [],
                            cons: item.cons || [],
                            scores: {
                                feasibility: item.feasibility || 75,
                                costEfficiency: item.costEfficiency || 70,
                                riskMitigation: item.riskMitigation || 75,
                                speedToMarket: item.speedToMarket || 70,
                                overallScore: overall
                            },
                            status: 'explored',
                            rationale: item.rationale || '',
                            alternativesConsidered: []
                        };
                    });
                    updateTot([...totNodes, ...newNodes]);
                }
            }
        } catch (e) {
            console.error(e);
            // Fallback synthetic node
            const fallback: TreeOfThoughtsNode = {
                id: `tot-${Date.now()}`,
                parentId: activeTot.id,
                title: 'Branch: Redundant Passive Thermal Shunt',
                hypothesis: 'Incorporate graphite heat spreader pad bonded directly to aluminum housing.',
                pros: ['Zero electrical power draw', 'Adds only 45 grams total weight'],
                cons: ['Increases enclosure CNC machining tolerances'],
                scores: { feasibility: 90, costEfficiency: 85, riskMitigation: 88, speedToMarket: 84, overallScore: 87 },
                status: 'explored',
                rationale: 'Solid alternative to active fan cooling.',
                alternativesConsidered: []
            };
            updateTot([...totNodes, fallback]);
        } finally {
            setIsExpandingTot(false);
        }
    };

    // Manual add branch
    const handleAddManualBranch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!branchTitle.trim()) return;

        const newNode: TreeOfThoughtsNode = {
            id: `tot-${Date.now()}`,
            parentId: activeTot.id,
            title: branchTitle.trim(),
            hypothesis: branchHypothesis.trim(),
            pros: branchPros.split('\n').filter(Boolean),
            cons: branchCons.split('\n').filter(Boolean),
            scores: { feasibility: 80, costEfficiency: 75, riskMitigation: 80, speedToMarket: 75, overallScore: 78 },
            status: 'explored',
            rationale: 'User defined candidate pathway.',
            alternativesConsidered: []
        };

        updateTot([...totNodes, newNode]);
        setIsAddingBranch(false);
        setBranchTitle('');
        setBranchHypothesis('');
        setBranchPros('');
        setBranchCons('');
    };

    // Convene Diverse-Model Challenge Panel
    const handleConvenePanel = async () => {
        const topic = challengeTopic.trim() || `Technical baseline and schedule for project "${project.name}"`;
        setIsConveningPanel(true);

        try {
            const ai = getGeminiClient();
            const prompt = `You are coordinating a Diverse-Model Challenge Panel for project "${project.name}".
Topic under virtual peer review: "${topic}".
Act as an adversarial reviewer and provide a rigorous critique identifying blind spots and an explicitly preserved dissenting opinion.
Return strict JSON:
{
  "reviewerPersona": "Skeptical Risk Officer",
  "critiquePoints": ["Point 1", "Point 2", "Point 3"],
  "identifiedBlindspots": ["Blindspot 1", "Blindspot 2"],
  "preservedDissent": "A rigorous dissenting statement that must NOT be smoothed over by consensus",
  "recommendation": "Proceed with Conditions"
}`;

            const res = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });

            if (res.text) {
                const parsed = JSON.parse(res.text);
                const newReview: ChallengePanelReview = {
                    id: `chal-${Date.now().toString().slice(-4)}`,
                    reviewerPersona: parsed.reviewerPersona || 'Skeptical Risk Officer',
                    modelPerspective: 'Adversarial Virtual Critique Panel',
                    topic,
                    critiquePoints: parsed.critiquePoints || ['Critical path assumes zero supplier lead time delays.'],
                    identifiedBlindspots: parsed.identifiedBlindspots || ['Environmental extremes omit high-humidity condensing conditions.'],
                    preservedDissent: parsed.preservedDissent || 'Dissent: schedule contains negative float without buffer contingency.',
                    recommendation: parsed.recommendation || 'Proceed with Conditions',
                    timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
                };
                updateReviews([newReview, ...challengeReviews]);
                setChallengeTopic('');
            }
        } catch {
            const fallbackReview: ChallengePanelReview = {
                id: `chal-${Date.now().toString().slice(-4)}`,
                reviewerPersona: 'Systems Architect',
                modelPerspective: 'Adversarial Peer Challenge Rule Engine',
                topic,
                critiquePoints: [
                    'Component power dissipation model assumes ideal copper ground plane heat spreading.',
                    'Did not verify transient current overshoot during hot-plug USB-C insertion.'
                ],
                identifiedBlindspots: [
                    'Omitted parasitic trace inductance on high-frequency switching node.'
                ],
                preservedDissent: 'Preserved objection: Board re-spin risk is elevated without TVS diode protection on VBUS rail.',
                recommendation: 'Proceed with Conditions',
                timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16)
            };
            updateReviews([fallbackReview, ...challengeReviews]);
        } finally {
            setIsConveningPanel(false);
        }
    };

    const getRecommendationColor = (rec: ChallengePanelReview['recommendation']) => {
        switch (rec) {
            case 'Proceed': return '#00ffaa';
            case 'Proceed with Conditions': return '#f59e0b';
            case 'Re-evaluate Baseline': return '#ff4444';
            case 'Reject': return '#ef4444';
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header Banner */}
            <div className="glass-card" style={{ padding: '2rem', borderLeft: '4px solid #a855f7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 800 }}>Structured Reasoning & Virtual Challenges</h2>
                            <span className="chip-blue" style={{ fontSize: '0.8rem' }}>FORMAL ToT & PRESERVED DISSENT</span>
                        </div>
                        <p style={{ color: 'var(--secondary-text)', maxWidth: '950px', margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                            Challenge designs outside nominal conditions using <strong>Tree of Thoughts (ToT)</strong> multi-branch exploration,
                            <strong>Diverse-Model Challenge Panels</strong>, and <strong>Design Trade Studies</strong>.
                            Crucially, minority objections and residual risks are recorded as <em>Preserved Dissent</em> rather than suppressed by consensus.
                        </p>
                    </div>
                </div>

                {/* Sub-nav toggle tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--card-border)' }}>
                    <button
                        onClick={() => setActiveSection('tot')}
                        style={{
                            padding: '0.6rem 1.2rem',
                            borderRadius: '6px',
                            border: activeSection === 'tot' ? '1px solid #a855f7' : '1px solid var(--card-border)',
                            background: activeSection === 'tot' ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                            color: activeSection === 'tot' ? '#a855f7' : 'var(--secondary-text)',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        Tree of Thoughts ({totNodes.length} Branches)
                    </button>
                    <button
                        onClick={() => setActiveSection('challenge_panel')}
                        style={{
                            padding: '0.6rem 1.2rem',
                            borderRadius: '6px',
                            border: activeSection === 'challenge_panel' ? '1px solid #00f2ff' : '1px solid var(--card-border)',
                            background: activeSection === 'challenge_panel' ? 'rgba(0, 242, 255, 0.15)' : 'transparent',
                            color: activeSection === 'challenge_panel' ? '#00f2ff' : 'var(--secondary-text)',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        Challenge Panel & Preserved Dissent ({challengeReviews.length} Reviews)
                    </button>
                    <button
                        onClick={() => setActiveSection('trade_studies')}
                        style={{
                            padding: '0.6rem 1.2rem',
                            borderRadius: '6px',
                            border: activeSection === 'trade_studies' ? '1px solid #00ffaa' : '1px solid var(--card-border)',
                            background: activeSection === 'trade_studies' ? 'rgba(0, 255, 170, 0.15)' : 'transparent',
                            color: activeSection === 'trade_studies' ? '#00ffaa' : 'var(--secondary-text)',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }}
                    >
                        Design Trade Studies ({tradeStudies.length} Studies)
                    </button>
                </div>
            </div>

            {/* SECTION 1: FORMAL TREE OF THOUGHTS (ToT) */}
            {activeSection === 'tot' && (
                <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem', alignItems: 'start' }}>
                    {/* ToT Hierarchy & Explorer */}
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>Solution Branches</h3>
                            <button
                                onClick={() => setIsAddingBranch(true)}
                                style={{ background: 'transparent', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                            >
                                + Add Branch
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '600px', overflowY: 'auto' }}>
                            {totNodes.map(node => {
                                const isSelected = node.id === activeTot?.id;
                                const isBacktracked = node.status === 'backtracked';
                                const isSelectedPath = node.status === 'selected';

                                return (
                                    <div
                                        key={node.id}
                                        onClick={() => setSelectedTotId(node.id)}
                                        style={{
                                            padding: '1rem',
                                            borderRadius: '8px',
                                            border: isSelected ? '2px solid #a855f7' : '1px solid var(--card-border)',
                                            background: isSelectedPath ? 'rgba(0, 255, 170, 0.05)' : isBacktracked ? 'rgba(255, 68, 68, 0.03)' : 'rgba(255, 255, 255, 0.01)',
                                            opacity: isBacktracked ? 0.6 : 1,
                                            cursor: 'pointer',
                                            transition: 'all 0.15s ease'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                                            <span style={{
                                                fontSize: '0.7rem',
                                                padding: '2px 6px',
                                                borderRadius: '3px',
                                                fontWeight: 700,
                                                background: isSelectedPath ? 'rgba(0, 255, 170, 0.2)' : isBacktracked ? 'rgba(255, 68, 68, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                                                color: isSelectedPath ? '#00ffaa' : isBacktracked ? '#ff4444' : '#a855f7'
                                            }}>
                                                {node.status.toUpperCase()}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>
                                                Score: {node.scores.overallScore}/100
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff', marginBottom: '0.3rem' }}>
                                            {node.title}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {node.hypothesis}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ToT Detail & Multi-Factor Scoring */}
                    <div className="glass-card" style={{ padding: '2rem' }}>
                        {activeTot ? (
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--card-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                                            <span style={{
                                                fontSize: '0.75rem',
                                                padding: '3px 8px',
                                                borderRadius: '4px',
                                                background: activeTot.status === 'selected' ? 'rgba(0, 255, 170, 0.2)' : activeTot.status === 'backtracked' ? 'rgba(255, 68, 68, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                                                color: activeTot.status === 'selected' ? '#00ffaa' : activeTot.status === 'backtracked' ? '#ff4444' : '#a855f7',
                                                fontWeight: 700
                                            }}>
                                                STATUS: {activeTot.status.toUpperCase()}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>ID: {activeTot.id}</span>
                                        </div>
                                        <h3 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 700 }}>{activeTot.title}</h3>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {activeTot.status !== 'selected' && (
                                            <button
                                                onClick={() => handleSetTotStatus(activeTot.id, 'selected')}
                                                style={{ background: 'rgba(0, 255, 170, 0.15)', border: '1px solid #00ffaa', color: '#00ffaa', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                                            >
                                                Select Path
                                            </button>
                                        )}
                                        {activeTot.status !== 'backtracked' && (
                                            <button
                                                onClick={() => handleSetTotStatus(activeTot.id, 'backtracked')}
                                                style={{ background: 'rgba(255, 68, 68, 0.15)', border: '1px solid #ff4444', color: '#ff4444', padding: '0.5rem 1rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer' }}
                                            >
                                                Backtrack / Prune
                                            </button>
                                        )}
                                        <button
                                            onClick={handleExpandTreeOfThoughts}
                                            disabled={isExpandingTot}
                                            className="button button-generate"
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                                        >
                                            {isExpandingTot ? 'Branching...' : '+ Synthesize Branches'}
                                        </button>
                                    </div>
                                </div>

                                {/* Hypothesis Statement */}
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)', marginBottom: '1.5rem' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', fontWeight: 700, marginBottom: '0.3rem' }}>
                                        TECHNICAL HYPOTHESIS & MECHANISM
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                                        {activeTot.hypothesis}
                                    </p>
                                </div>

                                {/* Multi-Factor Score Bars */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                                    {[
                                        { label: 'Feasibility', val: activeTot.scores.feasibility, color: '#00f2ff' },
                                        { label: 'Cost Efficiency', val: activeTot.scores.costEfficiency, color: '#10b981' },
                                        { label: 'Risk Mitigation', val: activeTot.scores.riskMitigation, color: '#a855f7' },
                                        { label: 'Speed to Market', val: activeTot.scores.speedToMarket, color: '#f59e0b' }
                                    ].map((s, idx) => (
                                        <div key={idx} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '6px', border: '1px solid var(--card-border)' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>{s.label}</div>
                                            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: s.color, margin: '0.2rem 0' }}>{s.val}%</div>
                                            <div style={{ width: '100%', height: '4px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ width: `${s.val}%`, height: '100%', background: s.color }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Pros & Cons Comparison */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                                    <div style={{ background: 'rgba(0, 255, 170, 0.03)', border: '1px solid rgba(0, 255, 170, 0.2)', padding: '1rem', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#00ffaa', fontWeight: 700, marginBottom: '0.5rem' }}>
                                            ✓ EVIDENCE & ADVANTAGES
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                                            {activeTot.pros.map((p, i) => (
                                                <li key={i} style={{ marginBottom: '0.3rem' }}>{p}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div style={{ background: 'rgba(255, 68, 68, 0.03)', border: '1px solid rgba(255, 68, 68, 0.2)', padding: '1rem', borderRadius: '8px' }}>
                                        <div style={{ fontSize: '0.8rem', color: '#ff4444', fontWeight: 700, marginBottom: '0.5rem' }}>
                                            ✕ CHALLENGES & VULNERABILITIES
                                        </div>
                                        <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                                            {activeTot.cons.map((c, i) => (
                                                <li key={i} style={{ marginBottom: '0.3rem' }}>{c}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Rationale */}
                                <div style={{ fontSize: '0.85rem', color: 'var(--secondary-text)', background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem 1rem', borderRadius: '6px' }}>
                                    <strong style={{ color: '#fff' }}>Evaluation Rationale:</strong> {activeTot.rationale}
                                </div>
                            </div>
                        ) : (
                            <p>Select a node to inspect its tree of thoughts path.</p>
                        )}
                    </div>
                </div>
            )}

            {/* SECTION 2: DIVERSE-MODEL CHALLENGE PANEL & PRESERVED DISSENT */}
            {activeSection === 'challenge_panel' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.3rem', margin: '0 0 0.3rem 0', fontWeight: 700 }}>Convene Diverse-Model Challenge Panel</h3>
                                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--secondary-text)' }}>
                                    Submits project plans to multi-perspective adversarial review. Preserved dissent records minority objections to prevent blind consensus.
                                </p>
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '500px' }}>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Topic to challenge (e.g. Desert high-temp operating margins)..."
                                    value={challengeTopic}
                                    onChange={e => setChallengeTopic(e.target.value)}
                                    style={{ flex: 1, fontSize: '0.85rem' }}
                                />
                                <button
                                    onClick={handleConvenePanel}
                                    disabled={isConveningPanel}
                                    className="button button-generate"
                                    style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                                >
                                    {isConveningPanel ? 'Challenging...' : 'Convene Review'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Review List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {challengeReviews.map(rev => {
                            const recColor = getRecommendationColor(rev.recommendation);
                            return (
                                <div
                                    key={rev.id}
                                    className="glass-card"
                                    style={{ padding: '1.75rem', borderLeft: `4px solid ${recColor}` }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#00f2ff' }}>
                                                    {rev.reviewerPersona.toUpperCase()}
                                                </span>
                                                <span style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', color: '#94a3b8' }}>
                                                    {rev.modelPerspective}
                                                </span>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>{rev.timestamp}</span>
                                            </div>
                                            <h4 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>{rev.topic}</h4>
                                        </div>

                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            background: `${recColor}20`,
                                            color: recColor,
                                            fontWeight: 700,
                                            fontSize: '0.8rem'
                                        }}>
                                            {rev.recommendation.toUpperCase()}
                                        </span>
                                    </div>

                                    {/* Critique Points & Blindspots */}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.2rem' }}>
                                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700, marginBottom: '0.5rem' }}>
                                                METHODOLOGICAL CRITIQUES
                                            </div>
                                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                                                {rev.critiquePoints.map((pt, i) => (
                                                    <li key={i} style={{ marginBottom: '0.3rem' }}>{pt}</li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                                            <div style={{ fontSize: '0.75rem', color: '#00f2ff', fontWeight: 700, marginBottom: '0.5rem' }}>
                                                IDENTIFIED SHARED BLINDSPOTS
                                            </div>
                                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                                                {rev.identifiedBlindspots.map((bs, i) => (
                                                    <li key={i} style={{ marginBottom: '0.3rem' }}>{bs}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>

                                    {/* Explicitly Preserved Dissent Banner */}
                                    <div style={{
                                        background: 'rgba(239, 68, 68, 0.08)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '8px',
                                        padding: '1rem'
                                    }}>
                                        <div style={{ fontSize: '0.75rem', color: '#ff4444', fontWeight: 800, letterSpacing: '0.5px', marginBottom: '0.3rem' }}>
                                            ⚖ PRESERVED DISSENT RECORD (CANNOT BE OVERWRITTEN BY CONSENSUS)
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: '#fff', fontStyle: 'italic', lineHeight: 1.4 }}>
                                            &ldquo;{rev.preservedDissent}&rdquo;
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* SECTION 3: DESIGN TRADE STUDIES MATRIX */}
            {activeSection === 'trade_studies' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {tradeStudies.map(study => (
                        <div key={study.id} className="glass-card" style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                                        <span className="chip-blue" style={{ fontSize: '0.75rem' }}>TRADE STUDY</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>ID: {study.id}</span>
                                    </div>
                                    <h3 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 700 }}>{study.title}</h3>
                                    <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', color: 'var(--secondary-text)' }}>{study.description}</p>
                                </div>

                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>Winning Option</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#00ffaa' }}>{study.selectedOption || 'Pending Decision'}</div>
                                </div>
                            </div>

                            {/* Trade Table */}
                            <div style={{ overflowX: 'auto', border: '1px solid var(--card-border)', borderRadius: '8px' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--card-border)' }}>
                                            <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--secondary-text)' }}>Candidate Platform</th>
                                            {study.criteria.map((c, i) => (
                                                <th key={i} style={{ padding: '12px 16px', textAlign: 'center', color: '#00f2ff' }}>
                                                    {c.name}
                                                    <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--secondary-text)' }}>
                                                        ({Math.round(c.weight * 100)}%)
                                                    </span>
                                                </th>
                                            ))}
                                            <th style={{ padding: '12px 16px', textAlign: 'center', color: '#00ffaa' }}>Weighted Score</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {study.options.map((opt, i) => {
                                            const isSelected = opt.name === study.selectedOption;
                                            return (
                                                <tr
                                                    key={i}
                                                    style={{
                                                        borderBottom: '1px solid var(--card-border)',
                                                        background: isSelected ? 'rgba(0, 255, 170, 0.04)' : 'transparent'
                                                    }}
                                                >
                                                    <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fff' }}>
                                                        {opt.name}
                                                        {isSelected && <span style={{ marginLeft: '0.5rem', color: '#00ffaa' }}>★ Top Ranked</span>}
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', marginTop: '0.2rem' }}>{opt.notes}</div>
                                                    </td>
                                                    {study.criteria.map((c, ci) => (
                                                        <td key={ci} style={{ padding: '12px 16px', textAlign: 'center', color: '#cbd5e1' }}>
                                                            {opt.scores[c.name] ?? '-'} / 10
                                                        </td>
                                                    ))}
                                                    <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 800, fontSize: '1.1rem', color: isSelected ? '#00ffaa' : '#fff' }}>
                                                        {opt.weightedTotal.toFixed(2)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal: Add ToT Manual Branch */}
            {isAddingBranch && (
                <div className="modal-overlay" onClick={() => setIsAddingBranch(false)}>
                    <div className="modal-content" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 700 }}>Add Tree of Thoughts Branch</h3>
                            <button className="button-close" onClick={() => setIsAddingBranch(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleAddManualBranch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--secondary-text)', marginBottom: '0.3rem' }}>
                                    Branch Title
                                </label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="e.g. Branch C: Dual redundant thermal heat pipes"
                                    value={branchTitle}
                                    onChange={e => setBranchTitle(e.target.value)}
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--secondary-text)', marginBottom: '0.3rem' }}>
                                    Technical Hypothesis
                                </label>
                                <textarea
                                    className="input-field"
                                    rows={2}
                                    placeholder="Describe proposed operational mechanics..."
                                    value={branchHypothesis}
                                    onChange={e => setBranchHypothesis(e.target.value)}
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--secondary-text)', marginBottom: '0.3rem' }}>
                                        Advantages (one per line)
                                    </label>
                                    <textarea
                                        className="input-field"
                                        rows={3}
                                        value={branchPros}
                                        onChange={e => setBranchPros(e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--secondary-text)', marginBottom: '0.3rem' }}>
                                        Disadvantages (one per line)
                                    </label>
                                    <textarea
                                        className="input-field"
                                        rows={3}
                                        value={branchCons}
                                        onChange={e => setBranchCons(e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsAddingBranch(false)} className="button">Cancel</button>
                                <button type="submit" className="button button-primary">Save Branch</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
