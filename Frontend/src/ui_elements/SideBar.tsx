import { Link, useLocation, useNavigate } from 'react-router-dom';
const Sidebar = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const handleLogout = () => {
        console.log("Log out clicked");
        navigate('/login');
    };
    const isActive = (path: string) => {
        return location.pathname.startsWith(path);
    };
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="brand">
                    <img src="/workspace-logo.svg" alt="Logo" width="30" height="30" />
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
                            <span className="nav-icon">🔔</span> The Big Leagues
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