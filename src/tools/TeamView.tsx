import React, { useState, useMemo, useEffect } from 'react';
import { Project, User } from '../types';
import { parseRolesFromMarkdown } from '../utils/be-logic';

interface TeamAssignmentsViewProps {
    project: Project;
    onUpdateTeam: (newTeam: any, newOwnerId?: string) => void;
    currentUser: User;
}

export const TeamAssignmentsView: React.FC<TeamAssignmentsViewProps> = ({ project, onUpdateTeam, currentUser }) => {
    const teamAssignments = useMemo(() => project.team || [], [project.team]);
    const [newRoleName, setNewRoleName] = useState('');
    const [newMemberName, setNewMemberName] = useState('');
    const [newMemberEmail, setNewMemberEmail] = useState('');

    const extractedRoles = useMemo(() => {
        const resourceDoc = project.documents?.find(d => d.title === 'Resources & Skills List');
        if (!resourceDoc || !project.phasesData || !project.phasesData[resourceDoc.id]) return [];
        return parseRolesFromMarkdown(project.phasesData[resourceDoc.id].content);
    }, [project.documents, project.phasesData]);

    const taskRoles = useMemo(() => {
        return Array.from(new Set((project.tasks || []).map(t => t.role).filter(Boolean)));
    }, [project.tasks]);

    // Auto-synchronize extracted/task roles into project.team if missing
    useEffect(() => {
        const existingRoles = new Set(teamAssignments.map(m => m.role));
        const allIdentifiedRoles = Array.from(new Set([...extractedRoles, ...taskRoles]));
        const missingRoles = allIdentifiedRoles.filter(r => r && !existingRoles.has(r));

        if (missingRoles.length > 0) {
            const additions = missingRoles.map(role => ({
                userId: `team-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
                role,
                name: '',
                email: ''
            }));
            onUpdateTeam([...teamAssignments, ...additions]);
        }
    }, [extractedRoles, taskRoles, teamAssignments, onUpdateTeam]);

    const handleAssignmentChange = (index: number, field: string, value: string) => {
        const newAssignments = [...teamAssignments];
        if (newAssignments[index]) {
            newAssignments[index] = { ...newAssignments[index], [field]: value };
            onUpdateTeam(newAssignments);
        }
    };

    const handleAddMember = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoleName.trim()) return;

        const newMember = {
            userId: `team-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            role: newRoleName.trim(),
            name: newMemberName.trim(),
            email: newMemberEmail.trim()
        };

        onUpdateTeam([...teamAssignments, newMember]);
        setNewRoleName('');
        setNewMemberName('');
        setNewMemberEmail('');
    };

    const handleRemoveMember = (userId: string) => {
        if (userId === project.ownerId) {
            alert("Cannot remove the Project Owner.");
            return;
        }
        const updated = teamAssignments.filter(m => m.userId !== userId);
        onUpdateTeam(updated);
    };

    const handleTransferOwnership = (newOwnerId: string) => {
        if (!window.confirm("Are you sure you want to transfer ownership of this project? This action cannot be undone.")) return;
        
        const newTeam = teamAssignments.map(member => {
            if (member.userId === newOwnerId) return { ...member, role: 'Project Owner' };
            if (member.userId === project.ownerId) return { ...member, role: 'Team Member' };
            return member;
        });

        onUpdateTeam(newTeam, newOwnerId);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h3 className="subsection-title" style={{ margin: 0 }}>Team & Roles Directory</h3>
                    <p style={{ color: 'var(--secondary-text)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
                        Central team registry ({teamAssignments.length} {teamAssignments.length === 1 ? 'member' : 'members'}). Assign team members to roles and configure project ownership.
                    </p>
                </div>
            </div>

            {/* Add Team Member Form */}
            <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                <input 
                    type="text" 
                    placeholder="Role (e.g. Lead Engineer, QA)..." 
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    required
                    style={{ flex: '1 1 200px', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)', background: 'rgba(15, 23, 42, 0.6)', color: 'var(--primary-text)' }}
                />
                <input 
                    type="text" 
                    placeholder="Member Name (optional)..." 
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    style={{ flex: '1 1 180px', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)', background: 'rgba(15, 23, 42, 0.6)', color: 'var(--primary-text)' }}
                />
                <input 
                    type="email" 
                    placeholder="Email Address (optional)..." 
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    style={{ flex: '1 1 200px', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--card-border)', background: 'rgba(15, 23, 42, 0.6)', color: 'var(--primary-text)' }}
                />
                <button type="submit" className="button button-primary" style={{ whiteSpace: 'nowrap' }}>+ Add Team Role</button>
            </form>

            <div style={{ overflowX: 'auto' }}>
                <table className="task-list-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 0.5rem' }}>
                    <thead>
                        <tr>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Role</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Assigned To (Name)</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Email</th>
                            <th style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {teamAssignments.map((member, idx) => {
                            const isOwner = member.userId === project.ownerId || member.role === 'Project Owner';
                            return (
                                <tr key={member.userId || idx} style={{ background: 'rgba(255,255,255,0.02)', cursor: 'initial' }}>
                                    <td style={{ padding: '0.75rem 1rem', borderRadius: '8px 0 0 8px' }}>
                                        <input 
                                            type="text" 
                                            value={member.role} 
                                            onChange={(e) => handleAssignmentChange(idx, 'role', e.target.value)}
                                            style={{ width: '100%', background: 'transparent', border: 'none', color: 'var(--primary-text)', fontWeight: 600 }}
                                        />
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <input 
                                            type="text" 
                                            placeholder="Unassigned"
                                            value={member.name || ''} 
                                            onChange={(e) => handleAssignmentChange(idx, 'name', e.target.value)} 
                                            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)', borderRadius: '4px', padding: '0.4rem 0.6rem', color: 'var(--primary-text)' }}
                                        />
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <input 
                                            type="email" 
                                            placeholder="name@organization.com"
                                            value={member.email || ''} 
                                            onChange={(e) => handleAssignmentChange(idx, 'email', e.target.value)} 
                                            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--card-border)', borderRadius: '4px', padding: '0.4rem 0.6rem', color: 'var(--primary-text)' }}
                                        />
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', borderRadius: '0 8px 8px 0', whiteSpace: 'nowrap' }}>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            {isOwner ? (
                                                <span style={{ color: 'var(--accent-color)', fontWeight: 600, fontSize: '0.85rem' }}>👑 Project Owner</span>
                                            ) : (
                                                <>
                                                    {currentUser.id === project.ownerId && (
                                                        <button 
                                                            type="button"
                                                            className="button button-small" 
                                                            onClick={() => handleTransferOwnership(member.userId)}
                                                            style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                                                        >
                                                            Make Owner
                                                        </button>
                                                    )}
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleRemoveMember(member.userId)}
                                                        style={{ background: 'transparent', border: 'none', color: 'var(--error-color)', cursor: 'pointer', opacity: 0.8, padding: '0.4rem' }}
                                                        title="Remove Role"
                                                    >
                                                        🗑️
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {teamAssignments.length === 0 && (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', padding: '3rem', opacity: 0.6 }}>
                                    No team members found. Add team roles above or generate planning documents.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};