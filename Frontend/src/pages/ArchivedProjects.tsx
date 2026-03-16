import { useState } from 'react';
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
const initialArchived: ProjectData[] = [
  {
    id: 101,
    name: 'Old Website Redesign',
    status: 'Completed',
    timeAgo: '6m ago',
    progressPercentage: 100,
    avatars: ['U1', 'U2'],
    additionalAvatars: 0
  },
];
const ArchivedProjects = () => {
  const [archived, setArchived] = useState<ProjectData[]>(initialArchived);
  const handleRestore = (id: number) => {
    const updated = archived.filter(project => project.id !== id);
    setArchived(updated);
  };
  const handleDelete = (id: number) => {
    const updated = archived.filter(project => project.id !== id);
    setArchived(updated);
  };
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
                  timeAgo={project.timeAgo}
                  progressPercentage={project.progressPercentage}
                  avatars={project.avatars}
                  additionalAvatars={project.additionalAvatars}
                  
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