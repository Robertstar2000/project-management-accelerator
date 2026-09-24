
import { User } from '../types';

const BYPASS_AUTH = false; // Turn off bypass to use real DB

const csrfPost = async (path: string, body: unknown) => {
    const { csrfToken } = await fetch('/api/auth/csrf', { credentials: 'same-origin' }).then(r => r.json());
    return fetch(path, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken }, body: JSON.stringify(body) });
};

export const register = async (username: string, email: string, password: string, geminiKey?: string): Promise<User | null> => {
    if (BYPASS_AUTH) return null;
    try {
        const res = await csrfPost('/api/auth/signup', { username, email, password, geminiKey });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Registration failed');
        }
        const data = await res.json();
        return Object.assign(data.user, { recoveryCodes: data.recoveryCodes });
    } catch (e) {
        console.error(e);
        throw e;
    }
};

export const login = async (email: string, password: string): Promise<User | null> => {
    if (BYPASS_AUTH) return null;
    try {
        const res = await csrfPost('/api/auth/login', { email, password });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Login failed');
        }
        const data = await res.json();
        return data.user;
    } catch (e) {
        console.error(e);
        throw e;
    }
};

export const logout = async (): Promise<void> => {
    await csrfPost('/api/auth/logout', {});
    localStorage.removeItem('hmap-current-user');
};

export const getCurrentUser = async (): Promise<User | null> => {
    const response = await fetch('/api/auth/me', { credentials: 'same-origin' });
    if (!response.ok) return null;
    return (await response.json()).user;
};

export const updateGeminiKey = async (userId: string, geminiKey: string): Promise<void> => {
    try {
        const res = await csrfPost(`/api/users/${userId}/geminikey`, { geminiKey });
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

