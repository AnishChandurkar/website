import { useReducer, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../ui_elements/SideBar';
import '../CSS Files/DashBoard.css';
import ProjectCard from '../ui_elements/ProjectCard';
import { fetchProjects, archiveProject, deleteProject, createProject, toggleStarProject, updateProject } from '../services/api';
import NewProjectModal from '../ui_elements/NewProjectModal';
import { useAuth } from '../context/AuthContext';

interface ProjectData {
  id: number;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
}

// state for all dashboard data
interface DashboardState {
  projects: ProjectData[];
  loading: boolean;
  error: string | null;
  showModal: boolean;
  editingProject: ProjectData | null;
}

// actions that can change the state
type DashboardAction =
  | { type: 'SET_PROJECTS'; projects: ProjectData[] }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'SHOW_MODAL'; show: boolean }
  | { type: 'SET_EDITING'; project: ProjectData | null };

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_PROJECTS':
      return { ...state, projects: action.projects, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false };
    case 'SHOW_MODAL':
      return { ...state, showModal: action.show };
    case 'SET_EDITING':
      return { ...state, editingProject: action.project };
    default:
      return state;
  }
}

const initialState: DashboardState = {
  projects: [],
  loading: true,
  error: null,
  showModal: false,
  editingProject: null,
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const { projects, loading, error, showModal, editingProject } = state;

  useEffect(() => {
    // fetch all projects from api on load
    const getProjects = async () => {
      try {
        const data = await fetchProjects();
        dispatch({ type: 'SET_PROJECTS', projects: data });
      } catch (err) {
        dispatch({ type: 'SET_ERROR', error: (err as Error).message || 'Failed to fetch projects' });
      }
    };
    getProjects();
  }, []);

  const handleArchive = async (id: number) => {
    try {
      // archive selected project
      await archiveProject(id);
      dispatch({ type: 'SET_PROJECTS', projects: projects.filter(p => p.id !== id) });
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleDelete = async (id: number) => {
    // confirm with user before delete
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(id);
        dispatch({ type: 'SET_PROJECTS', projects: projects.filter(p => p.id !== id) });
      } catch (err) {
        alert((err as Error).message);
      }
    }
  };

  const handleStarToggle = async (id: number, isStarred: boolean) => {
    try {
      await toggleStarProject(id, isStarred);
      dispatch({ type: 'SET_PROJECTS', projects: projects.map(p => p.id === id ? { ...p, is_starred: isStarred } : p) });
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleViewDetails = (id: number) => {
    navigate(`/project/${id}`);
  };

  const handleUpdateProject = async (id: number, name: string, description: string, status: string, progress: number) => {
    try {
      dispatch({ type: 'SET_LOADING', loading: true });
      await updateProject(id, name, description, status, progress);
      const updatedProjects = await fetchProjects();
      dispatch({ type: 'SET_PROJECTS', projects: updatedProjects });
      dispatch({ type: 'SET_EDITING', project: null });
    } catch (err) {
      alert((err as Error).message || "Something went wrong while updating project.");
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  };

  const handleEdit = (id: number) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      dispatch({ type: 'SET_EDITING', project: project });
    }
  };

  const handleCreateProject = async (name: string, description: string, status: string) => {
    try {
      dispatch({ type: 'SET_LOADING', loading: true });
      // create new project and refresh list
      await createProject(name, description, status);
      const updatedProjects = await fetchProjects();
      dispatch({ type: 'SET_PROJECTS', projects: updatedProjects });
      dispatch({ type: 'SHOW_MODAL', show: false });
    } catch (err) {
      alert((err as Error).message || "Something went wrong while creating project.");
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  };

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

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="main-content" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <div className="spinner">Loading projects...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="main-content" style={{ padding: '40px', textAlign: 'center' }}>
          <h2 style={{ color: '#dc3545' }}>Error</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', marginTop: '20px' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // filter projects by star status
  const starredProjects = projects.filter(p => p.is_starred);
  const otherProjects = projects.filter(p => !p.is_starred);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        
        {starredProjects.length > 0 && (
          <>
            <div className="header-section">
              <div className="title-area">
                <h1 style={{ color: '#000000', margin: '0 0 5px 0' }}>Starred Projects</h1>
                <p style={{ color: '#666666', margin: 0 }}>Your favorite workspaces</p>
              </div>
            </div>
            <div className="projects-grid" style={{ marginBottom: '40px' }}>
              {starredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  status={project.status}
                  isStarred={project.is_starred}
                  timeAgo={formatTimeAgo(project.created_at)}
                  progressPercentage={project.progress || 0}
                  avatars={['U1']} // Placeholder for now
                  additionalAvatars={0}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onStarToggle={handleStarToggle}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          </>
        )}

        <div className="header-section">
          <div className="title-area">
            <h1 style={{ color: '#000000', margin: '0 0 5px 0' }}>{starredProjects.length > 0 ? 'All Projects' : 'Projects'}</h1>
            <p style={{ color: '#666666', margin: 0 }}>Overview of all our workspaces</p>
          </div>
          <div className="action-area">
            {user?.emailid === 'admin@workspace.com' && (
              <button 
                onClick={() => dispatch({ type: 'SHOW_MODAL', show: true })}
                style={{ padding: '10px 15px', backgroundColor: '#007bff', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>
                New Project
              </button>
            )}
          </div>
        </div>
        <div className="projects-grid">
          {otherProjects.map((project) => (
            <ProjectCard
              key={project.id}
              id={project.id}
              name={project.name}
              status={project.status}
              isStarred={project.is_starred}
              timeAgo={formatTimeAgo(project.created_at)}
              progressPercentage={project.progress || 0}
              avatars={['U1']} // Placeholder for now
              additionalAvatars={0}
              onArchive={handleArchive}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onStarToggle={handleStarToggle}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
        {projects.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666666' }}>
            <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>No active projects</p>
            {user?.emailid === 'admin@workspace.com' && (
              <p>Ready to start something new? Create a project above!</p>
            )}
          </div>
        )}
        
      </div>
      {showModal && (
        <NewProjectModal 
          onClose={() => dispatch({ type: 'SHOW_MODAL', show: false })}
          onSave={handleCreateProject}
        />
      )}
      {editingProject && (
        <NewProjectModal 
          onClose={() => dispatch({ type: 'SET_EDITING', project: null })}
          onUpdate={handleUpdateProject}
          initialData={editingProject}
        />
      )}
    </div>
  );
};
export default Dashboard;
