import { useState, type FormEvent, type CSSProperties } from 'react';
import Sidebar from '../ui_elements/SideBar';
import '../CSS Files/DashBoard.css';
const Settings = () => {
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [description, setDescription] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const handleProfileSave = (e: FormEvent) => {
        e.preventDefault();
        console.log("Profile updated:", name, surname, description);
    };
    const handlePasswordChange = (e: FormEvent) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            alert("New passwords do not match!");
            return;
        }
        console.log("Password changed!");
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
                                <label style={labelStyle}>Name</label>
                                <input
                                    type="text"
                                    style={inputStyle}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Surname</label>
                                <input
                                    type="text"
                                    style={inputStyle}
                                    value={surname}
                                    onChange={(e) => setSurname(e.target.value)}
                                    placeholder="Enter your surname"
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Description</label>
                                <textarea
                                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Tell us about yourself"
                                />
                            </div>
                            <button type="submit" style={buttonStyle}>Update Profile</button>
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
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Settings;