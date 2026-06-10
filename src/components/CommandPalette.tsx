import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { TEMPLATES } from '../constants/projectData';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (action: string) => void;
}

interface Command {
    id: string;
    label: string;
    description: string;
    action: string;
    category: 'navigation' | 'discipline' | 'quick';
    icon?: string;
}

const NAV_COMMANDS: Command[] = [
    { id: 'nav-new', label: 'New Project', description: 'Create a new project workspace', action: 'new-project', category: 'navigation', icon: '✨' },
    { id: 'nav-dashboard', label: 'Go to Dashboard', description: 'Return to the main dashboard', action: 'dashboard', category: 'navigation', icon: '📊' },
    { id: 'nav-help', label: 'Open Help', description: 'View help documentation', action: 'help', category: 'navigation', icon: '❓' },
    { id: 'nav-logout', label: 'Logout', description: 'Sign out of your account', action: 'logout', category: 'navigation', icon: '🚪' },
];

const QUICK_COMMANDS: Command[] = [
    { id: 'quick-mobile', label: '⚡ Quick: Mobile App', description: 'Set up a mobile app project with defaults', action: 'quick-mobile-app-dev', category: 'quick', icon: '📱' },
    { id: 'quick-software', label: '⚡ Quick: Software Dev', description: 'Set up an agile software project', action: 'quick-software-dev', category: 'quick', icon: '💻' },
    { id: 'quick-marketing', label: '⚡ Quick: Marketing', description: 'Set up a marketing campaign', action: 'quick-marketing-campaign', category: 'quick', icon: '📣' },
    { id: 'quick-ai', label: '⚡ Quick: AI Integration', description: 'Set up an AI integration project', action: 'quick-ai-integration', category: 'quick', icon: '🤖' },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onNavigate }) => {
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Build discipline commands from templates
    const disciplineCommands: Command[] = useMemo(() => 
        TEMPLATES.map(t => ({
            id: `disc-${t.id}`,
            label: t.name,
            description: `Discipline: ${t.discipline}`,
            action: `select-template-${t.id}`,
            category: 'discipline' as const,
            icon: '📋',
        })), []
    );

    // Filter commands based on query
    const filteredCommands = useMemo(() => {
        if (!query.trim()) return [...NAV_COMMANDS, ...QUICK_COMMANDS, ...disciplineCommands.slice(0, 10)];
        
        const q = query.toLowerCase();
        const all = [...NAV_COMMANDS, ...QUICK_COMMANDS, ...disciplineCommands];
        return all.filter(cmd => 
            cmd.label.toLowerCase().includes(q) || 
            cmd.description.toLowerCase().includes(q) ||
            cmd.category.toLowerCase().includes(q)
        ).slice(0, 20); // Limit results
    }, [query, disciplineCommands]);

    // Reset selection when filter changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    // Focus input when opened
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    const executeCommand = useCallback((cmd: Command) => {
        onClose();
        onNavigate(cmd.action);
    }, [onClose, onNavigate]);

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex(prev => Math.max(prev - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (filteredCommands[selectedIndex]) {
                    executeCommand(filteredCommands[selectedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                onClose();
                break;
        }
    };

    // Scroll selected item into view
    useEffect(() => {
        if (listRef.current) {
            const el = listRef.current.children[selectedIndex] as HTMLElement;
            if (el) el.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex]);

    if (!isOpen) return null;

    // Group results
    const groupedResults = useMemo(() => {
        const groups: Record<string, Command[]> = {};
        const cmds = filteredCommands as Command[];
        cmds.forEach(cmd => {
            if (!groups[cmd.category]) groups[cmd.category] = [];
            groups[cmd.category].push(cmd);
        });
        return groups;
    }, [filteredCommands]);

    const categoryLabels: Record<string, string> = {
        navigation: 'Navigation',
        discipline: 'Disciplines',
        quick: 'Quick Setup',
    };

    const categoryIcons: Record<string, string> = {
        navigation: '🔀',
        discipline: '📋',
        quick: '⚡',
    };

    let idx = 0;

    return (
        <div 
            className="modal-overlay" 
            onClick={onClose}
            style={{ zIndex: 2000, alignItems: 'flex-start', paddingTop: '15vh' }}
        >
            <div 
                className="glass-card"
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: '600px', width: '100%', padding: '0',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 40px rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    overflow: 'hidden',
                    animation: 'modal-in 0.2s ease'
                }}
            >
                {/* Search Input */}
                <div style={{ 
                    padding: '1rem 1.25rem', 
                    borderBottom: '1px solid var(--card-border)',
                    display: 'flex', alignItems: 'center', gap: '0.75rem'
                }}>
                    <span style={{ fontSize: '1.2rem', color: 'var(--secondary-text)' }}>⌘</span>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Search commands, disciplines, or projects..."
                        style={{
                            border: 'none', background: 'transparent', padding: '0.5rem 0',
                            fontSize: '1rem', outline: 'none', width: '100%',
                            color: 'var(--primary-text)'
                        }}
                        autoFocus
                    />
                    <kbd style={{
                        padding: '0.2rem 0.5rem', borderRadius: '4px',
                        background: 'rgba(255,255,255,0.05)', border: '1px solid var(--card-border)',
                        fontSize: '0.7rem', color: 'var(--secondary-text)'
                    }}>ESC</kbd>
                </div>

                {/* Results */}
                <div ref={listRef} style={{ maxHeight: '400px', overflowY: 'auto', padding: '0.5rem 0' }}>
                    {filteredCommands.length === 0 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--secondary-text)' }}>
                            No results found for "{query}"
                        </div>
                    ) : (
                        Object.entries(groupedResults).map((entry: [string, Command[]]) => {
                            const [category, cmds] = entry;
                            return (
                            <div key={category}>
                                <div style={{
                                    padding: '0.5rem 1.25rem 0.25rem',
                                    fontSize: '0.7rem', color: 'var(--tertiary-text)',
                                    textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700
                                }}>
                                    {categoryIcons[category]} {categoryLabels[category] || category}
                                </div>
                                {cmds.map(cmd => {
                                    const currentIdx = idx++;
                                    const isSelected = currentIdx === selectedIndex;
                                    return (
                                        <div
                                            key={cmd.id}
                                            onClick={() => executeCommand(cmd)}
                                            style={{
                                                padding: '0.6rem 1.25rem',
                                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                cursor: 'pointer',
                                                background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                                borderLeft: isSelected ? '2px solid var(--accent-color)' : '2px solid transparent',
                                                transition: 'all 0.1s'
                                            }}
                                            onMouseEnter={() => setSelectedIndex(currentIdx)}
                                        >
                                            <span style={{ fontSize: '1rem', width: '24px', textAlign: 'center' }}>
                                                {cmd.icon || '📋'}
                                            </span>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary-text)' }}>
                                                    {cmd.label}
                                                </div>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--secondary-text)' }}>
                                                    {cmd.description}
                                                </div>
                                            </div>
                                            {cmd.category === 'discipline' && (
                                                <span className="chip-blue" style={{ fontSize: '0.65rem' }}>
                                                    select
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            );
                        })
                    )}
                </div>

                {/* Footer hint */}
                <div style={{
                    padding: '0.6rem 1.25rem',
                    borderTop: '1px solid var(--card-border)',
                    display: 'flex', gap: '1.5rem', fontSize: '0.7rem', color: 'var(--tertiary-text)'
                }}>
                    <span>↑↓ Navigate</span>
                    <span>↵ Select</span>
                    <span>Esc Close</span>
                </div>
            </div>
        </div>
    );
};