import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Project, Task, Resource, TeamMember, Milestone } from '../types';

export interface ExportOptions {
    includeFullDocuments?: boolean;
    includeTasks?: boolean;
    includeTeam?: boolean;
    includeResources?: boolean;
    includeMilestones?: boolean;
    includeFinancials?: boolean;
}

const diffInDays = (date1: string, date2: string) => {
    if (!date1 || !date2) return 0;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return Math.max(0, Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24)) + 1);
};

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);
};

/**
 * Calculates executive metrics and financial summaries for a project.
 */
export const calculateProjectMetrics = (project: Project) => {
    const tasks = project.tasks || [];
    const resources = project.resources || [];
    const avgLaborRate = project.avgBurdenedLaborRate || 0;
    const budget = project.budget || 0;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'inprogress').length;
    const reviewTasks = tasks.filter(t => t.status === 'review').length;
    const todoTasks = tasks.filter(t => t.status === 'todo').length;
    const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const overdueTasks = tasks.filter(t => t.status !== 'done' && t.endDate && new Date(t.endDate) < new Date()).length;
    const blockedTasks = tasks.filter(task =>
        task.status !== 'done' &&
        task.dependsOn?.some(depId => {
            const prereq = tasks.find(t => t.id === depId);
            return prereq && prereq.status !== 'done';
        })
    ).length;

    const estimatedLaborCost = tasks.reduce((sum, task) => {
        const duration = diffInDays(task.startDate, task.endDate);
        return sum + (duration * 8 * avgLaborRate);
    }, 0);

    const actualLaborCost = tasks.reduce((sum, task) => {
        if (task.status === 'done' || task.actualTime) {
            const duration = task.actualTime || diffInDays(task.startDate, task.endDate);
            return sum + (duration * 8 * avgLaborRate);
        }
        return sum;
    }, 0);

    const estimatedResourceCost = resources.reduce((sum, r) => sum + (r.totalCost || r.estimate || ((r.unitCost || 0) * (r.quantity || 1))), 0);
    const actualResourceCost = resources.reduce((sum, r) => sum + (r.actual || 0), 0);

    const totalProjected = estimatedLaborCost + estimatedResourceCost;
    const totalSpent = actualLaborCost + actualResourceCost;
    const budgetVariance = budget - totalProjected;

    const totalDurationDays = diffInDays(project.startDate, project.endDate);
    const daysElapsed = diffInDays(project.startDate, new Date().toISOString().split('T')[0]);

    const riskLevel = overdueTasks > 3 || blockedTasks > 5 ? 'CRITICAL' : (overdueTasks > 0 || blockedTasks > 0 ? 'MODERATE' : 'OPTIMAL');

    return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        reviewTasks,
        todoTasks,
        progressPercent,
        overdueTasks,
        blockedTasks,
        estimatedLaborCost,
        actualLaborCost,
        estimatedResourceCost,
        actualResourceCost,
        totalProjected,
        totalSpent,
        budgetVariance,
        totalDurationDays,
        daysElapsed,
        riskLevel
    };
};

/**
 * Builds a structured JSON object representing the full project summary.
 */
