import { useState, useEffect, type FormEvent, type CSSProperties } from 'react';
import Sidebar from '../ui_elements/SideBar';
import '../CSS Files/DashBoard.css';
import { getProfile, updateUserProfile, changePassword } from '../services/api';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
    const { saveAuth } = useAuth();
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [profileMsg, setProfileMsg] = useState('');
    const [passwordMsg, setPasswordMsg] = useState('');
    const [profileError, setProfileError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getProfile();
                setName(data.first_name || '');
                setSurname(data.surname || '');
                setEmail(data.emailid || '');
            } catch {}
        };
        load();
    }, []);

    const handleProfileSave = async (e: FormEvent) => {
        e.preventDefault();
        setProfileMsg('');
        setProfileError('');
        try {
            const res = await updateUserProfile({ first_name: name, surname, emailid: email });
            setProfileMsg(res.message || 'Profile updated!');
            if (res.user) {
                saveAuth(res.user);
            }
        } catch (err: any) {
            setProfileError(err.message || 'Failed to update profile');
        }
    };

    const handlePasswordChange = async (e: FormEvent) => {
        e.preventDefault();
        setPasswordMsg('');
        setPasswordError('');

        if (newPassword !== confirmPassword) {
            setPasswordError("New passwords do not match!");
            return;
        }

        try {
            const res = await changePassword(currentPassword, newPassword, confirmPassword);
            setPasswordMsg(res.message || 'Password changed!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPasswordError(err.message || 'Failed to change password');
        }
    };

    const sectionStyle: CSSProperties = {
        backgroundColor: '#ffffff',
        border: '1px solid #cccccc',
        borderRadius: '4px',
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
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Surname</label>
                                <input
                                    type="text"
                                    style={inputStyle}
                                    value={surname}
                                    onChange={(e) => setSurname(e.target.value)}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Email</label>
                                <input
                                    type="email"
                                    style={inputStyle}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <button type="submit" style={buttonStyle}>Update Profile</button>
                            {profileMsg && <p style={successStyle}>{profileMsg}</p>}
                            {profileError && <p style={errorStyle}>{profileError}</p>}
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
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>New Password</label>
                                <input
                                    type="password"
                                    style={inputStyle}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Confirm New Password</label>
                                <input
                                    type="password"
                                    style={inputStyle}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                            <button type="submit" style={buttonStyle}>Change Password</button>
                            {passwordMsg && <p style={successStyle}>{passwordMsg}</p>}
                            {passwordError && <p style={errorStyle}>{passwordError}</p>}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Settings;