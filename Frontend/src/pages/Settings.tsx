import { useReducer, useEffect, type FormEvent, type CSSProperties } from 'react';
import Sidebar from '../ui_elements/SideBar';
import '../CSS Files/DashBoard.css';
import { getProfile, updateUserProfile, changePassword } from '../services/api';
import { useAuth } from '../context/AuthContext';

// all the form fields and messages in one state
interface SettingsState {
    name: string;
    surname: string;
    email: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    profileMsg: string;
    passwordMsg: string;
    profileError: string;
    passwordError: string;
}

// actions for the reducer
type SettingsAction =
    | { type: 'SET_FIELD'; field: string; value: string }
    | { type: 'LOAD_PROFILE'; name: string; surname: string; email: string }
    | { type: 'PROFILE_SUCCESS'; message: string }
    | { type: 'PROFILE_ERROR'; error: string }
    | { type: 'PASSWORD_SUCCESS'; message: string }
    | { type: 'PASSWORD_ERROR'; error: string }
    | { type: 'CLEAR_PROFILE_MSG' }
    | { type: 'CLEAR_PASSWORD_MSG' }
    | { type: 'RESET_PASSWORD_FIELDS' };

function settingsReducer(state: SettingsState, action: SettingsAction): SettingsState {
    switch (action.type) {
        case 'SET_FIELD':
            return { ...state, [action.field]: action.value };
        case 'LOAD_PROFILE':
            return { ...state, name: action.name, surname: action.surname, email: action.email };
        case 'PROFILE_SUCCESS':
            return { ...state, profileMsg: action.message, profileError: '' };
        case 'PROFILE_ERROR':
            return { ...state, profileError: action.error, profileMsg: '' };
        case 'PASSWORD_SUCCESS':
            return { ...state, passwordMsg: action.message, passwordError: '', currentPassword: '', newPassword: '', confirmPassword: '' };
        case 'PASSWORD_ERROR':
            return { ...state, passwordError: action.error, passwordMsg: '' };
        case 'CLEAR_PROFILE_MSG':
            return { ...state, profileMsg: '', profileError: '' };
        case 'CLEAR_PASSWORD_MSG':
            return { ...state, passwordMsg: '', passwordError: '' };
        case 'RESET_PASSWORD_FIELDS':
            return { ...state, currentPassword: '', newPassword: '', confirmPassword: '' };
        default:
            return state;
    }
}

const initialState: SettingsState = {
    name: '',
    surname: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    profileMsg: '',
    passwordMsg: '',
    profileError: '',
    passwordError: '',
};

