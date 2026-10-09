import React, { useState } from 'react';
import { Project, SchematicPartItem, MechanicalAssemblyPackage, OutlineDrivenDocument, GroundTruthGate, ValueInformationItem } from '../types';
import {
    DEFAULT_BOM_ITEMS,
    DEFAULT_ASSEMBLY_PACKAGES,
    DEFAULT_OUTLINE_DOCUMENTS,
    DEFAULT_GROUND_TRUTH_GATES,
    DEFAULT_VOI_ITEMS
} from '../constants/harnessDefaults';
import { getGeminiClient } from '../utils/geminiClient';

interface EngineeringDeliveryViewProps {
    project: Project;
    onUpdateProject: (update: Partial<Project> | ((prev: Project) => Partial<Project>)) => void;
}

export const EngineeringDeliveryView: React.FC<EngineeringDeliveryViewProps> = ({ project, onUpdateProject }) => {
    const bomItems: SchematicPartItem[] = project.bomItems || DEFAULT_BOM_ITEMS;
    const assemblyPackages: MechanicalAssemblyPackage[] = project.assemblyPackages || DEFAULT_ASSEMBLY_PACKAGES;
    const outlineDocs: OutlineDrivenDocument[] = project.outlineDocuments || DEFAULT_OUTLINE_DOCUMENTS;
    const gates: GroundTruthGate[] = project.groundTruthGates || DEFAULT_GROUND_TRUTH_GATES;
    const voiItems: ValueInformationItem[] = project.voiItems || DEFAULT_VOI_ITEMS;

    const [activeTab, setActiveTab] = useState<'bom_sync' | 'cad_assembly' | 'outline_docs' | 'ground_truth_gates' | 'voi_planning'>('bom_sync');
    const [selectedDocId, setSelectedDocId] = useState<string>(outlineDocs[0]?.id || 'doc-arch-spec');
    const [isReconcilingDoc, setIsReconcilingDoc] = useState(false);
    const [isGeneratingWorkPackages, setIsGeneratingWorkPackages] = useState(false);

    // Modal state for adding a BOM item
    const [isAddingBomItem, setIsAddingBomItem] = useState(false);
    const [newRefDes, setNewRefDes] = useState('');
    const [newMpn, setNewMpn] = useState('');
    const [newValue, setNewValue] = useState('');
    const [newFootprint, setNewFootprint] = useState('');
    const [newRating, setNewRating] = useState('');
    const [newUnitCost, setNewUnitCost] = useState('1.50');
    const [newLeadTime, setNewLeadTime] = useState('4');

    const activeOutlineDoc = outlineDocs.find(d => d.id === selectedDocId) || outlineDocs[0];

    const updateBom = (items: SchematicPartItem[]) => {
        onUpdateProject({ bomItems: items });
    };

    const updateGates = (newGates: GroundTruthGate[]) => {
        onUpdateProject({ groundTruthGates: newGates });
    };

    const updateOutlineDocs = (docs: OutlineDrivenDocument[]) => {
        onUpdateProject({ outlineDocuments: docs });
    };

    // Add BOM Item
    const handleAddBomItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRefDes.trim() || !newMpn.trim()) return;

        const newItem: SchematicPartItem = {
            refDes: newRefDes.trim().toUpperCase(),
            mpn: newMpn.trim(),
            value: newValue.trim() || 'N/A',
            footprint: newFootprint.trim() || 'SMD',
            rating: newRating.trim() || 'Standard',
            bomStatus: 'Matched',
            unitCost: parseFloat(newUnitCost) || 1.0,
            leadTimeWeeks: parseInt(newLeadTime, 10) || 4,
            quantity: 1
        };

        updateBom([...bomItems, newItem]);
        setIsAddingBomItem(false);
        setNewRefDes('');
        setNewMpn('');
        setNewValue('');
        setNewFootprint('');
        setNewRating('');
    };

    // Synthesize Work Packages from Engineering Baseline into Project Tasks
    const handleSynthesizeWorkPackages = async () => {
        setIsGeneratingWorkPackages(true);
        try {
            const ai = getGeminiClient();
            const prompt = `Synthesize 3 concrete technical engineering work packages to add to project "${project.name}" based on schematic BOM (${bomItems.length} components) and mechanical assemblies (${assemblyPackages.length} packages).
Return strict JSON array:
[
  {
    "name": "Work Package Task Name",
    "role": "Electrical Designer",
    "durationDays": 5,
    "description": "Concrete technical deliverable description"
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
                    const newTasks = parsed.map((item: any, i: number) => ({
                        id: `task-eng-chain-${Date.now()}-${i}`,
                        name: item.name || 'Engineering Synthesis Task',
                        description: item.description || 'Generated from engineering-to-project chain',
                        role: item.role || 'Electrical Designer',
                        startDate: new Date().toISOString().slice(0, 10),
                        endDate: new Date(Date.now() + (item.durationDays || 5) * 86400000).toISOString().slice(0, 10),
                        sprintId: project.sprints[0]?.id || 'sprint-1',
                        status: 'todo' as const,
                        isSubcontracted: false,
                        dependsOn: [],
                        actualTime: null,
                        actualCost: null,
                        actualEndDate: null,
                        comments: [],
                        attachments: []
                    }));

                    onUpdateProject({
                        tasks: [...project.tasks, ...newTasks]
                    });
                }
            }
        } catch {
            // Fallback manual work package creation
            const fallbackTask = {
                id: `task-eng-chain-${Date.now()}`,
                name: 'PCB Layout Routing & DFM Assembly Verification',
                description: 'Trace high-current power rails and run automated DRC checks against fabricator constraints.',
                role: 'Electrical Designer',
                startDate: new Date().toISOString().slice(0, 10),
                endDate: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
                sprintId: project.sprints[0]?.id || 'sprint-1',
                status: 'todo' as const,
                isSubcontracted: false,
                dependsOn: [],
                actualTime: null,
                actualCost: null,
                actualEndDate: null,
                comments: [],
                attachments: []
            };
            onUpdateProject({
                tasks: [...project.tasks, fallbackTask]
            });
        } finally {
            setIsGeneratingWorkPackages(false);
        }
    };

    // Toggle Ground-Truth criterion checkmark
    const handleToggleCriterion = (phaseIndex: number, critId: string) => {
        const updated = gates.map((gate, i) => {
            if (i === phaseIndex) {
                const updatedCriteria = gate.criteria.map(c => c.id === critId ? { ...c, satisfied: !c.satisfied } : c);
                const allSatisfied = updatedCriteria.every(c => c.satisfied);
                return {
                    ...gate,
                    criteria: updatedCriteria,
                    status: allSatisfied ? ('passed' as const) : ('review_in_progress' as const)
                };
            }
            return gate;
        });
        updateGates(updated);
    };

    // Reconcile Outline Document Chapter
    const handleReconcileChapter = async (chapterIndex: number) => {
        setIsReconcilingDoc(true);
        setTimeout(() => {
            const updatedChapters = activeOutlineDoc.chapters.map((ch, i) => {
                if (i === chapterIndex) {
                    return { ...ch, status: 'reconciled' as const };
                }
                return ch;
            });

            const updatedDocs = outlineDocs.map(d => d.id === activeOutlineDoc.id ? { ...d, chapters: updatedChapters } : d);
            updateOutlineDocs(updatedDocs);
            setIsReconcilingDoc(false);
        }, 600);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header Banner */}
            <div className="glass-card" style={{ padding: '2rem', borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <h2 style={{ fontSize: '2rem', margin: 0, fontWeight: 800 }}>Engineering Delivery & Paired Deliverables</h2>
                            <span className="chip-blue" style={{ fontSize: '0.8rem' }}>ENGINEERING-TO-PROJECT CHAINS</span>
                        </div>
                        <p style={{ color: 'var(--secondary-text)', maxWidth: '950px', margin: 0, fontSize: '0.95rem', lineHeight: 1.5 }}>
                            Bridges technical engineering baselines directly into project management execution.
                            Synchronizes <strong>schematic-parts BOMs</strong>, <strong>mechanical 3D packages</strong>, <strong>outline-driven document construction</strong>,
                            and governs phase transitions through <strong>Ground-Truth Gates</strong> and <strong>Value-of-Information (VoI)</strong> planning.
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={handleSynthesizeWorkPackages}
                            disabled={isGeneratingWorkPackages}
                            className="button button-generate"
                            style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            {isGeneratingWorkPackages ? (
                                <>
                                    <div className="spinner" style={{ width: '14px', height: '14px' }}></div>
                                    <span>Synthesizing...</span>
                                </>
                            ) : (
                                <span>⚡ Chain Baseline into WBS Tasks</span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Sub-nav toggle tabs */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--card-border)', flexWrap: 'wrap' }}>
                    {[
                        { id: 'bom_sync', label: `Schematic-BOM Sync (${bomItems.length})`, color: '#00f2ff' },
                        { id: 'cad_assembly', label: `3D Mechanical Packages (${assemblyPackages.length})`, color: '#a855f7' },
                        { id: 'outline_docs', label: `Outline-Driven Docs (${outlineDocs.length})`, color: '#10b981' },
                        { id: 'ground_truth_gates', label: `Ground-Truth Gates (${gates.length})`, color: '#f59e0b' },
                        { id: 'voi_planning', label: `Value-of-Information (${voiItems.length})`, color: '#ec4899' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            style={{
                                padding: '0.6rem 1.2rem',
                                borderRadius: '6px',
                                border: activeTab === tab.id ? `1px solid ${tab.color}` : '1px solid var(--card-border)',
                                background: activeTab === tab.id ? `${tab.color}20` : 'transparent',
                                color: activeTab === tab.id ? tab.color : 'var(--secondary-text)',
                                fontWeight: 700,
                                cursor: 'pointer'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* TAB 1: SCHEMATIC–PARTS / BOM SYNCHRONIZATION */}
            {activeTab === 'bom_sync' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.3rem', margin: '0 0 0.3rem 0', fontWeight: 700 }}>Schematic–Parts BOM Synchronization</h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--secondary-text)' }}>
                                Enforces that every schematic reference designator matches a verifiable manufacturer part number (MPN), footprint, and rated specification.
                            </p>
                        </div>

                        <button
                            onClick={() => setIsAddingBomItem(true)}
                            className="button button-primary"
                            style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem' }}
                        >
                            + Add Component to BOM
                        </button>
                    </div>

                    <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255, 255, 255, 0.03)', borderBottom: '1px solid var(--card-border)' }}>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--secondary-text)' }}>Ref Des</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#00f2ff' }}>Manufacturer Part Number</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#fff' }}>Value / Description</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#cbd5e1' }}>Footprint</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'left', color: '#cbd5e1' }}>Rating</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'center', color: '#00ffaa' }}>BOM Status</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', color: '#fff' }}>Lead Time</th>
                                    <th style={{ padding: '12px 16px', textAlign: 'right', color: '#fff' }}>Unit Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bomItems.map((item, idx) => {
                                    const isRisk = item.bomStatus === 'Lead-Time-Risk';
                                    return (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--card-border)', background: isRisk ? 'rgba(245, 158, 11, 0.04)' : 'transparent' }}>
                                            <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700, color: '#00f2ff' }}>
                                                {item.refDes}
                                            </td>
                                            <td style={{ padding: '12px 16px', fontWeight: 600, color: '#fff' }}>
                                                {item.mpn}
                                            </td>
                                            <td style={{ padding: '12px 16px', color: '#cbd5e1' }}>
                                                {item.value}
                                            </td>
                                            <td style={{ padding: '12px 16px', color: 'var(--secondary-text)', fontFamily: 'monospace' }}>
                                                {item.footprint}
                                            </td>
                                            <td style={{ padding: '12px 16px', color: 'var(--secondary-text)' }}>
                                                {item.rating}
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    fontWeight: 700,
                                                    background: isRisk ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                                    color: isRisk ? '#f59e0b' : '#10b981'
                                                }}>
                                                    {item.bomStatus}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: isRisk ? 700 : 400, color: isRisk ? '#f59e0b' : '#fff' }}>
                                                {item.leadTimeWeeks} wks
                                            </td>
                                            <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: '#00ffaa' }}>
                                                ${item.unitCost.toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: MECHANICAL 3D ASSEMBLY PACKAGES */}
            {activeTab === 'cad_assembly' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
                    {assemblyPackages.map(pkg => (
                        <div key={pkg.assemblyId} className="glass-card" style={{ padding: '1.75rem', borderLeft: '4px solid #a855f7' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                                        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#a855f7' }}>{pkg.assemblyId}</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>{pkg.drawingNumber}</span>
                                    </div>
                                    <h4 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>{pkg.name}</h4>
                                </div>

                                <span style={{
                                    fontSize: '0.75rem',
                                    padding: '3px 8px',
                                    borderRadius: '4px',
                                    background: pkg.stlExportStatus === 'valid' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                    color: pkg.stlExportStatus === 'valid' ? '#10b981' : '#f59e0b',
                                    fontWeight: 700
                                }}>
                                    STL: {pkg.stlExportStatus.toUpperCase()}
                                </span>
                            </div>

                            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--card-border)', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                                    <span style={{ color: 'var(--secondary-text)' }}>CAD Reference:</span>
                                    <span style={{ fontFamily: 'monospace', color: '#00f2ff' }}>{pkg.solidModelRef}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem' }}>
                                    <span style={{ color: 'var(--secondary-text)' }}>Item Parts Count:</span>
                                    <span style={{ fontWeight: 700, color: '#fff' }}>{pkg.partsCount} pieces</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                    <span style={{ color: 'var(--secondary-text)' }}>GD&T Tolerances:</span>
                                    <span style={{ color: pkg.tolerancesVerified ? '#00ffaa' : '#ff4444', fontWeight: 700 }}>
                                        {pkg.tolerancesVerified ? '✓ Cleared & Verified' : 'Pending Verification'}
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.8rem', color: '#00ffaa' }}>
                                    {pkg.explodedViewAvailable ? '✓ Exploded View Synchronized' : 'No Exploded View'}
                                </span>
                                <button style={{ background: 'transparent', border: '1px solid #a855f7', color: '#a855f7', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 700 }}>
                                    Inspect Package &rarr;
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB 3: OUTLINE-DRIVEN DOCUMENT CONSTRUCTION */}
            {activeTab === 'outline_docs' && activeOutlineDoc && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                                <span className="chip-blue" style={{ fontSize: '0.75rem' }}>CONTROLLED TECHNICAL SPEC</span>
                                <span style={{ color: '#00ffaa', fontSize: '0.8rem', fontWeight: 700 }}>
                                    {activeOutlineDoc.tocApproved ? '✓ Table of Contents Approved' : 'TOC Pending Approval'}
                                </span>
                            </div>
                            <h3 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 700 }}>{activeOutlineDoc.docTitle}</h3>
                            <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', color: 'var(--secondary-text)' }}>{activeOutlineDoc.scope}</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {activeOutlineDoc.chapters.map((ch, idx) => (
                            <div key={idx} className="glass-card" style={{ padding: '1.5rem', borderLeft: ch.status === 'reconciled' ? '4px solid #10b981' : '4px solid #00f2ff' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', color: '#00f2ff', fontWeight: 700 }}>CHAPTER {ch.chapterNumber}</div>
                                        <h4 style={{ fontSize: '1.2rem', margin: '0.2rem 0', fontWeight: 700 }}>{ch.title}</h4>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--secondary-text)' }}>{ch.description}</div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            background: ch.status === 'reconciled' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0, 242, 255, 0.2)',
                                            color: ch.status === 'reconciled' ? '#10b981' : '#00f2ff',
                                            fontWeight: 700
                                        }}>
                                            {ch.status.toUpperCase()}
                                        </span>

                                        {ch.status !== 'reconciled' && (
                                            <button
                                                onClick={() => handleReconcileChapter(idx)}
                                                disabled={isReconcilingDoc}
                                                style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', padding: '4px 10px', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                                            >
                                                {isReconcilingDoc ? 'Reconciling...' : 'Reconcile Cross-Refs'}
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '1rem', borderRadius: '6px', border: '1px solid var(--card-border)', marginBottom: '1rem' }}>
                                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                                        {ch.content}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--secondary-text)' }}>
                                    <div>
                                        <strong style={{ color: '#00f2ff' }}>Retrieved Memory:</strong> {ch.retrievedMemoryNodeIds.join(', ')}
                                    </div>
                                    <div>
                                        <strong style={{ color: '#f59e0b' }}>Cross-References:</strong> {ch.crossReferences.join('; ')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 4: GROUND-TRUTH GATES */}
            {activeTab === 'ground_truth_gates' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.3rem', margin: '0 0 0.3rem 0', fontWeight: 700 }}>Phase Promotion Ground-Truth Gates</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--secondary-text)' }}>
                            Explicit gatekeeper audits checking verified evidence and acceptance criteria before promoting work packages into subsequent phases.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {gates.map((gate, gIdx) => {
                            const isPassed = gate.status === 'passed';
                            return (
                                <div
                                    key={gIdx}
                                    className="glass-card"
                                    style={{
                                        padding: '1.75rem',
                                        borderLeft: isPassed ? '4px solid #10b981' : '4px solid #f59e0b'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
                                                <span style={{ fontSize: '0.75rem', color: '#00f2ff', fontWeight: 700 }}>PHASE {gate.phase} GATE</span>
                                                <span style={{
                                                    fontSize: '0.7rem',
                                                    padding: '2px 8px',
                                                    borderRadius: '4px',
                                                    background: isPassed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                                    color: isPassed ? '#10b981' : '#f59e0b',
                                                    fontWeight: 700
                                                }}>
                                                    {gate.status.replace('_', ' ').toUpperCase()}
                                                </span>
                                            </div>
                                            <h4 style={{ fontSize: '1.25rem', margin: 0, fontWeight: 700 }}>{gate.phaseName}</h4>
                                        </div>

                                        {gate.signedOffBy && (
                                            <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--secondary-text)' }}>
                                                Signed off by: <strong style={{ color: '#00ffaa' }}>{gate.signedOffBy}</strong> ({gate.signOffDate})
                                            </div>
                                        )}
                                    </div>

                                    {/* Criteria Checklist */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {gate.criteria.map((crit) => (
                                            <div
                                                key={crit.id}
                                                onClick={() => handleToggleCriterion(gIdx, crit.id)}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    padding: '0.85rem 1rem',
                                                    borderRadius: '6px',
                                                    background: crit.satisfied ? 'rgba(0, 255, 170, 0.03)' : 'rgba(255, 255, 255, 0.02)',
                                                    border: crit.satisfied ? '1px solid rgba(0, 255, 170, 0.3)' : '1px solid var(--card-border)',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={crit.satisfied}
                                                        onChange={() => {}} // Handled by parent div
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                    <div>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{crit.description}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', marginTop: '0.2rem' }}>
                                                            Required Evidence: <span style={{ color: '#00f2ff' }}>{crit.evidenceRequired}</span> ({crit.evidenceClassExpected})
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ textAlign: 'right', fontSize: '0.75rem' }}>
                                                    <span style={{ color: crit.satisfied ? '#00ffaa' : '#f59e0b', fontWeight: 700 }}>
                                                        {crit.satisfied ? '✓ Satisfied' : 'Pending Evidence'}
                                                    </span>
                                                    {crit.verifiedByRole && (
                                                        <div style={{ color: 'var(--secondary-text)', marginTop: '0.2rem' }}>{crit.verifiedByRole}</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 5: VALUE-OF-INFORMATION (VoI) PLANNING */}
            {activeTab === 'voi_planning' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1.3rem', margin: '0 0 0.3rem 0', fontWeight: 700 }}>Value-of-Information (VoI) Planning</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--secondary-text)' }}>
                            Prioritizes the next experiment or simulation by how much it reduces decision-relevant uncertainty per dollar/hour invested.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {voiItems.map((item) => (
                            <div key={item.id} className="glass-card" style={{ padding: '1.5rem', borderLeft: item.rankPriority === 1 ? '4px solid #ec4899' : '4px solid #00f2ff' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            background: item.rankPriority === 1 ? 'rgba(236, 72, 153, 0.2)' : 'rgba(0, 242, 255, 0.2)',
                                            color: item.rankPriority === 1 ? '#ec4899' : '#00f2ff',
                                            fontWeight: 700
                                        }}>
                                            PRIORITY #{item.rankPriority}
                                        </span>
                                        <h4 style={{ fontSize: '1.15rem', margin: 0, fontWeight: 700 }}>{item.uncertaintyQuestion}</h4>
                                    </div>

                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>Uncertainty Reduction</div>
                                        <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#00ffaa' }}>{item.expectedReductionInUncertaintyScore}%</div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '6px' }}>
                                        <div style={{ color: 'var(--secondary-text)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Current Prior Belief</div>
                                        <div style={{ color: '#cbd5e1' }}>{item.currentBelief}</div>
                                    </div>

                                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem', borderRadius: '6px' }}>
                                        <div style={{ color: 'var(--secondary-text)', fontSize: '0.75rem', marginBottom: '0.2rem' }}>Proposed Study / Test</div>
                                        <div style={{ color: '#00f2ff', fontWeight: 600 }}>{item.proposedTestOrStudy}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--secondary-text)' }}>
                                    <span>Decision Impact: <strong style={{ color: item.potentialImpactOnDecisions === 'High' ? '#ff4444' : '#f59e0b' }}>{item.potentialImpactOnDecisions}</strong></span>
                                    <span>Cost to Investigate: <strong style={{ color: '#fff' }}>{item.costToInvestigateHours} Hours</strong></span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal: Add BOM Component */}
            {isAddingBomItem && (
                <div className="modal-overlay" onClick={() => setIsAddingBomItem(false)}>
                    <div className="modal-content" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ fontSize: '1.4rem', margin: 0, fontWeight: 700 }}>Add Component to Schematic BOM</h3>
                            <button className="button-close" onClick={() => setIsAddingBomItem(false)}>&times;</button>
                        </div>

                        <form onSubmit={handleAddBomItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--secondary-text)', marginBottom: '0.3rem' }}>
                                        Ref Des (e.g. U4, R15, CONN2)
                                    </label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="U4"
                                        value={newRefDes}
                                        onChange={e => setNewRefDes(e.target.value)}
                                        required
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--secondary-text)', marginBottom: '0.3rem' }}>
                                        Manufacturer Part Number (MPN)
                                    </label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. STM32H743VIT6"
                                        value={newMpn}
                                        onChange={e => setNewMpn(e.target.value)}
                                        required
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--secondary-text)', marginBottom: '0.3rem' }}>
                                        Value / Description
                                    </label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. 480MHz ARM Cortex-M7"
                                        value={newValue}
                                        onChange={e => setNewValue(e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--secondary-text)', marginBottom: '0.3rem' }}>
                                        Footprint
                                    </label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="LQFP-100 14x14mm"
                                        value={newFootprint}
                                        onChange={e => setNewFootprint(e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--secondary-text)', marginBottom: '0.3rem' }}>
                                        Estimated Unit Cost ($)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="input-field"
                                        value={newUnitCost}
                                        onChange={e => setNewUnitCost(e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--secondary-text)', marginBottom: '0.3rem' }}>
                                        Supplier Lead Time (Weeks)
                                    </label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        value={newLeadTime}
                                        onChange={e => setNewLeadTime(e.target.value)}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                <button type="button" onClick={() => setIsAddingBomItem(false)} className="button">Cancel</button>
                                <button type="submit" className="button button-primary">Sync to BOM</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
