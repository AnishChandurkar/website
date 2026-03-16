import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../ui_elements/SideBar';
import '../CSS Files/DashBoard.css';
import ProjectCard from '../ui_elements/ProjectCard';
interface ProjectData {
  id: number;
  name: string;
  status: 'In Progress' | 'Completed' | 'Planning' | 'On Hold' | 'Review';
  timeAgo: string;
  progressPercentage: number;
  avatars: string[];
  additionalAvatars: number;
}
const initialProjects: ProjectData[] = [
  {
    id: 1,
    name: 'Task Management App',
    status: 'In Progress',
    timeAgo: '2h ago',
    progressPercentage: 65,
    avatars: ['U1', 'U2', 'U3'],
    additionalAvatars: 2
  },
];
const Dashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectData[]>(initialProjects);
  const handleArchive = (id: number) => {
    const updatedProjects = projects.filter(project => project.id !== id);
    setProjects(updatedProjects);
  };
  const handleDelete = (id: number) => {
    const updatedProjects = projects.filter(project => project.id !== id);
    setProjects(updatedProjects);
  };
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        
        <div className="header-section">
          <div className="title-area">
            <h1 style={{ color: '#000000', margin: '0 0 5px 0' }}>Projects</h1>
            <p style={{ color: '#666666', margin: 0 }}>Overview of all our workspaces</p>
          </div>
          <div className="action-area">
            <button style={{ padding: '10px 15px', backgroundColor: '#007bff', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              New Project
            </button>
          </div>
        </div>
        <div className="projects-grid">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/project/${project.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <ProjectCard
                id={project.id}
                name={project.name}
                status={project.status}
                timeAgo={project.timeAgo}
                progressPercentage={project.progressPercentage}
                avatars={project.avatars}
                additionalAvatars={project.additionalAvatars}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
        {projects.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666666' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>No active projects</p>
            <p>All projects have been archived or deleted.</p>
          </div>
        )}
        <div className="header-section" style={{ marginTop: '30px' }}>
          <div className="title-area">
            <h2 style={{ color: '#000000', margin: '0 0 5px 0' }}>Starred Projects</h2>
            <p style={{ color: '#666666', margin: 0 }}>Favorite workspaces</p>
          </div>
        </div>
        <div className="projects-grid">
          <div style={{ color: '#666666', fontStyle: 'italic' }}>
            Starred projects idhar ayenge post backend.
          </div>
        </div>
        
      </div>
    </div>
  );
};
export default Dashboard;