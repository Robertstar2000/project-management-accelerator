// A collection of pure functions for data parsing and transformation.
// In a production environment, these logic functions would likely reside on a backend server
// and be accessed via API endpoints.

export const parseMarkdownTable = (sectionString: string) => {
    if (!sectionString) return [];
    const lines = sectionString.trim().split('\n');
    let headerIndex = -1;
    for (let i = 0; i < lines.length - 1; i++) {
        const currentRow = lines[i];
        const nextRow = lines[i+1];
        if (currentRow.includes('|') && nextRow.match(/^[|\s-:]+$/) && nextRow.includes('-')) {
            headerIndex = i;
            break;
        }
    }
    if (headerIndex === -1) return [];
    const headerLine = lines[headerIndex];
    const dataLines = lines.slice(headerIndex + 2);
    const headers = headerLine.split('|').map(h => h.trim().toLowerCase().replace(/[()]/g, '').replace(/[\s-]+/g, '_'));
    const data = dataLines.map(row => {
        if (!row.includes('|')) return null; 
        const values = row.split('|').map(v => v.trim());
        if (values.length !== headers.length) return null;
        const obj: { [key: string]: string } = {};
        headers.forEach((header, index) => {
            if (header) {
                obj[header] = values[index];
            }
        });
        return obj;
    }).filter(Boolean);
    return data as any[];
};

export const parseImpact = (impactString) => {
    if (!impactString) return { days: 0, cost: 0 };
    const daysMatch = impactString.match(/([+-]?\s*\d+)\s*d/);
    const costMatch = impactString.match(/([+-]?\s*[\d,]+)\s*c/);
    return {
        days: daysMatch ? parseInt(daysMatch[1].replace(/\s/g, ''), 10) : 0,
        cost: costMatch ? parseInt(costMatch[1].replace(/\s|,/g, ''), 10) : 0,
    };
};

export const applyImpact = (baseline, impact) => {
    const newEndDate = new Date(baseline.endDate);
    newEndDate.setDate(newEndDate.getDate() + impact.days);
    return {
        endDate: newEndDate.toISOString().split('T')[0],
        budget: baseline.budget + impact.cost,
    };
};

export const parseResourcesFromMarkdown = (markdownText: string): string[] => {
    if (!markdownText) return [];
    const lines = markdownText.split('\n');
    // Keywords that indicate a section is NOT about physical resources/software/hardware
    // We want to exclude "Roles" and "Partners" from the "Resources" list if possible, 
    // or include them if the user considers them resources. 
    // Usually "Resources" implies Hardware/Software in this context if Roles are separate.
    // Let's look for "Hardware", "Software", "Tools", "Equipment".
    
    const resourceSectionKeywords = ['hardware', 'software', 'tools', 'equipment', 'technology', 'stack'];
    const resources = new Set<string>();
    let inResourceSection = false;

    for (const line of lines) {
        if (line.startsWith('#')) {
            const headingText = line.toLowerCase();
            inResourceSection = resourceSectionKeywords.some(keyword => headingText.includes(keyword));
        }
        
        if (line.trim().match(/^[-*]\s+/) && inResourceSection) {
            const resourceName = line
                .replace(/^[-*]\s+/, '') // remove bullet
                .replace(/\*\*/g, '')  // remove bold markers
                .split(/[:(]/)[0]      // remove descriptions
                .trim();
            
            if (resourceName && resourceName.toLowerCase() !== 'none') {
                resources.add(resourceName);
            }
        }
    }
    return Array.from(resources);
};

export const parseRolesFromMarkdown = (markdownText: string): string[] => {
    if (!markdownText) return [];
    const lines = markdownText.split('\n');
    const roleSectionKeywords = ['roles', 'personnel', 'team members', 'team', 'staff', 'partners'];
    const roles = new Set<string>();
    let inRoleSection = false;

    for (const line of lines) {
        if (line.startsWith('#')) {
            const headingText = line.toLowerCase();
            inRoleSection = roleSectionKeywords.some(keyword => headingText.includes(keyword));
        }

        if (line.trim().match(/^[-*]\s+/) && inRoleSection) {
            const roleName = line
                .replace(/^[-*]\s+/, '')
                .replace(/\*\*/g, '')
                .split(/[:(]/)[0]
                .trim();
            
            if (roleName && roleName.toLowerCase() !== 'none') {
                roles.add(roleName);
            }
        }
    }
    return Array.from(roles);
};