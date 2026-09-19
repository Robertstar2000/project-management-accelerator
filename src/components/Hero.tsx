import React from 'react';
import { RainbowText } from './RainbowText';

export const Hero = ({ onStart, disabled }) => (
  <section style={{ 
    padding: '6rem 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    position: 'relative',
    textAlign: 'center'
  }}>
    <div style={{ maxWidth: '1000px', width: '100%' }}>
      <h1 className="hero-title" style={{ marginBottom: '2rem' }}>
        Project Management <br />
        <span className="gradient-text">Accelerator</span>
      </h1>
      
      <p style={{ 
        fontSize: '1.6rem', 
        color: 'var(--secondary-text)', 
        maxWidth: '800px', 
        margin: '0 auto 4rem',
        fontWeight: 400,
        lineHeight: 1.5
      }}>
        An AI-powered co-pilot that orchestrates your project lifecycle using the 
        <span style={{ color: '#fff', fontWeight: 600 }}> Hyper-Agile Management Process (HMAP)</span>. 
        Automate complexity, amplify velocity.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3rem' }}>
        <button 
          onClick={onStart} 
          className="button button-primary" 
          disabled={disabled}
          style={{ 
            padding: '1.8rem 5rem', 
            fontSize: '1.2rem', 
            borderRadius: '100px',
            border: '2px solid var(--neon-pink)',
            boxShadow: '0 0 20px rgba(255, 0, 255, 0.5)'
          }}
        >
          Initialize Workspace
        </button>
        
        <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
          Crafted by <RainbowText text="MIFECO" /> <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span> Mars Technology Institute Affiliate
        </p>
      </div>
    </div>

    <div className="feature-grid" style={{ marginTop: '8rem', width: '100%' }}>
      <div className="glass-card">
        <div style={{ 
          width: '50px', height: '50px', background: 'rgba(157, 0, 255, 0.1)', 
          borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', marginBottom: '2rem', border: '1px solid rgba(157, 0, 255, 0.3)'
        }}>✨</div>
        <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>AI-Powered Planning</h3>
        <p style={{ color: 'var(--secondary-text)', fontSize: '1.1rem' }}>
          Leverage Gemini to instantly create context-aware project documentation. 
          Cohesive plans from initial concept to detailed Work Breakdown Structures.
        </p>
      </div>

      <div className="glass-card">
        <div style={{ 
          width: '50px', height: '50px', background: 'rgba(0, 242, 255, 0.1)', 
          borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', marginBottom: '2rem', border: '1px solid rgba(0, 242, 255, 0.3)'
        }}>🧭</div>
        <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Structured Workflow</h3>
        <p style={{ color: 'var(--secondary-text)', fontSize: '1.1rem' }}>
          Navigate planning with HMAP. A phase-based approach that prevents 
          downstream errors by ensuring prerequisites are robustly met.
        </p>
      </div>

      <div className="glass-card">
        <div style={{ 
          width: '50px', height: '50px', background: 'rgba(0, 255, 170, 0.1)', 
          borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', marginBottom: '2rem', border: '1px solid rgba(0, 255, 170, 0.3)'
        }}>📊</div>
        <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>Integrated Tracking</h3>
        <p style={{ color: 'var(--secondary-text)', fontSize: '1.1rem' }}>
          Transition seamlessly to execution. AI-generated plans automatically 
          populate interactive Gantt charts and Kanban boards.
        </p>
      </div>

      <div className="glass-card">
        <div style={{ 
          width: '50px', height: '50px', background: 'rgba(255, 51, 102, 0.1)', 
          borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', marginBottom: '2rem', border: '1px solid rgba(255, 51, 102, 0.3)'
        }}>🎛️</div>
        <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem' }}>What-If Analysis</h3>
        <p style={{ color: 'var(--secondary-text)', fontSize: '1.1rem' }}>
          De-risk changes with powerful simulation tools. Compare scenarios 
          side-by-side to see immediate impact on budget and timelines.
        </p>
      </div>
    </div>
  </section>
);