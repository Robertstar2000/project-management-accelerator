import React, { useState, useMemo } from 'react';
import { Project } from '../types';
import { 
    downloadProjectJson, 
    generateProjectPdfSummary, 
    generateProjectJsonSummary, 
    calculateProjectMetrics,
    ExportOptions 
} from '../utils/exportService';
import { 
    FileText, 
    Download, 
    Copy, 
    Check, 
    X, 
    FileCode, 
    Sliders, 
    ShieldCheck, 
    Share2, 
    BarChart3, 
    DollarSign, 
    Users, 
    CheckSquare, 
    Layers,
    ExternalLink
} from 'lucide-react';

interface ProjectExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: Project;
}

export const ProjectExportModal: React.FC<ProjectExportModalProps> = ({ isOpen, onClose, project }) => {
    const [exportFormat, setExportFormat] = useState<'pdf' | 'json' | 'markdown'>('pdf');
    const [isGenerating, setIsGenerating] = useState(false);
    const [copied, setCopied] = useState(false);
    const [previewTab, setPreviewTab] = useState<'options' | 'preview'>('options');

    const [options, setOptions] = useState<ExportOptions>({
        includeFinancials: true,
        includeMilestones: true,
        includeTasks: true,
        includeTeam: true,
        includeResources: true,
        includeFullDocuments: false
    });

    const metrics = useMemo(() => calculateProjectMetrics(project), [project]);

    const jsonPreview = useMemo(() => {
        if (!isOpen) return '';
        const data = generateProjectJsonSummary(project, options);
        return JSON.stringify(data, null, 2);
    }, [project, options, isOpen]);

    const markdownSummary = useMemo(() => {
        return `# Executive Summary: ${project.name}
**Discipline:** ${project.discipline} | **Status:** ${project.isStarted ? 'Execution' : 'Planning'} | **Generated:** ${new Date().toLocaleDateString()}

### Key Project Health Indicators
- **Overall Progress:** ${metrics.progressPercent}%
- **Tasks Complete:** ${metrics.completedTasks}/${metrics.totalTasks}
- **Risk Level:** ${metrics.riskLevel} (${metrics.blockedTasks} Blocked, ${metrics.overdueTasks} Overdue)
- **Timeline:** ${project.startDate || 'TBD'} to ${project.endDate || 'TBD'} (${metrics.totalDurationDays} days)

### Financial Summary
- **Total Budget:** $${(project.budget || 0).toLocaleString()}
- **Estimated Labor:** $${metrics.estimatedLaborCost.toLocaleString()}
- **Total Projected Cost:** $${metrics.totalProjected.toLocaleString()}
- **Budget Variance:** $${metrics.budgetVariance.toLocaleString()} (${metrics.budgetVariance >= 0 ? 'Within Budget' : 'Over Budget'})

### Team & Resources
- **Team Size:** ${(project.team || []).length} registered roles
- **Allocated Assets:** ${(project.resources || []).length} physical & cloud items
- **Documentation Suite:** ${(project.documents || []).length} phase deliverables
`;
    }, [project, metrics]);

    if (!isOpen) return null;

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            if (exportFormat === 'json') {
                downloadProjectJson(project, options);
            } else if (exportFormat === 'pdf') {
                await generateProjectPdfSummary(project, options);
            } else if (exportFormat === 'markdown') {
                const blob = new Blob([markdownSummary], { type: 'text/markdown' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-summary.md`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Export failed:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopy = () => {
        const textToCopy = exportFormat === 'json' ? jsonPreview : markdownSummary;
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const toggleOption = (key: keyof ExportOptions) => {
        setOptions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
            <div 
                className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                id="project-export-modal"
            >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-900/90">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                            <Share2 className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white tracking-wide">Export Structured Summary</h2>
                            <p className="text-xs text-slate-400">Package {project.name} data for stakeholders and external sharing</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        aria-label="Close export modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    
                    {/* Format Selector Pills */}
                    <div>
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-3">
                            Select Output Format
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            <button
                                onClick={() => setExportFormat('pdf')}
                                className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                                    exportFormat === 'pdf'
                                        ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                                        : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600'
                                }`}
                            >
                                <div className={`p-2 rounded-lg ${exportFormat === 'pdf' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                                        Executive PDF
                                        {exportFormat === 'pdf' && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">Multi-page stylized report with tables & metrics</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setExportFormat('json')}
                                className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                                    exportFormat === 'json'
                                        ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                                        : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600'
                                }`}
                            >
                                <div className={`p-2 rounded-lg ${exportFormat === 'json' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                                    <FileCode className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                                        Structured JSON
                                        {exportFormat === 'json' && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">Machine-readable hierarchical dataset</p>
                                </div>
                            </button>

                            <button
                                onClick={() => setExportFormat('markdown')}
                                className={`flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
                                    exportFormat === 'markdown'
                                        ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                                        : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600'
                                }`}
                            >
                                <div className={`p-2 rounded-lg ${exportFormat === 'markdown' ? 'bg-cyan-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
                                    <Share2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                                        Markdown Brief
                                        {exportFormat === 'markdown' && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5">Quick copyable memo for Slack or Email</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* View mode toggle: Config vs Raw Preview */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPreviewTab('options')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                                    previewTab === 'options' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <Sliders className="w-3.5 h-3.5" />
                                Customization Options
                            </button>
                            <button
                                onClick={() => setPreviewTab('preview')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                                    previewTab === 'preview' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Live Dataset Preview
                            </button>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                            {metrics.totalTasks} Tasks • ${(project.budget || 0).toLocaleString()} Budget
                        </div>
                    </div>

                    {/* Options Pane */}
                    {previewTab === 'options' ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label 
                                    onClick={() => toggleOption('includeFinancials')}
                                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${
                                        options.includeFinancials ? 'bg-slate-800/80 border-cyan-500/40 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-400'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <DollarSign className={`w-4 h-4 ${options.includeFinancials ? 'text-emerald-400' : 'text-slate-500'}`} />
                                        <div>
                                            <div className="text-xs font-bold">Financial Health & Variance</div>
                                            <div className="text-[11px] text-slate-400">Budget, labor rates, and projected spend</div>
                                        </div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={options.includeFinancials} 
                                        onChange={() => {}} 
                                        className="rounded border-slate-700 text-cyan-500 focus:ring-0" 
                                    />
                                </label>

                                <label 
                                    onClick={() => toggleOption('includeMilestones')}
                                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${
                                        options.includeMilestones ? 'bg-slate-800/80 border-cyan-500/40 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-400'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <BarChart3 className={`w-4 h-4 ${options.includeMilestones ? 'text-indigo-400' : 'text-slate-500'}`} />
                                        <div>
                                            <div className="text-xs font-bold">Key Milestones & Deliverables</div>
                                            <div className="text-[11px] text-slate-400">Planned vs actual delivery dates</div>
                                        </div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={options.includeMilestones} 
                                        onChange={() => {}} 
                                        className="rounded border-slate-700 text-cyan-500 focus:ring-0" 
                                    />
                                </label>

                                <label 
                                    onClick={() => toggleOption('includeTasks')}
                                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${
                                        options.includeTasks ? 'bg-slate-800/80 border-cyan-500/40 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-400'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <CheckSquare className={`w-4 h-4 ${options.includeTasks ? 'text-cyan-400' : 'text-slate-500'}`} />
                                        <div>
                                            <div className="text-xs font-bold">Work Breakdown Structure (WBS)</div>
                                            <div className="text-[11px] text-slate-400">All tasks, role owners, and dependencies</div>
                                        </div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={options.includeTasks} 
                                        onChange={() => {}} 
                                        className="rounded border-slate-700 text-cyan-500 focus:ring-0" 
                                    />
                                </label>

                                <label 
                                    onClick={() => toggleOption('includeTeam')}
                                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${
                                        options.includeTeam ? 'bg-slate-800/80 border-cyan-500/40 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-400'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Users className={`w-4 h-4 ${options.includeTeam ? 'text-purple-400' : 'text-slate-500'}`} />
                                        <div>
                                            <div className="text-xs font-bold">Team Hierarchy & Roles</div>
                                            <div className="text-[11px] text-slate-400">Lead roles, engineers, and contacts</div>
                                        </div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={options.includeTeam} 
                                        onChange={() => {}} 
                                        className="rounded border-slate-700 text-cyan-500 focus:ring-0" 
                                    />
                                </label>

                                <label 
                                    onClick={() => toggleOption('includeResources')}
                                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${
                                        options.includeResources ? 'bg-slate-800/80 border-cyan-500/40 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-400'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Layers className={`w-4 h-4 ${options.includeResources ? 'text-amber-400' : 'text-slate-500'}`} />
                                        <div>
                                            <div className="text-xs font-bold">Physical & Asset Resources</div>
                                            <div className="text-[11px] text-slate-400">Equipment, units, and rates</div>
                                        </div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={options.includeResources} 
                                        onChange={() => {}} 
                                        className="rounded border-slate-700 text-cyan-500 focus:ring-0" 
                                    />
                                </label>

                                <label 
                                    onClick={() => toggleOption('includeFullDocuments')}
                                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-colors ${
                                        options.includeFullDocuments ? 'bg-slate-800/80 border-cyan-500/40 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-400'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className={`w-4 h-4 ${options.includeFullDocuments ? 'text-rose-400' : 'text-slate-500'}`} />
                                        <div>
                                            <div className="text-xs font-bold">Full Phase Document Texts</div>
                                            <div className="text-[11px] text-slate-400">Includes complete Markdown specs</div>
                                        </div>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        checked={options.includeFullDocuments} 
                                        onChange={() => {}} 
                                        className="rounded border-slate-700 text-cyan-500 focus:ring-0" 
                                    />
                                </label>
                            </div>

                            {/* Executive Summary Card Preview */}
                            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-slate-300">Executive Snapshot</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        metrics.riskLevel === 'OPTIMAL' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                        metrics.riskLevel === 'MODERATE' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}>
                                        RISK: {metrics.riskLevel}
                                    </span>
                                </div>
                                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                                        <div className="text-slate-400 text-[10px]">Progress</div>
                                        <div className="text-base font-bold text-cyan-400">{metrics.progressPercent}%</div>
                                    </div>
                                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                                        <div className="text-slate-400 text-[10px]">Tasks Done</div>
                                        <div className="text-base font-bold text-white">{metrics.completedTasks}/{metrics.totalTasks}</div>
                                    </div>
                                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                                        <div className="text-slate-400 text-[10px]">Budget</div>
                                        <div className="text-base font-bold text-white">${(project.budget || 0).toLocaleString()}</div>
                                    </div>
                                    <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                                        <div className="text-slate-400 text-[10px]">Variance</div>
                                        <div className={`text-base font-bold ${metrics.budgetVariance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            ${metrics.budgetVariance.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Live JSON / Markdown Code Preview */
                        <div className="relative">
                            <div className="flex items-center justify-between bg-slate-950 px-4 py-2 rounded-t-xl border border-slate-800 border-b-0 text-xs text-slate-400">
                                <span>{exportFormat === 'json' ? 'project-summary.json' : 'project-summary.md'}</span>
                                <span>{exportFormat === 'json' ? `${Math.round(jsonPreview.length / 1024)} KB` : `${markdownSummary.length} chars`}</span>
                            </div>
                            <pre className="w-full h-64 bg-slate-950 text-cyan-300 font-mono text-[11px] p-4 rounded-b-xl border border-slate-800 overflow-auto leading-relaxed select-all">
                                {exportFormat === 'json' ? jsonPreview : markdownSummary}
                            </pre>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90">
                    <button
                        onClick={handleCopy}
                        className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 border border-slate-700 transition-colors"
                    >
                        {copied ? (
                            <>
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-400">Copied to Clipboard!</span>
                            </>
                        ) : (
                            <>
                                <Copy className="w-4 h-4" />
                                <span>Copy {exportFormat.toUpperCase()}</span>
                            </>
                        )}
                    </button>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 text-xs font-semibold transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={isGenerating}
                            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
                        >
                            {isGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                                    <span>Generating {exportFormat.toUpperCase()}...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    <span>Download {exportFormat === 'pdf' ? 'Executive PDF' : exportFormat === 'json' ? 'JSON Dataset' : 'Markdown'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
