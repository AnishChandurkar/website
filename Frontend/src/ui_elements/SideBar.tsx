import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { fetchNotifications } from '../services/api';

const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [hasUnread, setHasUnread] = useState(false);

    const checkUnread = async () => {
        try {
            const data = await fetchNotifications();
            setHasUnread(data.some((n: any) => !n.is_read));
        } catch {}
    };

    useEffect(() => {
        checkUnread();
        const interval = setInterval(checkUnread, 15000);
        return () => clearInterval(interval);
    }, []);

    const handleLogout = () => {
        navigate('/login');
    };
    const isActive = (path: string) => {
        return location.pathname.startsWith(path);
    };
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="brand">
                    <img src="/logo.jpg" alt="Logo" width="60" height="50" />
                    <h2>WORKSPACE</h2>
                </div>
            </div>
            <nav className="sidebar-nav">
                <ul>
                    <li>
                        <Link to="/dashboard" className={isActive('/dashboard') || isActive('/project') ? 'active' : ''}>
                            <span className="nav-icon">📋</span> Projects
                        </Link>
                    </li>
                    
                    <li>
                        <Link to="/notifications" className={isActive('/notifications') ? 'active' : ''}>
                            <span className="nav-icon">🔔</span> Notifications
                            {hasUnread && <span style={{
                                display: 'inline-block',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: '#e74c3c',
                                marginLeft: '8px',
                                verticalAlign: 'middle'
                            }} />}
                        </Link>
                    </li>

                    <li>
                        <Link to="/team" className={isActive('/team') ? 'active' : ''}>
                            <span className="nav-icon">👥</span> Team
                        </Link>
                    </li>

                    <li>
                        <Link to="/archived" className={isActive('/archived') ? 'active' : ''}>
                            <span className="nav-icon">📦</span> Archived
                        </Link>
                    </li>
                    
                    <li>
                        <Link to="/profile" className={isActive('/profile') ? 'active' : ''}>
                            <span className="nav-icon">👤</span> Profile
                        </Link>
                    </li>

                    <li>
                        <Link to="/settings" className={isActive('/settings') ? 'active' : ''}>
                            <span className="nav-icon">⚙️</span> Settings
                        </Link>
                    </li>
                </ul>
            </nav>
            <div className="sidebar-logout">
                <button onClick={handleLogout}>
                    <span className="nav-icon">↪</span> Log Out
                </button>
            </div>
        </div>
    );
};
export default Sidebar;