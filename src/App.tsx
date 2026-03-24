
import { GoogleGenAI } from "@google/genai";
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Header } from './components/Header';
import { LandingPage } from './views/LandingPage';
import { ProjectSetupView } from './views/ProjectSetupView';
import { ProjectDashboard } from './views/ProjectDashboard';
import { NewProjectModal } from './components/NewProjectModal';
import { DeleteProjectConfirmationModal } from './components/DeleteProjectConfirmationModal';
import { ClearAllConfirmationModal } from './components/ClearAllConfirmationModal';
import { HelpModal } from './components/HelpModal';
import { GlobalStyles } from './styles/GlobalStyles';
import { DEFAULT_SPRINTS, TEMPLATES, DEFAULT_DOCUMENTS } from './constants/projectData';
import { logAction } from './utils/logging';
import { AuthView } from './views/AuthView';
import * as authService from './utils/authService';
import { subscribeToUpdates, notifyUpdate } from './utils/syncService';
import { Project, Task, Notification, User } from './types';
import { saveProjectsToDB, loadProjectsFromDB, migrateFromLocalStorage, subscribeToRemoteChanges, deleteProjectFromDB, deleteAllProjectsFromDB } from './utils/storage';

const App = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => localStorage.getItem('hmap-selected-project-id'));
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [setupKey, setSetupKey] = useState(0);
  
  // Guard to prevent processing sync events triggered by our own saves
  const isInternalUpdate = useRef(false);

  const selectedProject = useMemo(() => {
      if (!selectedProjectId || !projects) return null;
      return projects.find(p => p.id === selectedProjectId) || null;
  }, [projects, selectedProjectId]);
  useEffect(() => {
    // Safety timeout: If auth takes too long (e.g., firebase script failure), allow the app to render the login screen.
    const safetyTimeout = setTimeout(() => {
        setIsAuthLoading(prev => {
            if (prev) {
                console.warn("Auth initialization timed out. Forcing load completion.");
                return false;
            }
            return prev;
        });
    }, 3000);

    const unsubscribeAuth = authService.onAuthStateChanged(async (user) => {
      clearTimeout(safetyTimeout);
      setCurrentUser(user);
      setIsAuthLoading(false);
      
      if (user) {
        logAction('Auth', 'App', { user: user.username });
        try {
            // Load initial data
            const dbProjects = await loadProjectsFromDB(user.id);
            setProjects(dbProjects);
            
            // Check for local storage migration
            const migrated = await migrateFromLocalStorage(user.id);
            if (migrated) setProjects(migrated);
        } catch (e) {
            console.error("Data loading error:", e);
        }
      } else {
        setProjects([]);
        setSelectedProjectId(null);
      }
    });
    return () => {
        clearTimeout(safetyTimeout);
        unsubscribeAuth();
    };
  }, []);

  // --- Remote Sync Logic ---
  useEffect(() => {
    if (currentUser) {
        const unsubscribeRemote = subscribeToRemoteChanges(currentUser.id, (remoteProjects) => {
            logAction('Sync', 'Firestore', { count: remoteProjects.length });
            // Merge logic could be more complex, but for now we trust the remote source if it updates
            // We verify if we are currently editing a project to avoid overwriting active work too aggressively
            // Ideally, granular field merging would be used.
            setProjects(prev => {
                // Simple merge: remote wins if ID matches
                const merged = [...prev];
                remoteProjects.forEach(rp => {
                    const idx = merged.findIndex(p => p.id === rp.id);
                    if (idx > -1) merged[idx] = rp;
                    else merged.push(rp);
                });
                return merged;
            });
        });
        return () => unsubscribeRemote();
    }
  }, [currentUser]);

  const userProjects = useMemo(() => {
    if (!projects || !currentUser) return [];
    return projects.filter(p => p.ownerId === currentUser.id || p.team?.some(member => member.userId === currentUser.id));
  }, [projects, currentUser]);

  const reloadStateFromStorage = useCallback(async () => {
    if (isInternalUpdate.current) {
        logAction('Sync', 'App', { status: 'Ignored internal update' });
        isInternalUpdate.current = false;
        return;
    }

    logAction('Sync', 'App', { status: 'Reloading from DB' });
    try {
        const dbProjects = await loadProjectsFromDB(currentUser?.id);
        setProjects(dbProjects);
        
        const selectedProjectId = localStorage.getItem('hmap-selected-project-id');
        if (selectedProjectId) {
            const updatedSelectedProject = dbProjects.find((p: Project) => p.id === selectedProjectId);
            if (updatedSelectedProject) {
                setSelectedProjectId(updatedSelectedProject.id);
            }
        }
    } catch (e) {
        console.error("Sync error loading from DB", e);
    }
  }, [currentUser]);

  useEffect(() => {
    const unsubscribe = subscribeToUpdates(reloadStateFromStorage);
    return () => unsubscribe();
  }, [reloadStateFromStorage]);
  
  const saveProjectsToStorage = useCallback(async (updatedProjects: Project[]) => {
    try {
      isInternalUpdate.current = true;
      // Save to IndexedDB and Firestore (if online)
      await saveProjectsToDB(updatedProjects, currentUser?.id);
      notifyUpdate();
      // Reset guard after short delay
      setTimeout(() => { isInternalUpdate.current = false; }, 500);
    } catch (e: unknown) {
      console.error("Failed to save projects to DB:", e);
      logAction('Error', 'App', { error: 'DB save failed', details: e instanceof Error ? e.message : String(e) });
      if (e instanceof Error && e.name === 'QuotaExceededError') {
          alert("Storage Quota Exceeded! Please clean up some data.");
      }
    }
  }, [currentUser]);

  const handleSelectProject = (project: Project | null) => {
    setSelectedProjectId(project ? project.id : null);
    if (project) {
        localStorage.setItem('hmap-selected-project-id', project.id);
        setIsSettingUp(false);
    } else {
        localStorage.removeItem('hmap-selected-project-id');
        setIsModalOpen(true); 
    }
  };

  const handleCreateProject = useCallback(({ name, template, mode, scope, teamSize, complexity }: { name: string, template: any, mode: string, scope: string, teamSize: string, complexity: string }) => {
    if (!currentUser) return;
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 44);
    
    const projectDocuments = JSON.parse(JSON.stringify(template.documents || DEFAULT_DOCUMENTS));
    
    // Filter documents based on complexity and team size
    let finalDocuments = projectDocuments;
    
    const coreDocs = [
        'Concept Proposal', 
        'Resources & Skills List', 
        'Statement of Work (SOW)', 
        'Detailed Plans (WBS/WRS)'
    ];
    
    const mediumDocs = [
        ...coreDocs,
        'Kickoff Briefing',
        'SWOT Analysis',
        'Preliminary Design Review',
        'Critical Review'
    ];

    if (teamSize === 'small' && complexity === 'easy') {
        // Minimum documentation for small/easy projects
        finalDocuments = projectDocuments.filter((doc: Document) => 
            coreDocs.some(title => doc.title.includes(title) || title.includes(doc.title))
        );
        // Fallback if filtering yielded too few
        if (finalDocuments.length < 3) finalDocuments = projectDocuments.slice(0, 4);
    } else if ((teamSize === 'medium' && complexity !== 'hard') || (teamSize === 'small' && complexity === 'typical')) {
        // Medium documentation
        finalDocuments = projectDocuments.filter((doc: Document) => 
            mediumDocs.some(title => doc.title.includes(title) || title.includes(doc.title))
        );
        if (finalDocuments.length < 5) finalDocuments = projectDocuments.slice(0, 8);
    } else {
        // Full documentation for large/complex projects, capped at 15
        finalDocuments = projectDocuments.slice(0, 15);
    }

    // Add necessary.json metadata to all documents
    finalDocuments.forEach((doc: Document) => {
        doc.metadata = {
            filename: `${doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`,
            created: new Date().toISOString(),
            requiredFields: ['title', 'version', 'status', 'content']
        };
    });
    
    const mandatoryDocs = [
        { title: 'Statement of Work (SOW)', phase: 5, sequence: 1 },
        { title: 'Resources & Skills List', phase: 2, sequence: 1 },
        { title: 'Detailed Plans (WBS/WRS)', phase: 7, sequence: 1 }
    ];

    mandatoryDocs.forEach(mandatoryDoc => {
        const simpleTitle = mandatoryDoc.title.replace(/\s\(.*\)/, '');
        const hasDoc = finalDocuments.some((doc: Document) => doc.title.includes(simpleTitle));
        
        if (!hasDoc) {
            finalDocuments.push({
                id: `doc-mandatory-${Date.now()}-${mandatoryDoc.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                title: mandatoryDoc.title, version: 'v1.0', status: 'Working', owner: 'A. User', phase: mandatoryDoc.phase,
                sequence: mandatoryDoc.sequence,
                metadata: {
                    filename: `${mandatoryDoc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`,
                    created: new Date().toISOString()
                }
            });
        }
    });

    if (scope === 'subcontracted') {
        const hasRFP = finalDocuments.some((doc: Document) => doc.title.toLowerCase().includes('request for proposal') || doc.title.toLowerCase().includes('rfp'));
        if (!hasRFP) {
            finalDocuments.push({
                id: `doc-subco-${Date.now()}-rfp`, title: 'Request for Proposal (RFP)', version: 'v1.0', status: 'Working', owner: 'A. User', phase: 2, sequence: 50,
                metadata: { filename: 'rfp.json', created: new Date().toISOString() }
            });
        }
        
        const hasContract = finalDocuments.some((doc: Document) => doc.title.toLowerCase().includes('contract') || doc.title.toLowerCase().includes('agreement'));
        if (!hasContract) {
             finalDocuments.push({
                id: `doc-subco-${Date.now()}-contract`, title: "Draft Contract with T's & C's", version: 'v1.0', status: 'Working', owner: 'A. User', phase: 5, sequence: 50,
                metadata: { filename: 'contract.json', created: new Date().toISOString() }
            });
        }
    }
    
    const newProject: Project = { 
        id: Date.now().toString(), name, mode, scope, generationMode: 'manual', teamSize, complexity: complexity || 'typical', discipline: template.discipline,
        ownerId: currentUser.id,
        phasesData: {},
        team: [{ userId: currentUser.id, role: 'Project Owner', name: currentUser.username, email: currentUser.email }],
        documents: finalDocuments, tasks: [], sprints: JSON.parse(JSON.stringify(DEFAULT_SPRINTS)), milestones: [], resources: [],
        avgBurdenedLaborRate: 125, budget: 100000,
        startDate: today.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        changeRequest: { title: '', reason: '', impactStr: '' },
        scenarios: [
            { id: 1, name: 'A: Use contractors', impactStr: '+10d +8000c' },
            { id: 2, name: 'B: Defer feature', impactStr: '+0d +0c' },
        ],
        notifications: [],
    };
    const updatedProjects = [...projects, newProject];
    setProjects(updatedProjects);
    saveProjectsToStorage(updatedProjects);
    
    handleSelectProject(newProject);
    setIsSettingUp(false);
    logAction('Create Project', newProject.name, { newProject: newProject.id });
  }, [currentUser, projects, saveProjectsToStorage]);
  
  const handleSaveProject = useCallback((updatedProject: Project) => {
    setProjects(prevProjects => {
        const updatedProjects = prevProjects.map(p => p.id === updatedProject.id ? updatedProject : p);
        saveProjectsToStorage(updatedProjects);
        return updatedProjects;
    });
    logAction('Save Project', updatedProject.name, { projectId: updatedProject.id });
  }, [saveProjectsToStorage]);

  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setSelectedProjectId(null);
    setIsSettingUp(false);
    localStorage.removeItem('hmap-selected-project-id');
  };

  const handleRequestDeleteProject = (project: Project) => {
    setProjectToDelete(project);
    setIsDeleteConfirmationOpen(true);
    setIsModalOpen(false);
  };

  const handleConfirmDeletion = async () => {
    if (!projectToDelete) return;
    try {
        const updatedProjects = projects.filter(p => p.id !== projectToDelete.id);
        setProjects(updatedProjects);
        await deleteProjectFromDB(projectToDelete.id);
        
        if (selectedProjectId && selectedProjectId === projectToDelete.id) {
            setSelectedProjectId(null);
            localStorage.removeItem('hmap-selected-project-id');
        }
        setProjectToDelete(null);
        setIsDeleteConfirmationOpen(false);
        logAction('Delete Project', projectToDelete.name, { projectId: projectToDelete.id });
    } catch (error) {
        console.error("Failed to delete project:", error);
        alert("Failed to delete project. Please try again.");
    }
  };

  const handleClearAllProjects = () => {
    setIsClearAllModalOpen(true);
  };

  const handleConfirmClearAll = async () => {
    try {
        await deleteAllProjectsFromDB(currentUser?.id);
        setProjects([]);
        setSelectedProjectId(null);
        localStorage.removeItem('hmap-selected-project-id');
        setIsSettingUp(false);
        setIsClearAllModalOpen(false);
        logAction('Clear All Projects', 'All', { userId: currentUser?.id });
    } catch (error) {
        console.error("Failed to clear projects:", error);
        alert("Failed to clear projects. Please try again.");
    }
  };

  if (isAuthLoading) {
      return (
          <>
            <style>{GlobalStyles}</style>
            <div style={{height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column'}}>
                <div className="spinner" style={{width: '50px', height: '50px'}}></div>
                <p style={{marginTop: '1rem', color: 'var(--secondary-text)'}}>Establishing Secure Uplink...</p>
            </div>
          </>
      );
  }

  return (
    <>
        <style>{GlobalStyles}</style>

        {!currentUser ? (
            <AuthView onLogin={(user) => setCurrentUser(user)} />
        ) : (
            <>
                <Header 
                    onNewProject={() => {
                        setSelectedProjectId(null);
                        localStorage.removeItem('hmap-selected-project-id');
                        setIsSettingUp(true);
                        setSetupKey(prev => prev + 1);
                    }} 
                    onHomeClick={() => { setSelectedProjectId(null); setIsSettingUp(false); }}
                    disabled={false}
                    isLandingPage={!selectedProject && !isSettingUp}
                    currentUser={currentUser}
                    onLogout={handleLogout}
                    notifications={selectedProject?.notifications || []}
                    onNotificationClick={() => {}}
                    onMarkAllRead={() => {}}
                    onClearAllProjects={handleClearAllProjects}
                />
                <main>
                    {selectedProject ? (
                        <ProjectDashboard 
                            project={selectedProject} 
                            onBack={() => handleSelectProject(null)} 
                            saveProject={handleSaveProject}
                            currentUser={currentUser}
                            key={selectedProject.id}
                        />
                    ) : isSettingUp ? (
                        <ProjectSetupView
                            key={setupKey}
                            onBack={() => setIsSettingUp(false)}
                            onCreateProject={handleCreateProject}
                            currentUser={currentUser}
                        />
                    ) : (
                        <LandingPage
                            projects={userProjects}
                            onSelectProject={(p) => p ? handleSelectProject(p) : setIsModalOpen(true)}
                            onNewProject={() => {
                                setIsSettingUp(true);
                                setSetupKey(prev => prev + 1);
                            }}
                            currentUser={currentUser}
                        />
                    )}
                </main>

                {isModalOpen && (
                    <NewProjectModal 
                        isOpen={true} 
                        onClose={() => setIsModalOpen(false)} 
                        onCreateProject={() => {}} 
                        projects={userProjects}
                        onSelectProject={handleSelectProject}
                        onRequestDelete={handleRequestDeleteProject}
                        currentUser={currentUser}
                        initialTab="select"
                    />
                )}

                {projectToDelete && (
                  <DeleteProjectConfirmationModal
                      isOpen={isDeleteConfirmationOpen}
                      onClose={() => setIsDeleteConfirmationOpen(false)}
                      onConfirm={handleConfirmDeletion}
                      projectName={projectToDelete.name}
                  />
                )}

                {isClearAllModalOpen && (
                    <ClearAllConfirmationModal
                        isOpen={true}
                        onClose={() => setIsClearAllModalOpen(false)}
                        onConfirm={handleConfirmClearAll}
                    />
                )}
            </>
        )}
        
        <button className="help-fab" onClick={() => setIsHelpModalOpen(true)} aria-label="Open Help">?</button>
        <HelpModal isOpen={isHelpModalOpen} onClose={() => setIsHelpModalOpen(false)} />
    </>
  );
};

export default App;
