
import React, { useState, useEffect } from 'react';
import { Project, User } from '../types';
import { updateGeminiKey } from '../utils/authService';
import { RainbowText } from '../components/RainbowText';

interface LandingPageProps {
    onSelectProject: (project: Project | null) => void;
    onNewProject: () => void;
    currentUser: User;
    projects: Project[];
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectProject, onNewProject, currentUser, projects }) => {
    const [geminiKey, setGeminiKey] = useState('');
    const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
    const [isSavingKey, setIsSavingKey] = useState(false);

    useEffect(() => {
        // First try to get it from the user object (backend truth)
        if (currentUser.geminiKey) {
            setGeminiKey(currentUser.geminiKey);
            localStorage.setItem('hmap-gemini-api-key', currentUser.geminiKey);
        } else {
            // Fallback to local storage
            const savedKey = localStorage.getItem('hmap-gemini-api-key');
            if (savedKey) {
                setGeminiKey(savedKey);
            }
        }
    }, [currentUser]);

    const handleKeyChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const key = e.target.value;
        setGeminiKey(key);
        
        setIsSavingKey(true);
        try {
            await updateGeminiKey(currentUser.id, key);
        } catch (error) {
            console.error("Failed to save Gemini key:", error);
            // Revert on failure if needed, or just show error
        } finally {
            setIsSavingKey(false);
        }
    };

    return (
        <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center', 
            minHeight: '60vh',
            gap: '2rem'
        }}>
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <h1 style={{ fontSize: '3rem', fontWeight: 800, marginBottom: '0.2rem', lineHeight: '1.1' }}>
                    Welcome, <span className="gradient-text">{currentUser.username}</span>
                </h1>
                <p style={{ color: 'var(--secondary-text)', fontSize: '1.2rem', letterSpacing: '1px' }}>
                    <RainbowText text="MIFECO" /> MISSION CONTROL
                </p>
            </div>

            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', 
                gap: '1.5rem', 
                width: '100%', 
                maxWidth: '850px' 
            }}>
                {/* ACTIVE PROJECTS CARD */}
                <div 
                    className="glass-card" 
                    onClick={() => onSelectProject(null)} // Triggers Project Selector/List
                    style={{ 
                        cursor: 'pointer', 
                        padding: '2rem 1.5rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        textAlign: 'center',
                        borderWidth: '2px',
                        background: projects.length > 0 ? 'rgba(0, 242, 255, 0.05)' : 'rgba(255,255,255,0.02)'
                    }}
                >
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
                    <h2 style={{ fontSize: '1.6rem', marginBottom: '0.3rem' }}>ACTIVE PROJECTS</h2>
                    <p style={{ color: 'var(--secondary-text)', fontSize: '0.9rem', marginBottom: '0' }}>
                        {projects.length} workspace{projects.length !== 1 ? 's' : ''} currently in mission database.
                    </p>
                    <div className="button button-primary" style={{ marginTop: '1.5rem', width: '100%', padding: '1rem' }}>OPEN DATABASE</div>
                </div>

                {/* CREATE NEW CARD */}
                <div 
                    className="glass-card" 
                    onClick={onNewProject}
                    style={{ 
                        cursor: 'pointer', 
                        padding: '2rem 1.5rem', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                        textAlign: 'center',
                        borderWidth: '2px',
                        borderColor: 'var(--neon-pink)',
                        background: 'rgba(255, 0, 255, 0.03)'
                    }}
                >
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
                    <h2 style={{ fontSize: '1.6rem', marginBottom: '0.3rem' }}>CREATE NEW</h2>
                    <p style={{ color: 'var(--secondary-text)', fontSize: '0.9rem', marginBottom: '0' }}>
                        Initialize a new Hyper-Agile project lifecycle.
                    </p>
                    <div className="button" style={{ 
                        marginTop: '1.5rem', 
                        width: '100%', 
                        padding: '1rem',
                        borderColor: 'var(--neon-pink)',
                        color: 'var(--neon-pink)'
                    }}>INITIATE PROTOCOL</div>
                </div>
            </div>

            {/* GEMINI API KEY SECTION */}
            {localStorage.getItem('mifeco-use-internal-key') !== 'true' && (
                <div className="glass-card" style={{ width: '100%', maxWidth: '850px', padding: '2rem', marginTop: '1rem' }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--primary-text)' }}>AI Engine Configuration</h3>
                    <p style={{ color: 'var(--secondary-text)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                        Enter your Google Gemini API Key to enable AI-powered project acceleration.
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <input 
                            type="password" 
                            placeholder="AIzaSy..." 
                            value={geminiKey}
                            onChange={handleKeyChange}
                            style={{ 
                                padding: '1rem', 
                                borderRadius: 'var(--radius-sm)', 
                                border: '1px solid var(--card-border)', 
                                background: 'rgba(15, 23, 42, 0.6)', 
                                color: 'var(--primary-text)',
                                width: '100%'
                            }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button 
                                onClick={() => setIsKeyModalOpen(true)}
                                style={{ 
                                    background: 'none', 
                                    border: 'none', 
                                    color: 'var(--accent-color)', 
                                    cursor: 'pointer', 
                                    textAlign: 'left',
                                    fontSize: '0.85rem',
                                    padding: '0.5rem 0',
                                    textDecoration: 'underline'
                                }}
                            >
                                How to get a key
                            </button>
                            {isSavingKey && <span style={{ fontSize: '0.8rem', color: 'var(--secondary-text)' }}>Saving...</span>}
                        </div>
                    </div>
                </div>
            )}

            {isKeyModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
                    background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div className="glass-card" style={{ maxWidth: '500px', width: '90%', padding: '2rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'var(--primary-text)' }}>How to get a Gemini API Key</h2>
                        <ol style={{ color: 'var(--secondary-text)', lineHeight: '1.6', paddingLeft: '1.5rem', marginBottom: '2rem' }}>
                            <li style={{ marginBottom: '0.5rem' }}>Go to <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)' }}>Google AI Studio</a>.</li>
                            <li style={{ marginBottom: '0.5rem' }}>Sign in with your Google account.</li>
                            <li style={{ marginBottom: '0.5rem' }}>Click on the <strong>&quot;Get API key&quot;</strong> button in the left navigation menu.</li>
                            <li style={{ marginBottom: '0.5rem' }}>Click <strong>&quot;Create API key&quot;</strong>.</li>
                            <li style={{ marginBottom: '0.5rem' }}>Copy the generated key and paste it into the field on this page.</li>
                        </ol>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="button button-primary" onClick={() => setIsKeyModalOpen(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginTop: '2rem', opacity: 0.4, display: 'flex', gap: '1.5rem', fontSize: '0.9rem' }}>
                <span>V.5.0.0-VERIFIED</span>
                <span>|</span>
                <span>SYSTEM ONLINE</span>
            </div>
        </div>
    );
};
