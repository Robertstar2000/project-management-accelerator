import React from 'react';

interface RunningManAnimationProps {
    compact?: boolean;
    label?: string;
    stepName?: string;
}

export const RunningManAnimation: React.FC<RunningManAnimationProps> = ({ 
    compact = false, 
    label = 'Step in progress...', 
    stepName 
}) => {
    if (compact) {
        return (
            <div 
                className="running-man-compact"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '3px 10px',
                    borderRadius: '100px',
                    background: 'rgba(0, 242, 255, 0.12)',
                    border: '1px solid rgba(0, 242, 255, 0.4)',
                    boxShadow: '0 0 10px rgba(0, 242, 255, 0.25)',
                    color: '#00f2ff',
                    fontSize: '11px',
                    fontWeight: 700
                }}
            >
                <div style={{ width: '22px', height: '22px', position: 'relative', overflow: 'hidden' }}>
                    <svg viewBox="0 0 40 40" style={{ width: '100%', height: '100%' }}>
                        <style>{`
                            @keyframes run-head {
                                0%, 100% { transform: translateY(0px); }
                                50% { transform: translateY(-2px); }
                            }
                            @keyframes run-leg-1 {
                                0%, 100% { transform: rotate(-35deg); }
                                50% { transform: rotate(40deg); }
                            }
                            @keyframes run-leg-2 {
                                0%, 100% { transform: rotate(40deg); }
                                50% { transform: rotate(-35deg); }
                            }
                            @keyframes run-arm-1 {
                                0%, 100% { transform: rotate(45deg); }
                                50% { transform: rotate(-40deg); }
                            }
                            @keyframes run-arm-2 {
                                0%, 100% { transform: rotate(-40deg); }
                                50% { transform: rotate(45deg); }
                            }
                        `}</style>
                        <g style={{ transformOrigin: '20px 20px', animation: 'run-head 0.4s infinite ease-in-out' }}>
                            {/* Head */}
                            <circle cx="23" cy="9" r="4" fill="#00f2ff" />
                            {/* Torso */}
                            <line x1="21" y1="13" x2="18" y2="23" stroke="#00f2ff" strokeWidth="3" strokeLinecap="round" />
                            {/* Arms */}
                            <g style={{ transformOrigin: '20px 14px', animation: 'run-arm-1 0.4s infinite ease-in-out' }}>
                                <line x1="20" y1="14" x2="27" y2="20" stroke="#00f2ff" strokeWidth="2.5" strokeLinecap="round" />
                            </g>
                            <g style={{ transformOrigin: '20px 14px', animation: 'run-arm-2 0.4s infinite ease-in-out' }}>
                                <line x1="20" y1="14" x2="13" y2="18" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                            </g>
                            {/* Legs */}
                            <g style={{ transformOrigin: '18px 23px', animation: 'run-leg-1 0.4s infinite ease-in-out' }}>
                                <line x1="18" y1="23" x2="26" y2="34" stroke="#00f2ff" strokeWidth="3" strokeLinecap="round" />
                            </g>
                            <g style={{ transformOrigin: '18px 23px', animation: 'run-leg-2 0.4s infinite ease-in-out' }}>
                                <line x1="18" y1="23" x2="11" y2="33" stroke="#38bdf8" strokeWidth="3" strokeLinecap="round" />
                            </g>
                        </g>
                    </svg>
                </div>
                <span>{stepName || 'Running Step...'}</span>
            </div>
        );
    }

    return (
        <div 
            className="running-man-container" 
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                padding: '1.25rem 1.75rem',
                background: 'linear-gradient(135deg, rgba(0, 242, 255, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
                border: '1px solid rgba(0, 242, 255, 0.35)',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 242, 255, 0.15)',
                marginBottom: '1.5rem',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Animated runner figure */}
            <div style={{ width: '64px', height: '64px', minWidth: '64px', position: 'relative' }}>
                <svg viewBox="0 0 60 60" style={{ width: '100%', height: '100%' }}>
                    <defs>
                        <linearGradient id="runner-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00f2ff" />
                            <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                        <filter id="neon-glow" x="-30%" y="-30%" width="160%" height="160%">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                    </defs>
                    
                    <style>{`
                        @keyframes runner-bounce {
                            0%, 100% { transform: translateY(0px) rotate(4deg); }
                            50% { transform: translateY(-4px) rotate(8deg); }
                        }
                        @keyframes runner-leg-front {
                            0%, 100% { transform: rotate(-45deg); }
                            50% { transform: rotate(50deg); }
                        }
                        @keyframes runner-leg-back {
                            0%, 100% { transform: rotate(50deg); }
                            50% { transform: rotate(-45deg); }
                        }
                        @keyframes runner-arm-front {
                            0%, 100% { transform: rotate(55deg); }
                            50% { transform: rotate(-50deg); }
                        }
                        @keyframes runner-arm-back {
                            0%, 100% { transform: rotate(-50deg); }
                            50% { transform: rotate(55deg); }
                        }
                        @keyframes speed-line {
                            0% { transform: translateX(30px); opacity: 0; }
                            50% { opacity: 0.8; }
                            100% { transform: translateX(-40px); opacity: 0; }
                        }
                        @keyframes dust-burst {
                            0% { transform: scale(0.5) translate(0, 0); opacity: 0.8; }
                            100% { transform: scale(1.6) translate(-15px, 2px); opacity: 0; }
                        }
                    `}</style>

                    {/* Speed trail lines */}
                    <line x1="18" y1="20" x2="3" y2="20" stroke="#00f2ff" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.6" style={{ animation: 'speed-line 0.6s infinite linear' }} />
                    <line x1="14" y1="32" x2="0" y2="32" stroke="#a855f7" strokeWidth="1.5" strokeDasharray="3,3" opacity="0.5" style={{ animation: 'speed-line 0.5s infinite linear 0.15s' }} />
                    <line x1="20" y1="44" x2="5" y2="44" stroke="#00f2ff" strokeWidth="2" opacity="0.4" style={{ animation: 'speed-line 0.4s infinite linear 0.3s' }} />

                    {/* Ground dust particle */}
                    <circle cx="16" cy="52" r="3" fill="#00f2ff" style={{ animation: 'dust-burst 0.45s infinite ease-out' }} />
                    <circle cx="12" cy="50" r="2" fill="#a855f7" style={{ animation: 'dust-burst 0.45s infinite ease-out 0.2s' }} />

                    {/* Main Runner Body Group */}
                    <g filter="url(#neon-glow)" style={{ transformOrigin: '32px 30px', animation: 'runner-bounce 0.35s infinite ease-in-out' }}>
                        {/* Head */}
                        <circle cx="36" cy="13" r="5" fill="url(#runner-glow)" />
                        
                        {/* Visor / Eye dot */}
                        <circle cx="39" cy="12" r="1.5" fill="#ffffff" />

                        {/* Neck & Torso */}
                        <path d="M 33 18 L 28 34" stroke="url(#runner-glow)" strokeWidth="4.5" strokeLinecap="round" />

                        {/* Back Arm */}
                        <g style={{ transformOrigin: '31px 20px', animation: 'runner-arm-back 0.35s infinite ease-in-out' }}>
                            <path d="M 31 20 L 22 26 L 16 22" stroke="#38bdf8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                        </g>

                        {/* Front Arm */}
                        <g style={{ transformOrigin: '32px 20px', animation: 'runner-arm-front 0.35s infinite ease-in-out' }}>
                            <path d="M 32 20 L 42 27 L 49 22" stroke="url(#runner-glow)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                        </g>

                        {/* Back Leg */}
                        <g style={{ transformOrigin: '28px 34px', animation: 'runner-leg-back 0.35s infinite ease-in-out' }}>
                            <path d="M 28 34 L 18 43 L 13 54" stroke="#818cf8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        </g>

                        {/* Front Leg */}
                        <g style={{ transformOrigin: '28px 34px', animation: 'runner-leg-front 0.35s infinite ease-in-out' }}>
                            <path d="M 28 34 L 40 44 L 47 53" stroke="url(#runner-glow)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                        </g>
                    </g>

                    {/* Track Ground Line */}
                    <line x1="5" y1="56" x2="55" y2="56" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                </svg>
            </div>

            {/* Status Information */}
            <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ 
                        fontSize: '11px', 
                        fontWeight: 800, 
                        color: '#00f2ff', 
                        letterSpacing: '1px', 
                        textTransform: 'uppercase',
                        background: 'rgba(0, 242, 255, 0.15)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: '1px solid rgba(0, 242, 255, 0.3)'
                    }}>
                        STEP ACTIVE
                    </span>
                    <span style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: 600 }}>
                        {stepName || 'Executing Phase Workflow'}
                    </span>
                </div>
                <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 700, margin: '2px 0' }}>
                    {label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--secondary-text)' }}>
                    Runner active until phase deliverables and graphical artifact(s) are synthesized and rendered.
                </div>
            </div>

            {/* Glowing Pulse Pill */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#00f2ff',
                    boxShadow: '0 0 10px #00f2ff',
                    animation: 'pulse 1.2s infinite'
                }} />
                <span style={{ fontSize: '11px', color: '#00f2ff', fontWeight: 700 }}>SYNTHESIZING</span>
            </div>
        </div>
    );
};
