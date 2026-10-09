export interface PhaseBlocker {
    id: string;
    description: string;
    severity?: 'critical' | 'high' | 'medium';
    status: 'active' | 'user_mitigated' | 'auto_resolved';
    detectedAt?: string;
    mitigatedAt?: string;
    resolutionNotes?: string;
}

export const DEFAULT_PHASE_BLOCKERS: Record<string, PhaseBlocker[]> = {
    phase1: [
        {
            id: 'BLK-P1-01',
            description: 'Target unit economics boundary condition unverified: BOM cost ceiling lacks component supplier quotes.',
            severity: 'critical',
            status: 'active'
        },
        {
            id: 'BLK-P1-02',
            description: 'Customer operational duty cycle (16-hr battery runtime) conflicting with proposed mechanical enclosure volume.',
            severity: 'high',
            status: 'active'
        }
    ],
    phase2: [
        {
            id: 'BLK-P2-01',
            description: 'Single-source staffing dependency: specialized RF antenna simulation architect unavailable until sprint 4.',
            severity: 'critical',
            status: 'active'
        },
        {
            id: 'BLK-P2-02',
            description: 'External environmental testing lab lead time exceeds 6 weeks; booking slot unconfirmed.',
            severity: 'medium',
            status: 'active'
        }
    ],
    phase3: [
        {
            id: 'BLK-P3-01',
            description: 'Critical procurement blocker: primary micro-controller lead time quoted at 18 weeks from distributor.',
            severity: 'critical',
            status: 'active'
        },
        {
            id: 'BLK-P3-02',
            description: 'Chassis heat sink dissipation margin insufficient under 60°C direct desert solar soak.',
            severity: 'high',
            status: 'active'
        }
    ],
    phase4: [
        {
            id: 'BLK-P4-01',
            description: 'Regulatory certification compliance budget (FCC Part 15 / CE RED) omitted from kickoff cost baseline.',
            severity: 'critical',
            status: 'active'
        },
        {
            id: 'BLK-P4-02',
            description: 'Stakeholder sign-off gap: customer technical authority approval required on interface connector pinouts.',
            severity: 'high',
            status: 'active'
        }
    ],
    phase5: [
        {
            id: 'BLK-P5-01',
            description: 'Statement of Work §3.2 contains ambiguous dimensional tolerance specs (±0.2mm vs ±1.0mm enclosure fit).',
            severity: 'critical',
            status: 'active'
        },
        {
            id: 'BLK-P5-02',
            description: 'Milestone warranty commitment requires supplier SLA agreement not yet executed.',
            severity: 'medium',
            status: 'active'
        }
    ],
    phase6: [
        {
            id: 'BLK-P6-01',
            description: 'Preliminary architecture blocker: buck regulator peak ripple current (4.85A) exceeds 4.5A inductor rating.',
            severity: 'critical',
            status: 'active'
        },
        {
            id: 'BLK-P6-02',
            description: 'Thermal interface material (TIM) conductivity rated at 1.5 W/m-K causes FET junction overheating.',
            severity: 'high',
            status: 'active'
        }
    ],
    phase7: [
        {
            id: 'BLK-P7-01',
            description: 'Detailed PCB layout: power bus trace width of 30 mil exceeds IPC-2221 temperature rise limit of 10°C.',
            severity: 'critical',
            status: 'active'
        },
        {
            id: 'BLK-P7-02',
            description: 'Fabrication panelization turnaround overlaps with firmware bring-up test bench reservation.',
            severity: 'high',
            status: 'active'
        }
    ],
    phase8: [
        {
            id: 'BLK-P8-01',
            description: 'Sprint backlog blocker: 50Hz telemetry burst creates ring buffer overflow in MCU SRAM without QSPI PSRAM driver.',
            severity: 'critical',
            status: 'active'
        },
        {
            id: 'BLK-P8-02',
            description: 'Cellular uplink duty cycle draws 160mA average, violating battery lifecycle requirement §4.1.',
            severity: 'high',
            status: 'active'
        }
    ],
    phase9: [
        {
            id: 'BLK-P9-01',
            description: 'Acceptance test procedure ATP-01 lacks cold-chamber battery pre-heat protocol for -30°C qualification.',
            severity: 'critical',
            status: 'active'
        },
        {
            id: 'BLK-P9-02',
            description: 'Undervoltage lockout (UVLO) trip threshold calibrated to 12.0V instead of 9.0V for 3S battery topology.',
            severity: 'critical',
            status: 'active'
        }
    ]
};

const STORAGE_PREFIX = 'hmap_blockers_';

/**
 * Normalizes a phase ID (e.g. 'phase1' or 'doc-1234')
 */
export function getPhaseKey(phaseId: string, originalPhaseId?: string): string {
    if (originalPhaseId) return originalPhaseId.toLowerCase();
    const match = phaseId.match(/phase\d+/i);
    if (match) return match[0].toLowerCase();
    return phaseId;
}

/**
 * Gets the blockers for a given phase, retrieving from localStorage or defaults
 */
export function getPhaseBlockers(projectId: string, phaseId: string, originalPhaseId?: string): PhaseBlocker[] {
    const key = `${STORAGE_PREFIX}${projectId || 'default'}_${phaseId}`;
    try {
        const raw = localStorage.getItem(key);
        if (raw) {
            return JSON.parse(raw);
        }
    } catch (e) {
        console.warn('Failed to parse phase blockers from localStorage', e);
    }

    const phaseKey = getPhaseKey(phaseId, originalPhaseId);
    const defaults = DEFAULT_PHASE_BLOCKERS[phaseKey] || DEFAULT_PHASE_BLOCKERS['phase1'] || [];
    return defaults.map(b => ({ ...b }));
}

/**
 * Saves blockers for a given phase to localStorage and fires sync event
 */
export function savePhaseBlockers(projectId: string, phaseId: string, blockers: PhaseBlocker[]): void {
    const key = `${STORAGE_PREFIX}${projectId || 'default'}_${phaseId}`;
    try {
        localStorage.setItem(key, JSON.stringify(blockers));
        window.dispatchEvent(new CustomEvent('hmap-blocker-updated', {
            detail: { projectId: projectId || 'default', phaseId, blockers }
        }));
    } catch (e) {
        console.warn('Failed to save phase blockers to localStorage', e);
    }
}

/**
 * Updates a blocker's status to 'user_mitigated' or 'auto_resolved'
 */
export function updateBlockerStatus(
    projectId: string,
    phaseId: string,
    blockerId: string,
    newStatus: 'user_mitigated' | 'auto_resolved',
    originalPhaseId?: string,
    resolutionNotes?: string
): PhaseBlocker[] {
    const current = getPhaseBlockers(projectId, phaseId, originalPhaseId);
    const updated = current.map(b => {
        if (b.id === blockerId) {
            return {
                ...b,
                status: newStatus,
                mitigatedAt: new Date().toISOString(),
                resolutionNotes: resolutionNotes || (newStatus === 'user_mitigated' ? 'Mitigated by user review' : 'Resolved via auto-prompting')
            };
        }
        return b;
    });
    savePhaseBlockers(projectId, phaseId, updated);
    return updated;
}
