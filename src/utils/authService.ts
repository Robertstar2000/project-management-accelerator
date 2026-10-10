import { User } from '../types';

export const register = async (
    username: string, 
    email: string, 
    password: string, 
    geminiKey?: string,
    plan?: string
): Promise<User | null> => {
    try {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ username, email, password, geminiKey, plan })
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Registration failed');
        }
        const data = await res.json();
        window.dispatchEvent(new Event('pm-auth-changed'));
        return data.user || data;
    } catch (e) {
        console.error("Registration error:", e);
        throw e;
    }
};

export const login = async (email: string, password: string): Promise<User | null> => {
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Login failed');
        }
        const data = await res.json();
        window.dispatchEvent(new Event('pm-auth-changed'));
        return data.user || data;
    } catch (e) {
        console.error("Login error:", e);
        throw e;
    }
};

export const studioTestLogin = async (email?: string, username?: string): Promise<User | null> => {
    try {
        const res = await fetch('/api/auth/studio-test-login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, username })
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Studio test login failed');
        }
        const data = await res.json();
        localStorage.setItem('mifeco-use-internal-key', 'true');
        window.dispatchEvent(new Event('pm-auth-changed'));
        return data.user || data;
    } catch (e) {
        console.error("Studio test login error:", e);
        throw e;
    }
};

export const byoLlmLogin = async (
    provider: string,
    model?: string,
    apiKey?: string,
    username?: string,
    email?: string
): Promise<User | null> => {
    try {
        const res = await fetch('/api/auth/byo-llm-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ provider, model, apiKey, username, email })
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'BYO LLM login failed');
        }
        const data = await res.json();
        window.dispatchEvent(new Event('pm-auth-changed'));
        return data.user || data;
    } catch (e) {
        console.error("BYO LLM login error:", e);
        throw e;
    }
};

export const logout = async (): Promise<void> => {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Accept': 'application/json' },
            credentials: 'include'
        });
    } catch (e) {
        console.warn("Logout request failed:", e);
    }
    // Clear any local flags
    localStorage.removeItem('mifeco-use-internal-key');
    window.dispatchEvent(new Event('pm-auth-changed'));
};

export const getCurrentUser = async (): Promise<User | null> => {
    try {
        const res = await fetch('/api/auth/me', {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            credentials: 'include'
        });
        if (!res.ok) {
            return null;
        }
        const data = await res.json();
        if (data && data.authenticated && data.id) {
            return data;
        }
        return null;
    } catch (e) {
        return null;
    }
};

export const updateGeminiKey = async (userId: string, geminiKey: string): Promise<void> => {
    try {
        const res = await fetch(`/api/users/${userId}/geminikey`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ geminiKey })
        });
        if (!res.ok) {
            throw new Error('Failed to update Gemini key');
        }
        window.dispatchEvent(new Event('pm-auth-changed'));
    } catch (e) {
        console.error(e);
        throw e;
    }
};

export const onAuthStateChanged = (callback: (user: User | null) => void) => {
    // Initial server auth check
    getCurrentUser().then(user => {
        callback(user);
    });

    const handleAuthChange = () => {
        getCurrentUser().then(user => {
            callback(user);
        });
    };

    window.addEventListener('pm-auth-changed', handleAuthChange);
    return () => {
        window.removeEventListener('pm-auth-changed', handleAuthChange);
    };
};
