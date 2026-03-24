
// Exporting GlobalStyles with premium MIFECO aesthetics.
export const GlobalStyles = `
  :root {
    --background-color: #0f172a; /* Deep Slate */
    --background-gradient: radial-gradient(circle at 15% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(circle at 85% 30%, rgba(168, 85, 247, 0.15) 0%, transparent 50%);
    
    --primary-text: #f8fafc;
    --secondary-text: #94a3b8;
    --tertiary-text: #64748b;
    
    --accent-color: #818cf8; /* Indigo 400 */
    --accent-glow: rgba(129, 140, 248, 0.5);
    
    --primary-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); /* Indigo to Violet */
    --secondary-gradient: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%); /* Blue to Cyan */
    --success-gradient: linear-gradient(135deg, #10b981 0%, #34d399 100%);
    --warning-gradient: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
    --error-gradient: linear-gradient(135deg, #ef4444 0%, #f87171 100%);

    --card-background: rgba(30, 41, 59, 0.6); /* Slate 800 with opacity */
    --card-border: rgba(148, 163, 184, 0.1);
    --glass-bg: rgba(255, 255, 255, 0.03);
    --glass-border: rgba(255, 255, 255, 0.08);
    
    --border-color: rgba(148, 163, 184, 0.15);
    
    --success-color: #34d399;
    --error-color: #f87171;
    --warning-color: #fbbf24;
    
    --radius: 16px;
    --radius-sm: 8px;
    --radius-lg: 24px;
    
    --font-display: 'Space Grotesk', system-ui, sans-serif;
    --font-body: 'Inter', system-ui, sans-serif;
    
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    --shadow-glow: 0 0 20px rgba(99, 102, 241, 0.3);
  }

  /* Reset */
  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  html, body {
    min-height: 100vh;
    background-color: var(--background-color);
    color: var(--primary-text);
    font-family: var(--font-body);
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-display);
    font-weight: 700;
    letter-spacing: -0.025em;
    color: var(--primary-text);
  }

  #root {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* Background Effects */
  body::before {
    content: "";
    position: fixed;
    top: 0; left: 0; width: 100%; height: 100%;
    background: var(--background-gradient);
    z-index: -1;
    pointer-events: none;
  }

  main {
    padding: 2rem 5%;
    flex: 1;
    width: 100%;
    max-width: 1600px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
  }

  @media (max-width: 768px) {
    main {
      padding: 1rem 3%;
    }
  }

  /* Header */
  .app-header {
    padding: 1.25rem 5%;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(16px);
    position: sticky;
    top: 0;
    z-index: 500;
    box-shadow: var(--shadow-sm);
  }

  @media (max-width: 768px) {
    .app-header {
      flex-direction: column;
      gap: 1rem;
      padding: 1rem;
      align-items: flex-start;
    }
    .header-actions {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
  }

  /* Buttons */
  .button {
    padding: 0.75rem 1.5rem;
    border: 1px solid var(--card-border);
    background: rgba(255, 255, 255, 0.05);
    color: var(--primary-text);
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    letter-spacing: 0.01em;
  }
  
  .button:hover:not([disabled]) { 
    background: rgba(255, 255, 255, 0.1);
    border-color: var(--secondary-text);
    transform: translateY(-1px);
  }

  .button-primary { 
    background: var(--primary-gradient);
    color: white;
    border: none;
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
  }
  
  .button-primary:hover:not([disabled]) {
    box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
    transform: translateY(-1px);
    filter: brightness(1.1);
  }

  .button-generate {
    background: #064e3b !important; /* Dark Green */
    color: white !important;
    border: none !important;
    box-shadow: 0 4px 12px rgba(6, 78, 59, 0.3) !important;
  }
  
  .button-generate:hover:not([disabled]) {
    box-shadow: 0 6px 16px rgba(6, 78, 59, 0.4) !important;
    transform: translateY(-1px) !important;
    filter: brightness(1.2) !important;
  }

  .button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  /* Inputs */
  input, select, textarea {
    width: 100%;
    padding: 0.875rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid var(--card-border);
    border-radius: var(--radius-sm);
    color: var(--primary-text);
    font-family: inherit;
    font-size: 0.95rem;
    transition: all 0.2s ease;
  }
  
  input:focus, textarea:focus, select:focus {
    outline: none;
    border-color: var(--accent-color);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.2);
    background: rgba(15, 23, 42, 0.8);
  }

  /* Placeholder Styling */
  ::placeholder {
    color: #94a3b8; /* Using --secondary-text color which is a good medium grey */
    opacity: 0.7;
    transition: color 0.2s ease;
  }

  input:focus::placeholder,
  textarea:focus::placeholder {
    color: transparent;
  }

  /* Selection Grid */
  .selection-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .selection-grid-3 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }

  .selection-button {
    background: rgba(30, 41, 59, 0.4);
    border: 1px solid var(--card-border);
    border-radius: var(--radius);
    padding: 1.5rem 1rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    position: relative;
    overflow: hidden;
    width: 100%;
    height: 100%;
    min-height: 160px;
    overflow-wrap: anywhere;
    box-sizing: border-box;
  }

  .selection-button:hover {
    background: rgba(30, 41, 59, 0.7);
    border-color: var(--accent-color);
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  .selection-button.active {
    background: rgba(99, 102, 241, 0.1);
    border-color: var(--accent-color);
    box-shadow: 0 0 0 1px var(--accent-color), var(--shadow-glow);
  }

  .selection-button strong {
    display: block;
    font-size: 1.1rem;
    color: var(--primary-text);
    font-family: var(--font-display);
    line-height: 1.2;
    margin-bottom: 0.25rem;
    width: 100%;
  }

  .selection-button span {
    font-size: 0.8rem;
    color: var(--secondary-text);
    line-height: 1.4;
    display: block;
    width: 100%;
  }

  .button.active {
    background: var(--primary-gradient);
    color: white;
    border: none;
  }

  /* Setup & Forms */
  .setup-container {
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }

  .setup-grid {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 3rem;
  }

  @media (max-width: 1024px) {
    .setup-grid {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
  }

  .glass-card {
    background: var(--card-background);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid var(--card-border);
    border-radius: var(--radius);
    padding: 2rem;
    box-shadow: var(--shadow-md);
  }

  .form-stack {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }

  .form-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .form-group label {
    font-size: 0.85rem;
    color: var(--secondary-text);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  /* Dashboard Grid */
  .dashboard-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 1.5rem;
    margin-bottom: 2.5rem;
  }

  /* Responsive Spans for 12-column grid */
  .col-span-12 { grid-column: span 12 / span 12; }
  .col-span-11 { grid-column: span 11 / span 11; }
  .col-span-10 { grid-column: span 10 / span 10; }
  .col-span-9 { grid-column: span 9 / span 9; }
  .col-span-8 { grid-column: span 8 / span 8; }
  .col-span-7 { grid-column: span 7 / span 7; }
  .col-span-6 { grid-column: span 6 / span 6; }
  .col-span-5 { grid-column: span 5 / span 5; }
  .col-span-4 { grid-column: span 4 / span 4; }
  .col-span-3 { grid-column: span 3 / span 3; }
  .col-span-2 { grid-column: span 2 / span 2; }
  .col-span-1 { grid-column: span 1 / span 1; }

  @media (max-width: 1400px) {
    .dashboard-grid {
      grid-template-columns: repeat(12, 1fr);
    }
    .col-span-4 { grid-column: span 6 / span 6; }
    .col-span-8 { grid-column: span 6 / span 6; }
    .col-span-5 { grid-column: span 6 / span 6; }
    .col-span-3 { grid-column: span 6 / span 6; }
  }

  @media (max-width: 1024px) {
    .dashboard-grid {
      grid-template-columns: repeat(6, 1fr);
    }
    .col-span-12, .col-span-8, .col-span-6, .col-span-5, .col-span-4, .col-span-3 { 
      grid-column: span 6 / span 6; 
    }
  }

  @media (max-width: 768px) {
    .dashboard-grid {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  }

  .financial-grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 4rem;
  }

  @media (max-width: 1024px) {
    .financial-grid {
      grid-template-columns: 1fr;
      gap: 2rem;
    }
  }

  .selection-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .selection-grid-3 {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 1rem;
  }

  @media (max-width: 640px) {
    .selection-grid, .selection-grid-3 {
      grid-template-columns: 1fr;
    }
  }

  .selection-group {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .p-responsive {
    padding: 2rem;
  }

  @media (max-width: 768px) {
    .p-responsive {
      padding: 1rem;
    }
  }

  .stat-card {
    background: linear-gradient(145deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%);
    border: 1px solid var(--card-border);
    border-radius: var(--radius);
    padding: 1.75rem;
    display: flex;
    flex-direction: column;
    transition: transform 0.2s ease;
  }
  
  .stat-card:hover {
    transform: translateY(-2px);
    border-color: rgba(148, 163, 184, 0.2);
  }

  .stat-value {
    font-size: 2.5rem;
    font-weight: 700;
    margin: 0.5rem 0;
    font-family: var(--font-display);
    background: var(--primary-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .stat-label {
    color: var(--secondary-text);
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  /* Phase List */
  .phase-list {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  .phase-card {
    background: rgba(30, 41, 59, 0.4);
    border: 1px solid var(--card-border);
    border-radius: var(--radius);
    overflow: hidden;
    transition: all 0.2s ease;
  }
  
  .phase-card:hover {
    border-color: rgba(148, 163, 184, 0.3);
  }

  .phase-header {
    padding: 1.5rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    background: linear-gradient(90deg, rgba(255,255,255,0.01) 0%, transparent 100%);
  }

  .phase-header:hover {
    background: rgba(255,255,255,0.03);
  }

  .phase-content {
    padding: 2rem;
    border-top: 1px solid var(--card-border);
    background: rgba(15, 23, 42, 0.3);
  }

  .phase-status {
    font-size: 0.75rem;
    padding: 0.4rem 1rem;
    border-radius: 100px;
    text-transform: uppercase;
    font-weight: 700;
    letter-spacing: 0.05em;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
  }

  .phase-status.completed { 
    background: rgba(16, 185, 129, 0.15); 
    color: #34d399; 
    border: 1px solid rgba(16, 185, 129, 0.2);
  }
  
  .phase-status.todo { 
    background: rgba(148, 163, 184, 0.1); 
    color: var(--secondary-text); 
    border: 1px solid rgba(148, 163, 184, 0.1);
  }
  
  .phase-status.locked { 
    opacity: 0.6; 
    background: rgba(0,0,0,0.2);
  }

  /* Utilities */
  .spinner { 
    width: 20px; height: 20px; 
    border: 2px solid rgba(255,255,255,0.1); 
    border-top: 2px solid var(--accent-color); 
    border-radius: 50%; 
    animation: spin 0.8s linear infinite; 
  }

  @keyframes spin { 100% { transform: rotate(360deg); } }
  
  /* Scrollbar */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  ::-webkit-scrollbar-track {
    background: rgba(15, 23, 42, 0.5);
  }
  
  ::-webkit-scrollbar-thumb {
    background: rgba(148, 163, 184, 0.3);
    border-radius: 4px;
  }
  
  ::-webkit-scrollbar-thumb:hover {
    background: rgba(148, 163, 184, 0.5);
  }
  
  /* Chip styles for tables */
  .chip-green {
    background: rgba(16, 185, 129, 0.15);
    color: #34d399;
    padding: 0.25rem 0.75rem;
    border-radius: 100px;
    font-size: 0.8rem;
    font-weight: 600;
  }
  
  .chip-blue {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
    padding: 0.25rem 0.75rem;
    border-radius: 100px;
    font-size: 0.8rem;
    font-weight: 600;
  }
  
  .chip-amber {
    background: rgba(245, 158, 11, 0.15);
    color: #fbbf24;
    padding: 0.25rem 0.75rem;
    border-radius: 100px;
    font-size: 0.8rem;
    font-weight: 600;
  }
  
  /* Table Styles */
  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
  }
  
  th {
    text-align: left;
    padding: 1rem;
    color: var(--secondary-text);
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--card-border);
    font-weight: 600;
  }
  
  td {
    padding: 1rem;
    border-bottom: 1px solid rgba(255,255,255,0.02);
    color: var(--primary-text);
  }
  
  tr:last-child td {
    border-bottom: none;
  }
  
  tr:hover td {
    background: rgba(255,255,255,0.02);
  }
  
  /* Dashboard Nav */
  .dashboard-nav {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 2rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--border-color);
  }
  
  .dashboard-nav button {
    background: transparent;
    border: none;
    color: var(--secondary-text);
    padding: 0.75rem 1.25rem;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.95rem;
    border-radius: var(--radius-sm);
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  
  .dashboard-nav button:hover {
    color: var(--primary-text);
    background: rgba(255,255,255,0.03);
  }
  
  .dashboard-nav button.active {
    color: var(--accent-color);
    background: rgba(99, 102, 241, 0.1);
    position: relative;
  }
  
  .dashboard-nav button.active::after {
    content: '';
    position: absolute;
    bottom: -0.6rem; /* Align with border-bottom of nav */
    left: 0;
    width: 100%;
    height: 2px;
    background: var(--accent-color);
    border-radius: 2px 2px 0 0;
  }

  /* Modals */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(15, 23, 42, 0.8);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 1rem;
  }

  .modal-content {
    background: #1e293b;
    border: 1px solid var(--card-border);
    border-radius: var(--radius);
    padding: 2rem;
    width: 100%;
    max-width: 600px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    position: relative;
    animation: modal-in 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  @keyframes modal-in {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }

  .button-close {
    background: transparent;
    border: none;
    color: var(--secondary-text);
    font-size: 1.5rem;
    cursor: pointer;
    line-height: 1;
    padding: 0.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .button-close:hover {
    background: rgba(255, 255, 255, 0.05);
    color: var(--primary-text);
  }

  .modal-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
  }

  /* Document Table Specifics */
  .document-table {
    margin-bottom: 2rem;
  }

  .document-status-select {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid var(--card-border);
    padding: 0.4rem 0.8rem;
    border-radius: 100px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    width: auto;
  }

  .upload-dropzone {
    border: 2px dashed var(--card-border);
    border-radius: var(--radius);
    padding: 3rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    background: rgba(255, 255, 255, 0.01);
  }

  .upload-dropzone:hover {
    border-color: var(--accent-color);
    background: rgba(99, 102, 241, 0.05);
  }
`;

