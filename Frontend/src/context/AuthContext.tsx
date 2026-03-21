import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { getProfile, logoutUser } from '../services/api';

interface User {
    id: number;
    first_name: string;
    surname: string;
    emailid: string;
}

interface AuthContextType {
    user: User | null;
    saveAuth: (userData: User) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            // check if user is logged in on load
            try {
                const userData = await getProfile();
                setUser(userData);
            } catch (error) {
                console.log('user not logged in!?!?! or session expired');
                setUser(null);
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const saveAuth = (userData: User) => {
        setUser(userData);
    };

    const logout = async () => {
        // clear user session and logout
        try {
            await logoutUser();
            setUser(null);
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, saveAuth, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider');
    }
    return context;
};