export const generateProjectJsonSummary = (project: Project, options: ExportOptions = {}) => {
    const metrics = calculateProjectMetrics(project);
    const {
        includeFullDocuments = true,
        includeTasks = true,
        includeTeam = true,
        includeResources = true,
        includeMilestones = true,
        includeFinancials = true
    } = options;

    const documentsWithContent = (project.documents || []).map(doc => {
        const phaseData = project.phasesData?.[doc.id];
        const docSummary: any = {
            id: doc.id,
            title: doc.title,
            phase: doc.phase,
            sequence: doc.sequence,
            version: doc.version,
            status: doc.status,
            type: doc.type || 'text',
            owner: doc.owner
        };

        if (includeFullDocuments && phaseData?.content) {
            docSummary.content = phaseData.content;
            if (phaseData.compactedContent) {
                docSummary.compactedSummary = phaseData.compactedContent;
            }
        }
        return docSummary;
    });

    return {
        exportMetadata: {
            generator: "MIFECO Project Management Accelerator v5.0",
            exportType: "Structured Project Summary (Executive & Operational)",
            generatedAt: new Date().toISOString(),
            schemaVersion: "2.0.0"
        },
        projectOverview: {
            id: project.id,
            name: project.name,
            discipline: project.discipline,
            status: project.isStarted ? "Execution" : "Planning",
            mode: project.mode,
            scope: project.scope,
            teamSize: project.teamSize,
            complexity: project.complexity,
            startDate: project.startDate || "TBD",
            endDate: project.endDate || "TBD",
            totalDurationDays: metrics.totalDurationDays
        },
        executiveKPIs: {
            overallProgressPercent: metrics.progressPercent,
            riskAssessment: metrics.riskLevel,
            taskCompletionRate: `${metrics.completedTasks}/${metrics.totalTasks}`,
            blockedTaskCount: metrics.blockedTasks,
            overdueTaskCount: metrics.overdueTasks,
            totalTeamMembers: (project.team || []).length,
            totalAllocatedResources: (project.resources || []).length
        },
        ...(includeFinancials ? {
            financials: {
                totalBudget: project.budget || 0,
                burdenedHourlyLaborRate: project.avgBurdenedLaborRate || 0,
                estimatedLaborCost: metrics.estimatedLaborCost,
                actualLaborCost: metrics.actualLaborCost,
                estimatedResourceCost: metrics.estimatedResourceCost,
                totalProjectedCost: metrics.totalProjected,
                totalCurrentSpend: metrics.totalSpent,
                budgetVariance: metrics.budgetVariance,
                isWithinBudget: metrics.budgetVariance >= 0
            }
        } : {}),
        ...(includeMilestones ? {
            milestones: (project.milestones || []).map((m: Milestone) => ({
                id: m.id,
                name: m.name,
                plannedDate: m.plannedDate,
                actualDate: m.actualDate || null,
                status: m.status
            }))
        } : {}),
        ...(includeTasks ? {
            taskBreakdown: (project.tasks || []).map((t: Task) => ({
                id: t.id,
                name: t.name,
                role: t.role,
                status: t.status,
                startDate: t.startDate,
                endDate: t.endDate,
                isSubcontracted: t.isSubcontracted,
                dependsOn: t.dependsOn || [],
                actualTimeDays: t.actualTime || null,
                actualCost: t.actualCost || null
            }))
        } : {}),
        ...(includeTeam ? {
            teamHierarchy: (project.team || []).map((tm: TeamMember) => ({
                userId: tm.userId,
                name: tm.name || "Unassigned",
                role: tm.role,
                email: tm.email || "N/A",
                isLeader: !!tm.isLeader
            }))
        } : {}),
        ...(includeResources ? {
            resourceAllocations: (project.resources || []).map((r: Resource) => ({
                id: r.id,
                name: r.name,
                type: r.type,
                unitCost: r.unitCost,
                quantity: r.quantity,
                totalCost: r.totalCost || (r.unitCost * r.quantity)
            }))
        } : {}),
        documentationLifecycle: documentsWithContent
    };
};

/**
 * Downloads the structured JSON summary file.
 */
export const downloadProjectJson = (project: Project, options: ExportOptions = {}) => {
    const data = generateProjectJsonSummary(project, options);
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const sanitizedName = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sanitizedName}-structured-summary.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

/**
 * Generates and downloads a clean, multi-page executive PDF summary.
 */
