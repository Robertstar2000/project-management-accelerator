
import { Project } from '../types';

// --- Main Exported Functions ---

export const saveProjectsToDB = async (projects: Project[], userId?: string): Promise<void> => {
    try {
        const response = await fetch('/api/projects', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(projects)
        });
        if (!response.ok) {
            throw new Error('Failed to save projects to backend');
        }
    } catch (e) {
        console.error("Storage Error", e);
        throw e;
    }
};

export const deleteProjectFromDB = async (projectId: string): Promise<void> => {
    try {
        const response = await fetch(`/api/projects/${projectId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Failed to delete project from backend');
        }
    } catch (e) {
        console.error("Delete Error", e);
        throw e;
    }
};

export const deleteAllProjectsFromDB = async (userId?: string): Promise<void> => {
    try {
        const url = userId ? `/api/projects?userId=${encodeURIComponent(userId)}` : '/api/projects';
        const response = await fetch(url, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Failed to delete all projects from backend');
        }
    } catch (e) {
        console.error("Delete All Error", e);
        throw e;
    }
};

export const loadProjectsFromDB = async (userId?: string): Promise<Project[]> => {
    try {
        const url = userId ? `/api/projects?userId=${encodeURIComponent(userId)}` : '/api/projects';
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to load projects from backend');
        }
        return await response.json();
    } catch (e) {
        console.error("Backend Load Error", e);
        return [];
    }
};

export const migrateFromLocalStorage = async (userId?: string): Promise<Project[] | null> => {
    const localData = localStorage.getItem('hmap-projects');
    if (localData) {
        try {
            const projects = JSON.parse(localData);
            if (Array.isArray(projects) && projects.length > 0) {
                await saveProjectsToDB(projects, userId);
                localStorage.removeItem('hmap-projects'); 
                return projects;
            }
        } catch (e) {
            console.error("Migration failed", e);
        }
    }
    return null;
};

// --- Real-time Sync Listener ---
export const subscribeToRemoteChanges = (userId: string, onUpdate: (projects: Project[]) => void) => {
    if (!userId) return () => {};

    // Simple polling mechanism for SQLite backend
    const intervalId = setInterval(async () => {
        try {
            const projects = await loadProjectsFromDB(userId);
            if (projects.length > 0) {
                onUpdate(projects);
            }
        } catch (error) {
            console.warn("Polling error:", error);
        }
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(intervalId);
};

