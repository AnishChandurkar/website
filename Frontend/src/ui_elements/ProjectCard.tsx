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
    isStarred: boolean;
    onArchive?: (id: number) => void;
    onDelete?: (id: number) => void;
    onEdit?: (id: number) => void;
    onStarToggle?: (id: number, isStarred: boolean) => void;
    onViewDetails?: (id: number) => void;
}
const ProjectCard = ({
    id,
    name,
    status,
    timeAgo,
    progressPercentage,
    avatars,
    additionalAvatars,
    isStarred,
    onArchive,
    onDelete,
    onEdit,
    onStarToggle,
    onViewDetails
}: ProjectCardProps) => {
    
    const [menuOpen, setMenuOpen] = useState(false);
    // set dynamic class based on status
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
                    <span 
                        className={`star-icon ${isStarred ? 'starred' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onStarToggle && onStarToggle(id, !isStarred);
                        }}
                        style={{ cursor: 'pointer', color: isStarred ? '#ffc107' : '#cccccc' }}
                    >
                        {isStarred ? '★' : '☆'}
                    </span>
                    
                    <div className="menu-container">
                        <span
                            className="menu-dots"
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            ⋮
                        </span>
                        {menuOpen && (
                            <div className="dropdown-menu">
                                {onEdit && (
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            onEdit(id);
                                            setMenuOpen(false);
                                        }}
                                    >
                                        <span className="dropdown-icon">✏️</span>
                                        Edit Details
                                    </button>
                                )}
                                {onArchive && (
                                    <button
                                        className="dropdown-item"
                                        onClick={() => {
                                            onArchive(id);
                                            setMenuOpen(false);
                                        }}
                                    >
                                        <span className="dropdown-icon">📦</span>
                                        Change Archive Status
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
                <div className="progress-bar-container" style={{ width: '100%', height: '8px', backgroundColor: '#eeeeee', borderRadius: '4px', marginTop: '5px' }}>
                    <div 
                        className="progress-bar-inner" 
                        style={{ width: `${progressPercentage}%`, height: '100%', backgroundColor: '#28a745', borderRadius: '4px', transition: 'width 0.3s ease' }}
                    ></div>
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
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewDetails && onViewDetails(id);
                  }} 
                  className="view-details" 
                  style={{ background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', textDecoration: 'underline' }}
                >
                    View Details
                </button>
            </div>
        </div>
    );
};
export default ProjectCard;