export const generateProjectPdfSummary = async (project: Project, options: ExportOptions = {}) => {
    const metrics = calculateProjectMetrics(project);
    const {
        includeFullDocuments = false,
        includeTasks = true,
        includeTeam = true,
        includeResources = true,
        includeMilestones = true,
        includeFinancials = true
    } = options;

    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;

    // Palette
    const primaryColor: [number, number, number] = [15, 23, 42]; // Slate 900
    const accentColor: [number, number, number] = [6, 182, 212]; // Cyan 500
    const secondaryColor: [number, number, number] = [99, 102, 241]; // Indigo 500
    const textColor: [number, number, number] = [51, 65, 85]; // Slate 700
    const lightBg: [number, number, number] = [248, 250, 252]; // Slate 50

    let currentY = margin;

    // --- Header Banner ---
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.roundedRect(margin, currentY, contentWidth, 75, 6, 6, 'F');

    // Brand / Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text(project.name, margin + 18, currentY + 28);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text(`MIFECO HYPER-AGILE OS • ${project.discipline.toUpperCase()} • ${project.isStarted ? 'EXECUTION' : 'PLANNING'} PHASE`, margin + 18, currentY + 44);

    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225); // Slate 300
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    doc.text(`Generated: ${dateStr}`, margin + 18, currentY + 60);

    // Right-aligned status badge in header
    doc.setFillColor(255, 255, 255, 0.1);
    doc.roundedRect(pageWidth - margin - 120, currentY + 18, 102, 38, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(`${metrics.progressPercent}%`, pageWidth - margin - 69, currentY + 36, { align: 'center' });
    doc.setFontSize(7);
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
    doc.text('OVERALL PROGRESS', pageWidth - margin - 69, currentY + 48, { align: 'center' });

    currentY += 90;

    // --- Section 1: Executive KPI Dashboard ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('1. Executive Overview & Health Metrics', margin, currentY);
    currentY += 12;

    const kpiData = [
        ['Status', project.isStarted ? 'Active Execution' : 'Planning / Draft', 'Risk Assessment', metrics.riskLevel],
        ['Timeline Window', `${project.startDate || 'TBD'} to ${project.endDate || 'TBD'}`, 'Duration', `${metrics.totalDurationDays} Days (${metrics.daysElapsed} Elapsed)`],
        ['Task Completion', `${metrics.completedTasks} / ${metrics.totalTasks} Tasks (${metrics.progressPercent}%)`, 'Blocked / Overdue', `${metrics.blockedTasks} Blocked / ${metrics.overdueTasks} Overdue`],
        ['Team Size', `${project.team?.length || 0} Registered Roles`, 'Allocated Resources', `${project.resources?.length || 0} Physical/Cloud Assets`]
    ];

    autoTable(doc, {
        startY: currentY,
        head: [],
        body: kpiData,
        theme: 'plain',
        styles: { fontSize: 8.5, cellPadding: 5, textColor: textColor },
        columnStyles: {
            0: { fontStyle: 'bold', textColor: primaryColor, cellWidth: 100 },
            1: { cellWidth: 155 },
            2: { fontStyle: 'bold', textColor: primaryColor, cellWidth: 105 },
            3: { cellWidth: 155 }
        },
        alternateRowStyles: { fillColor: lightBg },
        margin: { left: margin, right: margin }
    });

    currentY = (doc as any).lastAutoTable.finalY + 16;

    // --- Section 2: Financial Health & Budget Variance ---
    if (includeFinancials) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('2. Financial Health & Cost Projections', margin, currentY);
        currentY += 12;

        const financialData = [
            [
                formatCurrency(project.budget || 0),
                formatCurrency(project.avgBurdenedLaborRate || 0) + '/hr',
                formatCurrency(metrics.estimatedLaborCost),
                formatCurrency(metrics.estimatedResourceCost),
                formatCurrency(metrics.totalProjected),
                formatCurrency(metrics.budgetVariance)
            ]
        ];

        autoTable(doc, {
            startY: currentY,
            head: [['Total Budget', 'Avg Labor Rate', 'Projected Labor', 'Projected Materials', 'Total Projected', 'Budget Variance']],
            body: financialData,
            theme: 'grid',
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold', halign: 'center' },
            bodyStyles: { fontSize: 8.5, halign: 'center', textColor: textColor },
            columnStyles: {
                5: {
                    fontStyle: 'bold',
                    textColor: metrics.budgetVariance >= 0 ? [16, 185, 129] : [239, 68, 68]
                }
            },
            margin: { left: margin, right: margin }
        });

        currentY = (doc as any).lastAutoTable.finalY + 16;
    }

    // --- Section 3: Milestones Schedule ---
    if (includeMilestones && project.milestones && project.milestones.length > 0) {
        // Check for page overflow
        if (currentY > pageHeight - 120) {
            doc.addPage();
            currentY = margin;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('3. Key Milestone Deliverables', margin, currentY);
        currentY += 12;

        const milestoneRows = project.milestones.map((m: Milestone, idx: number) => [
            `M-${idx + 1}`,
            m.name,
            m.plannedDate || 'TBD',
            m.actualDate || (m.status === 'done' || m.status === 'Completed' ? 'Completed' : 'Pending'),
            (m.status || 'Planned').toUpperCase()
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Code', 'Milestone Description', 'Target Date', 'Actual Date', 'Status']],
            body: milestoneRows,
            theme: 'striped',
            headStyles: { fillColor: secondaryColor, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8, textColor: textColor },
            margin: { left: margin, right: margin }
        });

        currentY = (doc as any).lastAutoTable.finalY + 16;
    }

    // --- Section 4: Work Breakdown Structure (Tasks) ---
    if (includeTasks && project.tasks && project.tasks.length > 0) {
        if (currentY > pageHeight - 140) {
            doc.addPage();
            currentY = margin;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('4. Work Breakdown Structure & Task Schedule', margin, currentY);
        currentY += 12;

        const taskRows = project.tasks.slice(0, 30).map((t: Task) => [
            t.name,
            t.role || 'Unassigned',
            t.startDate || '-',
            t.endDate || '-',
            t.status.toUpperCase(),
            t.isSubcontracted ? 'External' : 'Internal'
        ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Task Name', 'Assigned Role', 'Start Date', 'End Date', 'Status', 'Scope']],
            body: taskRows,
            theme: 'striped',
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
            bodyStyles: { fontSize: 7.5, textColor: textColor },
            columnStyles: {
                0: { cellWidth: 180 },
                1: { cellWidth: 100 },
                2: { cellWidth: 60 },
                3: { cellWidth: 60 },
                4: { cellWidth: 65 },
                5: { cellWidth: 50 }
            },
            margin: { left: margin, right: margin }
        });

        currentY = (doc as any).lastAutoTable.finalY + 16;
    }

    // --- Section 5: Team & Resource Matrix ---
    if ((includeTeam && project.team && project.team.length > 0) || (includeResources && project.resources && project.resources.length > 0)) {
        if (currentY > pageHeight - 140) {
            doc.addPage();
            currentY = margin;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('5. Human Resources & Physical Capital Allocation', margin, currentY);
        currentY += 12;

        const teamRows = (project.team || []).map((m: TeamMember) => [
            m.role,
            m.name || 'Open Position',
            m.email || 'N/A',
            m.isLeader ? 'Lead / Manager' : 'Individual Contributor'
        ]);

        if (teamRows.length > 0) {
            autoTable(doc, {
                startY: currentY,
                head: [['Role / Functional Title', 'Assignee Name', 'Contact / Email', 'Governance Tier']],
                body: teamRows,
                theme: 'plain',
                headStyles: { fillColor: lightBg, textColor: primaryColor, fontSize: 8, fontStyle: 'bold' },
                bodyStyles: { fontSize: 7.5, textColor: textColor },
                margin: { left: margin, right: margin }
            });

            currentY = (doc as any).lastAutoTable.finalY + 12;
        }

        const resourceRows = (project.resources || []).map((r: Resource) => [
            r.name,
            r.type.toUpperCase(),
            formatCurrency(r.unitCost),
            `${r.quantity}`,
            formatCurrency(r.totalCost || (r.unitCost * r.quantity))
        ]);

        if (resourceRows.length > 0) {
            if (currentY > pageHeight - 100) {
                doc.addPage();
                currentY = margin;
            }

            autoTable(doc, {
                startY: currentY,
                head: [['Resource Item', 'Type', 'Unit Rate', 'Qty / Hours', 'Total Commitment']],
                body: resourceRows,
                theme: 'striped',
                headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
                bodyStyles: { fontSize: 7.5, textColor: textColor },
                margin: { left: margin, right: margin }
            });

            currentY = (doc as any).lastAutoTable.finalY + 16;
        }
    }

    // --- Section 6: 9-Phase Document Index ---
    if (includeFullDocuments && project.documents && project.documents.length > 0) {
        if (currentY > pageHeight - 120) {
            doc.addPage();
            currentY = margin;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('6. 9-Phase HMAP Documentation Suite', margin, currentY);
        currentY += 12;

        const docRows = project.documents
            .filter(d => d.type !== 'image')
            .sort((a, b) => a.phase - b.phase || a.sequence - b.sequence)
            .map(d => [
                `Phase ${d.phase}`,
                d.title,
                d.version || 'v1.0',
                d.status.toUpperCase(),
                d.owner || 'AI Engine'
            ]);

        autoTable(doc, {
            startY: currentY,
            head: [['Phase', 'Document Specification Title', 'Version', 'Status', 'Signoff Owner']],
            body: docRows,
            theme: 'grid',
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8, textColor: textColor },
            margin: { left: margin, right: margin }
        });

        currentY = (doc as any).lastAutoTable.finalY + 16;
    }

    // --- Footer & Page Numbers ---
    const totalPages = (doc.internal as any).getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(148, 163, 184); // Slate 400

        // Bottom divider rule
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, pageHeight - 28, pageWidth - margin, pageHeight - 28);

        doc.text(`MIFECO Project Management Accelerator • Confidential Executive Summary`, margin, pageHeight - 16);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 16, { align: 'right' });
    }

    const sanitizedName = project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`${sanitizedName}-executive-summary.pdf`);
};
