
import React, { useState, useEffect, useRef } from 'react';
import { User, Notification } from '../types';
import { getLlmSettings } from '../utils/llmStorage';
import { LLM_PROVIDERS } from '../constants/llmProviders';

interface HeaderProps {
    onNewProject: () => void;
    onHomeClick: () => void;
    disabled: boolean;
    isLandingPage: boolean;
    currentUser: User;
    onLogout: () => void;
    notifications: Notification[];
    onNotificationClick: (notification: Notification) => void;
    onMarkAllRead: () => void;
    onClearAllProjects: () => void;
    onOpenKeyModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
    onNewProject, onHomeClick, disabled, currentUser, onLogout, 
    notifications = [], onNotificationClick, onMarkAllRead,
    onClearAllProjects, onOpenKeyModal
}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [activeLlmLabel, setActiveLlmLabel] = useState<string>('Google Gemini');

    useEffect(() => {
        const updateLabel = () => {
            const current = getLlmSettings();
            const provName = LLM_PROVIDERS[current.activeProvider]?.name || 'Google';
            const modelName = current.configs[current.activeProvider]?.model || 'Default';
            setActiveLlmLabel(`${provName}: ${modelName}`);
        };

        updateLabel();
        window.addEventListener('mifeco-llm-settings-updated', updateLabel);
        return () => window.removeEventListener('mifeco-llm-settings-updated', updateLabel);
    }, []);

    const unreadCount = notifications.filter(n => !n.read).length;


    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="app-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <h1 style={{ fontSize: '1.35rem', letterSpacing: '1.5px', cursor: 'pointer', fontWeight: 900, margin: 0, background: 'linear-gradient(135deg, #00f2ff 0%, #0066ff 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }} onClick={onHomeClick}>
                    PM ACCELERATOR
                </h1>
                <div style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(0,255,170,0.1)', border: '1px solid rgba(0,255,170,0.2)', fontSize: '10px', fontWeight: 'bold', color: '#00ffaa', letterSpacing: '1px' }}>
                    MIFECO
                </div>
            </div>
            <div className="header-actions">
                {currentUser && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div className="notification-bell" title="Notifications" aria-label="Notifications" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                            {isDropdownOpen && (
                                <div className="notifications-dropdown" ref={dropdownRef}>
                                    <div className="notifications-header">
                                        <h4>Notifications</h4>
                                        {unreadCount > 0 && <button className="button button-small" onClick={onMarkAllRead}>Mark all read</button>}
                                    </div>
                                    <div className="notifications-list">
                                        {notifications.length > 0 ? (
                                            notifications.map(notif => (
                                                <div key={notif.id} className={`notification-item ${!notif.read ? 'unread' : ''}`} onClick={() => onNotificationClick(notif)}>
                                                    <p>{notif.text}</p>
                                                    <small style={{color: 'var(--secondary-text)'}}>{new Date(notif.timestamp).toLocaleString()}</small>
                                                </div>
                                            ))
                                        ) : (
                                            <p style={{padding: '1rem', textAlign: 'center', color: 'var(--secondary-text)'}}>No new notifications.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        {onOpenKeyModal && (
                            <button 
                                onClick={onOpenKeyModal}
                                className="button button-small"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    background: 'rgba(6, 182, 212, 0.12)',
                                    border: '1px solid rgba(6, 182, 212, 0.35)',
                                    color: '#22d3ee',
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    fontWeight: 600,
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                }}
                                title="Configure LLM Provider, API Key, or Subscription OAuth"
                            >
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/>
                                </svg>
                                <span>{activeLlmLabel}</span>
                            </button>
                        )}
                        <span>{currentUser.username}</span>
                        {currentUser.plan === 'business' ? (
                            <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 7px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#34d399', letterSpacing: '0.5px' }}>
                                STRIPE BUSINESS
                            </span>
                        ) : currentUser.plan === 'studio_test' ? (
                            <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 7px', borderRadius: '4px', background: 'rgba(6, 182, 212, 0.15)', border: '1px solid rgba(6, 182, 212, 0.3)', color: '#22d3ee', letterSpacing: '0.5px' }}>
                                STUDIO TEST
                            </span>
                        ) : (
                            <span style={{ fontSize: '10px', fontWeight: 'bold', padding: '2px 7px', borderRadius: '4px', background: 'rgba(148, 163, 184, 0.1)', border: '1px solid rgba(148, 163, 184, 0.2)', color: '#94a3b8', letterSpacing: '0.5px' }}>
                                FREE BYO-LLM
                            </span>
                        )}
                        <button onClick={onClearAllProjects} className="button button-small" style={{ background: 'rgba(255, 50, 50, 0.1)', color: '#ff3232', border: '1px solid rgba(255, 50, 50, 0.2)' }}>Clear All Data</button>


                        <button onClick={onLogout} className="button button-small">Logout</button>
                    </div>
                )}
                <button onClick={onNewProject} className="button" disabled={disabled}>
                    New Project
                </button>
            </div>
        </header>
    );
};
