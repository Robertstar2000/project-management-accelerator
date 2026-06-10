
import { User } from '../types';
import { auth } from './firebaseConfig';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged as firebaseOnAuthStateChanged,
    updateProfile
} from "firebase/auth";

const USERS_KEY = 'hmap-users';
const SESSION_KEY = 'hmap-session';

// --- Local Helpers ---
const getLocalUsers = (): User[] => {
    try {
        const users = localStorage.getItem(USERS_KEY);
        return users ? JSON.parse(users) : [];
    } catch (error) {
        return [];
    }
};

const saveLocalUsers = (users: User[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

// --- Service Methods ---

export const register = async (username: string, email: string, password: string): Promise<User | null> => {
    if (auth) {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await updateProfile(userCredential.user, { displayName: username });
            
            const user: User = {
                id: userCredential.user.uid,
                username: username,
                email: email,
                notificationPrefs: { teams: false, slack: false, outlook: false, gmail: false }
            };
            return user;
        } catch (error) {
            console.error("Firebase Registration Error:", error);
            throw error;
        }
    } else {
        // Local Fallback
        const users = getLocalUsers();
        if (users.some(u => u.username === username || u.email === email)) {
            throw new Error("User already exists locally.");
        }
        const newUser: User = { 
            id: `user-${Date.now()}`, 
            username, 
            email, 
            password, // Note: Storing plain text password locally is for prototype only
            notificationPrefs: { teams: false, slack: false, outlook: false, gmail: false }
        };
        saveLocalUsers([...users, newUser]);
        return newUser;
    }
};

export const login = async (email: string, password: string): Promise<User | null> => {
    if (auth) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user: User = {
                id: userCredential.user.uid,
                username: userCredential.user.displayName || email.split('@')[0],
                email: email,
                notificationPrefs: { teams: false, slack: false, outlook: false, gmail: false }
            };
            return user;
        } catch (error) {
            console.error("Firebase Login Error:", error);
            return null;
        }
    } else {
        // Local Fallback
        const users = getLocalUsers();
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(user));
            return user;
        }
        return null;
    }
};

export const logout = async (): Promise<void> => {
    if (auth) {
        await signOut(auth);
    }
    localStorage.removeItem(SESSION_KEY);
};

export const getCurrentUser = async (): Promise<User | null> => {
    // If Firebase is active, we rely on onAuthStateChanged in the App component mostly,
    // but this can return the local session snapshot if needed.
    if (auth) {
        const fbUser = auth.currentUser;
        if (fbUser) {
            return {
                id: fbUser.uid,
                username: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
                email: fbUser.email || '',
            };
        }
    }
    
    // Check local storage fallback
    try {
        const session = localStorage.getItem(SESSION_KEY);
        if (session) return JSON.parse(session);
    } catch (e) {
        console.error(e);
    }
    return null;
};

export const onAuthStateChanged = (callback: (user: User | null) => void) => {
    if (auth) {
        return firebaseOnAuthStateChanged(auth, (fbUser) => {
            if (fbUser) {
                const user: User = {
                    id: fbUser.uid,
                    username: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
                    email: fbUser.email || '',
                };
                // Sync session to local storage for hybrid access
                localStorage.setItem(SESSION_KEY, JSON.stringify(user));
                callback(user);
            } else {
                localStorage.removeItem(SESSION_KEY);
                callback(null);
            }
        });
    } else {
        // Mock listener for local storage changes
        const checkLocal = () => {
            const session = localStorage.getItem(SESSION_KEY);
            callback(session ? JSON.parse(session) : null);
        };
        window.addEventListener('storage', checkLocal);
        checkLocal(); // Initial check
        return () => window.removeEventListener('storage', checkLocal);
    }
};
