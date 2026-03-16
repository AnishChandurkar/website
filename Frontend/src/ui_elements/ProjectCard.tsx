import { useState } from 'react';
import '../CSS Files/ProjectCard.css';
interface ProjectCardProps {
    id: number;
    name: string;
    status: 'In Progress' | 'Completed' | 'Planning' | 'On Hold' | 'Review';
    timeAgo: string;
    progressPercentage: number;
    avatars: string[];
    additionalAvatars: number;
    onArchive?: (id: number) => void;
    onDelete?: (id: number) => void;
}
const ProjectCard = ({
    id,
    name,
    status,
    timeAgo,
    progressPercentage,
    avatars,
    additionalAvatars,
    onArchive,
    onDelete
}: ProjectCardProps) => {
    
    const [menuOpen, setMenuOpen] = useState(false);
    let statusClass = 'status-in-progress';
    if (status === 'Completed') statusClass = 'status-completed';
    if (status === 'Planning') statusClass = 'status-planning';
    if (status === 'On Hold') statusClass = 'status-on-hold';
    if (status === 'Review') statusClass = 'status-review';
    return (
        <div className="project-card">
            <div className="card-top">
                <div className="icon-folder-container">
                    <span>📂</span>
                </div>
                <div className="card-actions">
                    <span className="star-icon">★</span>
                    
                    <div className="menu-container">
                        <span
                            className="menu-dots"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            ⋮
                        </span>
                        {menuOpen && (
                            <div className="dropdown-menu">
                                {onArchive && (
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            onArchive(id);
                                            setMenuOpen(false);
                                        }}
                                    >
                                        <span className="dropdown-icon">📦</span>
                                        Archive
                                    </button>
                                )}
                                {onDelete && (
                                    <button
                                        className="dropdown-item dropdown-item-danger"
                                        onClick={() => {
                                            if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
                                                onDelete(id);
                                            }
                                            setMenuOpen(false);
                                        }}
                                    >
                                        <span className="dropdown-icon">🗑️</span>
                                        Delete
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <h3>{name}</h3>
            <div className="project-meta">
                <span className={`status-badge ${statusClass}`}>{status}</span>
                <span className="time-ago">{timeAgo}</span>
            </div>
            <div className="progress-section">
                <div className="progress-label">
                    <strong>Progress:</strong> {progressPercentage}%
                </div>
            </div>
            <div className="card-footer">
                <div className="avatar-list">
                    {avatars.map((avatar, index) => (
                        <div key={index} className="avatar-circle">
                            {avatar}
                        </div>
                    ))}
                    {additionalAvatars > 0 && (
                        <div className="avatar-circle additional-avatars">
                            +{additionalAvatars}
                        </div>
                    )}
                </div>
                <a href="#" className="view-details">
                    View Details
                </a>
            </div>
        </div>
    );
};
export default ProjectCard;