import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import { Project } from '../types';
import {
    UPSTREAM_PRESETS,
    D3GraphNode,
    D3GraphLink,
    DependencyGraphData,
    buildDependencyGraph,
    getStoredDependencyState,
    saveStoredDependencyState,
    StoredDependencyState
} from '../utils/dependencyAwareLogic';
import { 
    AlertTriangle, 
    CheckCircle2, 
    RefreshCw, 
    ZoomIn, 
    ZoomOut, 
    RotateCcw, 
    Layers, 
    Activity, 
    FileText, 
    CheckSquare, 
    SlidersHorizontal,
    Info,
    ExternalLink
} from 'lucide-react';

interface D3DependencyForceGraphProps {
    project?: Project;
    onNodeSelect?: (node: D3GraphNode) => void;
    compact?: boolean;
}

export const D3DependencyForceGraph: React.FC<D3DependencyForceGraphProps> = ({
    project,
    onNodeSelect,
    compact = false
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Local state loaded from persistence
    const [state, setState] = useState<StoredDependencyState>(() => getStoredDependencyState(project?.id));
    const [selectedNode, setSelectedNode] = useState<D3GraphNode | null>(null);
    const [filterCategory, setFilterCategory] = useState<'all' | 'stale' | 'calculation' | 'document' | 'task'>('all');
    const [isRecomputing, setIsRecomputing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Active preset
    const activePreset = useMemo(() => {
        return UPSTREAM_PRESETS.find(p => p.id === state.activePresetId) || UPSTREAM_PRESETS[0];
    }, [state.activePresetId]);

    // Build graph data
    const graphData: DependencyGraphData = useMemo(() => {
        return buildDependencyGraph(state.activePresetId, project, state);
    }, [state, project]);

    // Listen for external updates (e.g. from table reconciliation or other tabs)
    useEffect(() => {
        const handleStateChange = (e: any) => {
            if (e.detail?.projectId === (project?.id || 'default')) {
                setState(e.detail.state);
            }
        };
        window.addEventListener('hmap-dependency-state-changed', handleStateChange);
        return () => window.removeEventListener('hmap-dependency-state-changed', handleStateChange);
    }, [project?.id]);

    const handlePresetChange = (presetId: string) => {
        const nextState = { ...state, activePresetId: presetId };
        setState(nextState);
        saveStoredDependencyState(nextState, project?.id);
        setSelectedNode(null);
    };

    // Reconcile / Recompute single item
    const handleReconcileNode = (node: D3GraphNode) => {
        const nextState = { ...state };
        const presetId = state.activePresetId;

        if (node.type === 'calculation') {
            const currentCalcs = nextState.calcsState[presetId] || [...activePreset.calculations];
            nextState.calcsState = {
                ...nextState.calcsState,
                [presetId]: currentCalcs.map(c => c.id === node.id ? { ...c, status: 'Verified' as const } : c)
            };
        } else if (node.type === 'document') {
            const currentDocs = nextState.docsState[presetId] || [...activePreset.documents];
            nextState.docsState = {
                ...nextState.docsState,
                [presetId]: currentDocs.map(d => d.id === node.id ? { ...d, status: 'Reconciled' as const } : d)
            };
        } else if (node.type === 'task') {
            const currentTasks = nextState.tasksState[presetId] || [...activePreset.tasks];
            nextState.tasksState = {
                ...nextState.tasksState,
                [presetId]: currentTasks.map(t => t.id === node.id ? { ...t, status: 'Rescheduled' as const } : t)
            };
        }

        setState(nextState);
        saveStoredDependencyState(nextState, project?.id);

        // Update selected node display
        setSelectedNode(prev => prev && prev.id === node.id ? { ...prev, isStale: false, status: 'Verified/Reconciled' } : prev);
    };

    // Batch Recompute All
    const handleBatchRecomputeAll = () => {
        setIsRecomputing(true);
        setTimeout(() => {
            const presetId = state.activePresetId;
            const verifiedCalcs = activePreset.calculations.map(c => ({ ...c, status: 'Verified' as const }));
            const reconciledDocs = activePreset.documents.map(d => ({ ...d, status: 'Reconciled' as const }));
            const rescheduledTasks = activePreset.tasks.map(t => ({ ...t, status: 'Rescheduled' as const }));

            const nextState: StoredDependencyState = {
                ...state,
                calcsState: { ...state.calcsState, [presetId]: verifiedCalcs },
                docsState: { ...state.docsState, [presetId]: reconciledDocs },
                tasksState: { ...state.tasksState, [presetId]: rescheduledTasks }
            };

            setState(nextState);
            saveStoredDependencyState(nextState, project?.id);
            setIsRecomputing(false);
            if (selectedNode) {
                setSelectedNode(prev => prev ? { ...prev, isStale: false, status: 'Verified/Reconciled' } : null);
            }
        }, 500);
    };

    // Reset Perturbation to Stale Baseline
    const handleResetPerturbation = () => {
        const presetId = state.activePresetId;
        const nextState = {
            ...state,
            calcsState: { ...state.calcsState, [presetId]: activePreset.calculations },
            docsState: { ...state.docsState, [presetId]: activePreset.documents },
            tasksState: { ...state.tasksState, [presetId]: activePreset.tasks }
        };
        setState(nextState);
        saveStoredDependencyState(nextState, project?.id);
        setSelectedNode(null);
    };

    // D3 Force Simulation Lifecycle
    useEffect(() => {
        if (!svgRef.current) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll('*').remove(); // Clear previous render

        const width = containerRef.current ? containerRef.current.clientWidth : 900;
        const height = compact ? 420 : 600;

        // Filter nodes and links
        let filteredNodes = graphData.nodes.map(d => ({ ...d }));
        if (filterCategory === 'stale') {
            filteredNodes = filteredNodes.filter(n => n.isStale);
        } else if (filterCategory !== 'all') {
            filteredNodes = filteredNodes.filter(n => n.type === filterCategory || n.type === 'input');
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filteredNodes = filteredNodes.filter(n => 
                n.label.toLowerCase().includes(term) || 
                n.id.toLowerCase().includes(term) ||
                (n.details.role && n.details.role.toLowerCase().includes(term))
            );
        }

        const nodeIds = new Set(filteredNodes.map(n => n.id));
        const filteredLinks = graphData.links
            .filter(l => {
                const sourceId = typeof l.source === 'object' ? (l.source as any).id : l.source;
                const targetId = typeof l.target === 'object' ? (l.target as any).id : l.target;
                return nodeIds.has(sourceId) && nodeIds.has(targetId);
            })
            .map(l => ({ ...l }));

        // Definitions: Arrows, gradients, glow filters
        const defs = svg.append('defs');

        // Glow filter for stale items
        const filter = defs.append('filter')
            .attr('id', 'pulse-glow')
            .attr('x', '-50%')
            .attr('y', '-50%')
            .attr('width', '200%')
            .attr('height', '200%');
        filter.append('feGaussianBlur')
            .attr('stdDeviation', '4')
            .attr('result', 'coloredBlur');
        const feMerge = filter.append('feMerge');
        feMerge.append('feMergeNode').attr('in', 'coloredBlur');
        feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

        // Arrow marker: Stale (Red/Amber)
        defs.append('marker')
            .attr('id', 'arrow-stale')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 28)
            .attr('refY', 0)
            .attr('markerWidth', 7)
            .attr('markerHeight', 7)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#f59e0b');

        // Arrow marker: Clean (Cyan/Green)
        defs.append('marker')
            .attr('id', 'arrow-clean')
            .attr('viewBox', '0 -5 10 10')
            .attr('refX', 28)
            .attr('refY', 0)
            .attr('markerWidth', 7)
            .attr('markerHeight', 7)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
            .attr('fill', '#10b981');

        // Container group for zoom & pan
        const g = svg.append('g').attr('class', 'graph-root-group');

        // Zoom setup
        const zoom = d3.zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.3, 3])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        svg.call(zoom);

        // Simulation setup
        const simulation = d3.forceSimulation<D3GraphNode>(filteredNodes)
            .force('link', d3.forceLink<D3GraphNode, any>(filteredLinks)
                .id(d => d.id)
                .distance((d: any) => {
                    if (d.type === 'perturbs') return 120;
                    if (d.type === 'informs') return 140;
                    if (d.type === 'triggers') return 130;
                    return 100;
                })
            )
            .force('charge', d3.forceManyBody().strength(-400))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collision', d3.forceCollide().radius(45));

        // Links
        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(filteredLinks)
            .enter()
            .append('line')
            .attr('stroke', d => d.isStale ? '#f59e0b' : 'rgba(255,255,255,0.2)')
            .attr('stroke-width', d => d.isStale ? 2.5 : 1.5)
            .attr('stroke-dasharray', d => d.isStale ? '4,3' : 'none')
            .attr('marker-end', d => d.isStale ? 'url(#arrow-stale)' : 'url(#arrow-clean)');

        // Nodes group
        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(filteredNodes)
            .enter()
            .append('g')
            .attr('class', 'node-group')
            .style('cursor', 'pointer')
            .call(
                d3.drag<SVGGElement, D3GraphNode>()
                    .on('start', (event, d) => {
                        if (!event.active) simulation.alphaTarget(0.3).restart();
                        d.fx = d.x;
                        d.fy = d.y;
                    })
                    .on('drag', (event, d) => {
                        d.fx = event.x;
                        d.fy = event.y;
                    })
                    .on('end', (event, d) => {
                        if (!event.active) simulation.alphaTarget(0);
                        d.fx = null;
                        d.fy = null;
                    })
            )
            .on('click', (event, d) => {
                event.stopPropagation();
                setSelectedNode(d);
                if (onNodeSelect) onNodeSelect(d);
            });

        // Pulsing rings for stale nodes
        node.filter(d => d.isStale && d.type !== 'input')
            .append('circle')
            .attr('r', 26)
            .attr('fill', 'none')
            .attr('stroke', '#ff4444')
            .attr('stroke-width', 2)
            .attr('opacity', 0.6)
            .attr('filter', 'url(#pulse-glow)');

        // Node base shapes by type
        node.each(function (d) {
            const el = d3.select(this);

            if (d.type === 'input') {
                // Diamond for Upstream Input
                el.append('polygon')
                    .attr('points', '0,-24 24,0 0,24 -24,0')
                    .attr('fill', 'url(#input-gradient)')
                    .attr('stroke', '#a855f7')
                    .attr('stroke-width', 2.5)
                    .attr('fill', '#6b21a8');
            } else if (d.type === 'calculation') {
                // Circle for Calculations
                el.append('circle')
                    .attr('r', 20)
                    .attr('fill', d.isStale ? '#7f1d1d' : '#064e3b')
                    .attr('stroke', d.isStale ? '#ef4444' : '#10b981')
                    .attr('stroke-width', 2.5);
            } else if (d.type === 'document') {
                // Rounded Rectangle for Documents
                el.append('rect')
                    .attr('x', -20)
                    .attr('y', -16)
                    .attr('width', 40)
                    .attr('height', 32)
                    .attr('rx', 6)
                    .attr('fill', d.isStale ? '#78350f' : '#1e3a8a')
                    .attr('stroke', d.isStale ? '#f59e0b' : '#3b82f6')
                    .attr('stroke-width', 2.5);
            } else if (d.type === 'task') {
                // Rounded capsule for Tasks
                el.append('rect')
                    .attr('x', -22)
                    .attr('y', -16)
                    .attr('width', 44)
                    .attr('height', 32)
                    .attr('rx', 12)
                    .attr('fill', d.isStale ? '#7c2d12' : '#065f46')
                    .attr('stroke', d.isStale ? '#f97316' : '#059669')
                    .attr('stroke-width', 2.5);
            } else {
                // Octagon/Circle for Gates
                el.append('circle')
                    .attr('r', 16)
                    .attr('fill', d.isStale ? '#450a0a' : '#134e4a')
                    .attr('stroke', d.isStale ? '#f87171' : '#14b8a6')
                    .attr('stroke-width', 2);
            }

            // Node Glyph / Short icon
            let glyph = '●';
            if (d.type === 'input') glyph = '⚡';
            else if (d.type === 'calculation') glyph = 'ƒ';
            else if (d.type === 'document') glyph = '📄';
            else if (d.type === 'task') glyph = '⚙';
            else if (d.type === 'prerequisite') glyph = '🔒';

            el.append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', '0.35em')
                .attr('fill', '#ffffff')
                .attr('font-size', '12px')
                .attr('font-weight', 'bold')
                .text(glyph);

            // Stale review badge indicator on top
            if (d.isStale) {
                const badge = el.append('g').attr('transform', 'translate(14, -14)');
                badge.append('circle')
                    .attr('r', 7)
                    .attr('fill', '#ef4444')
                    .attr('stroke', '#ffffff')
                    .attr('stroke-width', 1.5);
                badge.append('text')
                    .attr('text-anchor', 'middle')
                    .attr('dy', '0.35em')
                    .attr('fill', '#ffffff')
                    .attr('font-size', '9px')
                    .attr('font-weight', 'bold')
                    .text('!');
            }

            // Label text below node
            el.append('text')
                .attr('text-anchor', 'middle')
                .attr('y', 30)
                .attr('fill', d.isStale ? '#fca5a5' : '#e2e8f0')
                .attr('font-size', '11px')
                .attr('font-weight', '600')
                .text(d.label.length > 22 ? d.label.substring(0, 20) + '…' : d.label);

            if (d.sublabel) {
                el.append('text')
                    .attr('text-anchor', 'middle')
                    .attr('y', 43)
                    .attr('fill', '#94a3b8')
                    .attr('font-size', '9px')
                    .text(d.sublabel.length > 24 ? d.sublabel.substring(0, 22) + '…' : d.sublabel);
            }
        });

        // Simulation tick update
        simulation.on('tick', () => {
            link
                .attr('x1', (d: any) => d.source.x)
                .attr('y1', (d: any) => d.source.y)
                .attr('x2', (d: any) => d.target.x)
                .attr('y2', (d: any) => d.target.y);

            node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
        });

        // Reset zoom helper
        (svgRef.current as any).__resetZoom = () => {
            svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity);
        };

        (svgRef.current as any).__zoomIn = () => {
            svg.transition().duration(300).call(zoom.scaleBy, 1.3);
        };

        (svgRef.current as any).__zoomOut = () => {
            svg.transition().duration(300).call(zoom.scaleBy, 0.7);
        };

        return () => {
            simulation.stop();
        };
    }, [graphData, filterCategory, searchTerm, compact]);

    const handleZoomIn = () => {
        if ((svgRef.current as any)?.__zoomIn) (svgRef.current as any).__zoomIn();
    };

    const handleZoomOut = () => {
        if ((svgRef.current as any)?.__zoomOut) (svgRef.current as any).__zoomOut();
    };

    const handleResetZoom = () => {
        if ((svgRef.current as any)?.__resetZoom) (svgRef.current as any).__resetZoom();
    };

    return (
        <div ref={containerRef} className="glass-card" style={{ padding: compact ? '1rem' : '1.5rem', position: 'relative', overflow: 'hidden' }}>
            {/* Top Bar: Title & Stats */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
                        <Activity size={22} color="#00f2ff" />
                        <h3 style={{ margin: 0, fontSize: compact ? '1.1rem' : '1.35rem', fontWeight: 800, background: 'linear-gradient(135deg, #00f2ff 0%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            HMAP Dependency Chain & Impact Graph
                        </h3>
                        <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '100px', background: 'rgba(0, 242, 255, 0.1)', color: '#00f2ff', border: '1px solid rgba(0, 242, 255, 0.3)', fontWeight: 700 }}>
                            D3 Force-Directed
                        </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--secondary-text)' }}>
                        Interactive graph of upstream perturbations propagating to calculations, HMAP phase documentation, and scheduled work packages.
                    </p>
                </div>

                {/* Score Summary Chips */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: graphData.staleCount > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        border: graphData.staleCount > 0 ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)'
                    }}>
                        {graphData.staleCount > 0 ? (
                            <AlertTriangle size={15} color="#ef4444" />
                        ) : (
                            <CheckCircle2 size={15} color="#10b981" />
                        )}
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: graphData.staleCount > 0 ? '#ef4444' : '#10b981' }}>
                            {graphData.staleCount > 0 ? `${graphData.staleCount} STALE ITEMS` : 'ALL RECONCILED'}
                        </span>
                    </div>

                    <button
                        onClick={handleBatchRecomputeAll}
                        disabled={isRecomputing || graphData.staleCount === 0}
                        className="button button-generate"
                        style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                        <RefreshCw size={14} className={isRecomputing ? 'animate-spin' : ''} />
                        <span>{isRecomputing ? 'Recomputing...' : '⚡ Reconcile All'}</span>
                    </button>

                    <button
                        onClick={handleResetPerturbation}
                        className="button"
                        style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--secondary-text)', border: '1px solid var(--card-border)' }}
                        title="Reset simulation to initial perturbed state"
                    >
                        Reset
                    </button>
                </div>
            </div>

            {/* Upstream Preset Selector */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1rem', padding: '0.6rem 0.8rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--secondary-text)', marginRight: '0.5rem' }}>
                    Active Perturbation:
                </span>
                {UPSTREAM_PRESETS.map(preset => (
                    <button
                        key={preset.id}
                        onClick={() => handlePresetChange(preset.id)}
                        style={{
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            border: state.activePresetId === preset.id ? '1px solid #00f2ff' : '1px solid rgba(255, 255, 255, 0.08)',
                            background: state.activePresetId === preset.id ? 'rgba(0, 242, 255, 0.15)' : 'transparent',
                            color: state.activePresetId === preset.id ? '#00f2ff' : 'var(--secondary-text)'
                        }}
                    >
                        [{preset.domain}] {preset.title}
                    </button>
                ))}
            </div>

            {/* Controls Bar: Filters & Search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--secondary-text)', marginRight: '0.2rem' }}>Filter:</span>
                    {(['all', 'stale', 'calculation', 'document', 'task'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setFilterCategory(tab)}
                            style={{
                                padding: '3px 10px',
                                borderRadius: '100px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                border: filterCategory === tab ? '1px solid #a855f7' : '1px solid rgba(255, 255, 255, 0.08)',
                                background: filterCategory === tab ? 'rgba(168, 85, 247, 0.2)' : 'transparent',
                                color: filterCategory === tab ? '#e9d5ff' : 'var(--secondary-text)'
                            }}
                        >
                            {tab === 'all' && 'All Nodes'}
                            {tab === 'stale' && `⚠️ Stale (${graphData.staleCount})`}
                            {tab === 'calculation' && `ƒ(x) Calcs (${graphData.staleCalcsCount})`}
                            {tab === 'document' && `Docs (${graphData.unreviewedDocsCount})`}
                            {tab === 'task' && `Tasks (${graphData.outdatedTasksCount})`}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Search node..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            padding: '4px 10px',
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid var(--card-border)',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '0.75rem',
                            width: '140px'
                        }}
                    />

                    {/* Zoom Buttons */}
                    <button onClick={handleZoomIn} className="button" style={{ padding: '4px 8px', borderRadius: '4px' }} title="Zoom In">
                        <ZoomIn size={14} />
                    </button>
                    <button onClick={handleZoomOut} className="button" style={{ padding: '4px 8px', borderRadius: '4px' }} title="Zoom Out">
                        <ZoomOut size={14} />
                    </button>
                    <button onClick={handleResetZoom} className="button" style={{ padding: '4px 8px', borderRadius: '4px' }} title="Reset View">
                        <RotateCcw size={14} />
                    </button>
                </div>
            </div>

            {/* SVG Canvas Area */}
            <div style={{ position: 'relative', width: '100%', height: compact ? '420px' : '580px', background: 'radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.8) 0%, rgba(2, 6, 23, 0.95) 100%)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
                <svg
                    ref={svgRef}
                    style={{ width: '100%', height: '100%', display: 'block' }}
                />

                {/* Legend Overlay */}
                <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    left: '12px',
                    background: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    display: 'flex',
                    gap: '12px',
                    fontSize: '11px',
                    color: '#94a3b8',
                    flexWrap: 'wrap',
                    pointerEvents: 'none'
                }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '10px', height: '10px', background: '#a855f7', transform: 'rotate(45deg)' }} /> Input
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} /> Stale Calc
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '10px', height: '8px', borderRadius: '2px', background: '#f59e0b' }} /> Pending Doc
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '12px', height: '8px', borderRadius: '4px', background: '#f97316' }} /> Outdated Task
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} /> Reconciled
                    </span>
                </div>

                {/* Stale Alert Watermark */}
                {graphData.staleCount > 0 && (
                    <div style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.35)',
                        backdropFilter: 'blur(6px)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        color: '#f87171',
                        fontWeight: 700
                    }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
                        <span>Upstream change detected: {graphData.staleCount} downstream dependencies require re-review</span>
                    </div>
                )}
            </div>

            {/* Selected Node Inspection Drawer */}
            {selectedNode && (
                <div style={{
                    marginTop: '1rem',
                    padding: '1.25rem',
                    background: selectedNode.isStale ? 'rgba(239, 68, 68, 0.05)' : 'rgba(16, 185, 129, 0.05)',
                    border: selectedNode.isStale ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                    borderRadius: '8px',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#00f2ff', fontWeight: 800 }}>
                                    {selectedNode.id}
                                </span>
                                <span style={{
                                    fontSize: '0.7rem',
                                    padding: '2px 8px',
                                    borderRadius: '100px',
                                    background: selectedNode.isStale ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                    color: selectedNode.isStale ? '#ef4444' : '#10b981',
                                    fontWeight: 700
                                }}>
                                    {selectedNode.isStale ? '⚠️ REQUIRES RE-REVIEW' : '✓ RECONCILED / ALIGNED'}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--secondary-text)', textTransform: 'uppercase' }}>
                                    TYPE: {selectedNode.type.toUpperCase()}
                                </span>
                            </div>

                            <h4 style={{ margin: '0.2rem 0', fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
                                {selectedNode.label}
                            </h4>

                            {selectedNode.details.role && (
                                <div style={{ fontSize: '0.8rem', color: 'var(--secondary-text)', marginTop: '4px' }}>
                                    Responsible Role: <strong style={{ color: '#00f2ff' }}>{selectedNode.details.role}</strong>
                                </div>
                            )}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {selectedNode.isStale && (
                                <button
                                    onClick={() => handleReconcileNode(selectedNode)}
                                    className="button button-generate"
                                    style={{ padding: '6px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                >
                                    <CheckCircle2 size={14} />
                                    <span>
                                        {selectedNode.type === 'calculation' ? 'Recompute & Verify' : selectedNode.type === 'document' ? 'Mark Document Reconciled' : 'Update Task Baseline'}
                                    </span>
                                </button>
                            )}
                            <button
                                onClick={() => setSelectedNode(null)}
                                className="button"
                                style={{ padding: '6px 10px', fontSize: '0.8rem', color: 'var(--secondary-text)' }}
                            >
                                Close
                            </button>
                        </div>
                    </div>

                    {/* Details grid */}
                    <div style={{ marginTop: '0.85rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.8rem' }}>
                        {selectedNode.details.formula && (
                            <div style={{ gridColumn: '1 / -1', background: 'rgba(0, 0, 0, 0.4)', padding: '0.6rem 0.8rem', borderRadius: '4px', fontFamily: 'monospace', color: '#cbd5e1' }}>
                                <strong>Formula:</strong> {selectedNode.details.formula}
                            </div>
                        )}

                        {selectedNode.details.oldValue && (
                            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--card-border)' }}>
                                <div style={{ color: 'var(--secondary-text)', fontSize: '0.75rem' }}>Previous Nominal Value</div>
                                <div style={{ color: '#94a3b8', textDecoration: 'line-through', fontWeight: 600 }}>{selectedNode.details.oldValue}</div>
                            </div>
                        )}

                        {selectedNode.details.newValue && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.08)', padding: '0.6rem', borderRadius: '4px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                <div style={{ color: '#f87171', fontSize: '0.75rem' }}>New Perturbed Value</div>
                                <div style={{ color: '#ef4444', fontWeight: 800 }}>{selectedNode.details.newValue}</div>
                            </div>
                        )}

                        {selectedNode.details.notes && (
                            <div style={{ gridColumn: '1 / -1', color: 'var(--secondary-text)', lineHeight: 1.4 }}>
                                <strong>Engineering Context / Rationale:</strong> {selectedNode.details.notes}
                            </div>
                        )}

                        {selectedNode.details.downstream && selectedNode.details.downstream.length > 0 && (
                            <div style={{ gridColumn: '1 / -1', color: '#f59e0b' }}>
                                <strong>Blocked Downstream Milestones:</strong> {selectedNode.details.downstream.join(', ')}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
