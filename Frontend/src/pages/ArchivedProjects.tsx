import { useState, useEffect } from 'react';
import Sidebar from '../ui_elements/SideBar';
import '../CSS Files/DashBoard.css';
import ProjectCard from '../ui_elements/ProjectCard';
import { restoreProject, deleteProject } from '../services/api';

const BASE_URL = 'http://localhost:5000/api';

interface ArchivedProject {
  id: number;
  name: string;
  description: string;
  status: 'In Progress' | 'Completed' | 'Planning' | 'On Hold' | 'Review';
  progress: number;
  created_at: string;
}

const ArchivedProjects = () => {
  const [archived, setArchived] = useState<ArchivedProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadArchived = async () => {
      try {
        const response = await fetch(`${BASE_URL}/projects/archived`, {
          credentials: 'include'
        });
        const data = await response.json();
        setArchived(data);
      } catch {
        setArchived([]);
      }
      setLoading(false);
    };
    loadArchived();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleRestore = async (id: number) => {
    try {
      await restoreProject(id);
      setArchived(archived.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to restore');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Permanently delete this project?')) {
      try {
        await deleteProject(id);
        setArchived(archived.filter(p => p.id !== id));
      } catch (err: any) {
        alert(err.message || 'Failed to delete');
      }
    }
  };

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div>Loading archived projects...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <div className="header-section">
          <div className="title-area">
            <h1 style={{ color: '#000000', margin: '0 0 5px 0' }}>Archived Projects</h1>
            <p style={{ color: '#666666', margin: 0 }}>Projects that have been archived</p>
          </div>
        </div>
        {archived.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666666' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>No archived projects</p>
            <p>Projects you archive from the dashboard will appear here.</p>
          </div>
        ) : (
          <div className="projects-grid">
            {archived.map((project) => (
              <div key={project.id}>
                <ProjectCard
                  id={project.id}
                  name={project.name}
                  status={project.status}
                  timeAgo={formatTimeAgo(project.created_at)}
                  progressPercentage={project.progress || 0}
                  avatars={['U1']}
                  additionalAvatars={0}
                  isStarred={false}
                  onArchive={handleRestore}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default ArchivedProjects;