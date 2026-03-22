import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { getProfile, logoutUser } from '../services/api';

interface User {
    id: number;
    first_name: string;
    surname: string;
    emailid: string;
    global_role: string;
}

// state shape for auth
interface AuthState {
    user: User | null;
    loading: boolean;
}

// possible actions
type AuthAction =
    | { type: 'SET_USER'; user: User | null }
    | { type: 'LOGOUT' }
    | { type: 'DONE_LOADING' };

// handles state changes based on actions
function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case 'SET_USER':
            return { user: action.user, loading: false };
        case 'LOGOUT':
            return { user: null, loading: false };
        case 'DONE_LOADING':
            return { ...state, loading: false };
        default:
            return state;
    }
}

interface AuthContextType {
    user: User | null;
    saveAuth: (userData: User) => void;
    logout: () => void;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(authReducer, { user: null, loading: true });

    useEffect(() => {
        // check if user is already logged in
        const loadUser = async () => {
            try {
                const userData = await getProfile();
                dispatch({ type: 'SET_USER', user: userData });
            } catch {
                // session expired or not logged in
                dispatch({ type: 'SET_USER', user: null });
            }
        };
        loadUser();
    }, []);

    const saveAuth = (userData: User) => {
        dispatch({ type: 'SET_USER', user: userData });
    };

    const logout = async () => {
        try {
            await logoutUser();
            dispatch({ type: 'LOGOUT' });
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user: state.user, saveAuth, logout, loading: state.loading }}>
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
