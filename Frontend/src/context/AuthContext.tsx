import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import { getProfile, logoutUser } from '../services/api';

interface User {
    id: number;
    first_name: string;
    surname: string;
    emailid: string;
    global_role: string;
}

interface AuthState {
    user: User | null;
    loading: boolean;
}

type AuthAction =
    | { type: 'SET_USER'; payload: User | null }
    | { type: 'LOGOUT' }
    | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
    user: null,
    loading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
    switch (action.type) {
        case 'SET_USER':
            return { ...state, user: action.payload, loading: false };
        case 'LOGOUT':
            return { ...state, user: null, loading: false };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
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
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userData = await getProfile();
                dispatch({ type: 'SET_USER', payload: userData });
            } catch (error) {
                console.log('user not logged in!?!?! or session expired');
                dispatch({ type: 'SET_USER', payload: null });
            }
        };
        loadUser();
    }, []);

    const saveAuth = (userData: User) => {
        dispatch({ type: 'SET_USER', payload: userData });
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
