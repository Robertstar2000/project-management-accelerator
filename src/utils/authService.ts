
import { User } from '../types';

const BYPASS_AUTH = false; // Turn off bypass to use real DB

export const register = async (username: string, email: string, password: string, geminiKey?: string): Promise<User | null> => {
    if (BYPASS_AUTH) return null;
    try {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password, geminiKey })
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Registration failed');
        }
        const user = await res.json();
        localStorage.setItem('hmap-current-user', JSON.stringify(user));
        return user;
    } catch (e) {
        console.error(e);
        throw e;
    }
};

export const login = async (email: string, password: string): Promise<User | null> => {
    if (BYPASS_AUTH) return null;
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Login failed');
        }
        const user = await res.json();
        localStorage.setItem('hmap-current-user', JSON.stringify(user));
        return user;
    } catch (e) {
        console.error(e);
        throw e;
    }
};

export const logout = async (): Promise<void> => {
    localStorage.removeItem('hmap-current-user');
};

export const getCurrentUser = async (): Promise<User | null> => {
    const userStr = localStorage.getItem('hmap-current-user');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    }
    return null;
};

export const updateGeminiKey = async (userId: string, geminiKey: string): Promise<void> => {
    try {
        const res = await fetch(`/api/users/${userId}/geminikey`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ geminiKey })
        });
        if (!res.ok) {
            throw new Error('Failed to update Gemini key');
        }
        
        // Update local storage user object
        const currentUser = await getCurrentUser();
        if (currentUser && currentUser.id === userId) {
            const updatedUser = { ...currentUser, geminiKey };
            localStorage.setItem('hmap-current-user', JSON.stringify(updatedUser));
            // Also update the old local storage key for backwards compatibility with App.tsx
            if (geminiKey) {
                localStorage.setItem('hmap-gemini-api-key', geminiKey);
            } else {
                localStorage.removeItem('hmap-gemini-api-key');
            }
            // Dispatch a custom event so the current tab can update its state
            window.dispatchEvent(new Event('hmap-user-updated'));
        }
    } catch (e) {
        console.error(e);
        throw e;
    }
};

export const onAuthStateChanged = (callback: (user: User | null) => void) => {
    // Check local storage initially
    getCurrentUser().then(user => {
        callback(user);
    });

    // Listen for changes across tabs
    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'hmap-current-user') {
            if (e.newValue) {
                try {
                    callback(JSON.parse(e.newValue));
                } catch (err) {
                    callback(null);
                }
            } else {
                callback(null);
            }
        }
    };

    // Listen for changes in the same tab
    const handleLocalUpdate = () => {
        getCurrentUser().then(user => {
            callback(user);
        });
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('hmap-user-updated', handleLocalUpdate);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('hmap-user-updated', handleLocalUpdate);
    };
};

