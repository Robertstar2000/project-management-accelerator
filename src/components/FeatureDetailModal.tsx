
import React, { useEffect, useRef } from 'react';

interface FeatureDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    feature: {
        icon: string;
        title: string;
        description: string;
        details: string[];
        color: string;
    } | null;
}

export const FeatureDetailModal: React.FC<FeatureDetailModalProps> = ({ isOpen, onClose, feature }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen || !feature) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div 
                className="modal-content" 
                ref={modalRef} 
                onClick={(e) => e.stopPropagation()}
                style={{
                    maxWidth: '700px',
                    background: 'rgba(15, 23, 42, 0.95)',
                    border: `1px solid ${feature.color}`,
                    boxShadow: `0 0 40px ${feature.color}40`,
                    animation: 'none' // Override floating animation for this specific modal
                }}
            >
                <button className="button-close" onClick={onClose}>&times;</button>
                
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{ 
                        fontSize: '4rem', 
                        marginBottom: '1rem',
                        filter: `drop-shadow(0 0 20px ${feature.color})` 
                    }}>
                        {feature.icon}
                    </div>
                    <h2 style={{ 
                        fontSize: '2.5rem', 
                        background: `linear-gradient(to right, #fff, ${feature.color})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '0.5rem'
                    }}>
                        {feature.title}
                    </h2>
                    <div style={{ height: '2px', width: '100px', background: feature.color, margin: '0 auto', opacity: 0.5 }}></div>
                </div>

                <div style={{ padding: '0 1rem' }}>
                    <p style={{ 
                        fontSize: '1.2rem', 
                        color: 'var(--primary-text)', 
                        lineHeight: '1.8', 
                        marginBottom: '2rem',
                        textAlign: 'center'
                    }}>
                        {feature.description}
                    </p>

                    <h4 style={{ color: feature.color, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Key Capabilities</h4>
                    <ul style={{ display: 'grid', gap: '1rem' }}>
                        {feature.details.map((detail, index) => (
                            <li key={index} style={{ 
                                display: 'flex', 
                                alignItems: 'flex-start', 
                                gap: '1rem',
                                padding: '1rem',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '8px',
                                borderLeft: `3px solid ${feature.color}`
                            }}>
                                <span style={{ color: feature.color }}>➤</span>
                                <span style={{ color: 'var(--secondary-text)' }}>{detail}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                    <button className="button" onClick={onClose} style={{ width: '100%' }}>Return to Mission Control</button>
                </div>
            </div>
        </div>
    );
};