const Settings = () => {
    const { saveAuth } = useAuth();
    const [state, dispatch] = useReducer(settingsReducer, initialState);

    useEffect(() => {
        const load = async () => {
            try {
                // load current profile
                const data = await getProfile();
                dispatch({ type: 'LOAD_PROFILE', name: data.first_name || '', surname: data.surname || '', email: data.emailid || '' });
            } catch {}
        };
        load();
    }, []);

    const handleProfileSave = async (e: FormEvent) => {
        e.preventDefault();
        dispatch({ type: 'CLEAR_PROFILE_MSG' });
        try {
            // update profile details
            const res = await updateUserProfile({ first_name: state.name, surname: state.surname, emailid: state.email });
            dispatch({ type: 'PROFILE_SUCCESS', message: res.message || 'Profile updated!' });
            if (res.user) {
                saveAuth(res.user);
            }
        } catch (err) {
            dispatch({ type: 'PROFILE_ERROR', error: (err as Error).message || 'Failed to update profile' });
        }
    };

    const handlePasswordChange = async (e: FormEvent) => {
        e.preventDefault();
        dispatch({ type: 'CLEAR_PASSWORD_MSG' });

        // check if subbed passwords match
        if (state.newPassword !== state.confirmPassword) {
            dispatch({ type: 'PASSWORD_ERROR', error: "New passwords do not match!" });
            return;
        }

        try {
            // change user password
            const res = await changePassword(state.currentPassword, state.newPassword, state.confirmPassword);
            dispatch({ type: 'PASSWORD_SUCCESS', message: res.message || 'Password changed!' });
        } catch (err) {
            dispatch({ type: 'PASSWORD_ERROR', error: (err as Error).message || 'Failed to change password' });
        }
    };

    const sectionStyle: CSSProperties = {
        backgroundColor: '#f0fff0', 
        border: '1px solid #cccccc',
        borderRadius: '7px',
        padding: '20px',
        marginBottom: '20px',
        maxWidth: '600px',
        flex: 1,
        minWidth: '300px'
    };
    const labelStyle: CSSProperties = {
        display: 'block',
        color: '#333333',
        fontWeight: 'bold',
        fontSize: '0.9rem',
        marginBottom: '5px'
    };
    const inputStyle: CSSProperties = {
        width: '100%',
        padding: '10px',
        backgroundColor: '#ffffff',
        border: '1px solid #cccccc',
        borderRadius: '4px',
        color: '#000000',
        fontSize: '0.9rem',
        boxSizing: 'border-box',
        marginTop: '5px',
        marginBottom: '15px'
    };
    const buttonStyle: CSSProperties = {
        backgroundColor: '#007bff',
        color: '#ffffff',
        border: 'none',
        padding: '10px 15px',
        borderRadius: '4px',
        fontSize: '0.9rem',
        cursor: 'pointer',
        marginTop: '10px'
    };
    const successStyle: CSSProperties = {
        color: '#28a745',
        fontSize: '0.85rem',
        marginTop: '10px'
    };
    const errorStyle: CSSProperties = {
        color: '#dc3545',
        fontSize: '0.85rem',
        marginTop: '10px'
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <div className="main-content">
                <h1 style={{ marginBottom: '10px', color: '#000000' }}>Settings</h1>
                <p style={{ color: '#666666', marginTop: 0, marginBottom: '30px' }}>Manage your account preferences.</p>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={sectionStyle}>
                        <h2 style={{ marginTop: 0, fontSize: '1.2rem', color: '#000000' }}>Profile</h2>
                        <form onSubmit={handleProfileSave}>
                            <div>
                                <label style={labelStyle}>First Name</label>
                                <input
                                    type="text"
                                    style={inputStyle}
                                    value={state.name}
                                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'name', value: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Surname</label>
                                <input
                                    type="text"
                                    style={inputStyle}
                                    value={state.surname}
                                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'surname', value: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Email</label>
                                <input
                                    type="email"
                                    style={inputStyle}
                                    value={state.email}
                                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'email', value: e.target.value })}
                                />
                            </div>
                            <button type="submit" style={buttonStyle}>Update Profile</button>
                            {state.profileMsg && <p style={successStyle}>{state.profileMsg}</p>}
                            {state.profileError && <p style={errorStyle}>{state.profileError}</p>}
                        </form>
                    </div>
                    <div style={sectionStyle}>
                        <h2 style={{ marginTop: 0, fontSize: '1.2rem', color: '#000000' }}>Security</h2>
                        <form onSubmit={handlePasswordChange}>
                            <div>
                                <label style={labelStyle}>Current Password</label>
                                <input
                                    type="password"
                                    style={inputStyle}
                                    value={state.currentPassword}
                                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'currentPassword', value: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>New Password</label>
                                <input
                                    type="password"
                                    style={inputStyle}
                                    value={state.newPassword}
                                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'newPassword', value: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Confirm New Password</label>
                                <input
                                    type="password"
                                    style={inputStyle}
                                    value={state.confirmPassword}
                                    onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'confirmPassword', value: e.target.value })}
                                />
                            </div>
                            <button type="submit" style={buttonStyle}>Change Password</button>
                            {state.passwordMsg && <p style={successStyle}>{state.passwordMsg}</p>}
                            {state.passwordError && <p style={errorStyle}>{state.passwordError}</p>}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Settings;