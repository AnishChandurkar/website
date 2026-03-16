import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from '../CSS Files/ProjectDetails.module.css'; 
import AddBoardModal from '../ui_elements/AddBoardModal';
import InviteMemberModal from '../ui_elements/InviteMemberModal';
interface Board {
  id: number;
  name: string;
  taskCount: number;
  updatedAt: string;
  color: string;
}
interface Project {
  id: number;
  name: string;
  description: string;
  boards: Board[];
  members: string[];
}
const ProjectDetails = () => {
  const { projectId } = useParams();
  
  const [project, setProject] = useState<Project | null>(null);
  const [showAddBoard, setShowAddBoard] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  useEffect(() => {
    setProject({
      id: Number(projectId),
      name: "Task Management App",
      description: `Managing boards for Project #${projectId}`,
      boards: [
        { id: 101, name: "Frontend Tasks", taskCount: 12, updatedAt: "Updated 2h ago", color: "#007bff" }
      ],
      members: ["Keshav (Admin)", "John Smith"]
    });
  }, [projectId]);
  const handleAddBoard = (boardName: string) => {
    if (!project) return;
    
    const newBoard: Board = {
      id: Date.now(),
      name: boardName,
      taskCount: 0,
      updatedAt: "Just now",
      color: "#28a745"
    };
    
    setProject({ 
      ...project, 
      boards: [...project.boards, newBoard] 
    });
  };
  const handleInvite = (email: string) => {
    if (!project) return;
    
    setProject({ 
      ...project, 
      members: [...project.members, email] 
    });
    alert(`Invitation sent to ${email}`);
  };
  if (!project) {
    return <div style={{ color: '#333333', padding: '20px' }}>Loading...</div>;
  }
  return (
    <div className={styles.container}>
      
      <div className={styles.topBar}>
        <Link to="/dashboard" className={styles.backLink}>
          ← Back to Projects
        </Link>
      </div>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 style={{ color: '#000000' }}>{project.name}</h1>
          <p style={{ color: '#666666' }}>{project.description}</p>
        </div>
        
        <div className={styles.actionButtons}>
          <button 
            className={styles.inviteBtn}
            onClick={() => setShowInvite(true)}
          >
            + Invite People
          </button>
          <button 
            className={styles.newBoardBtn}
            onClick={() => setShowAddBoard(true)}
          >
            + New Board
          </button>
        </div>
      </div>
      <div className={styles.grid}>
        
        <div 
          className={`${styles.card} ${styles.createCard}`}
          onClick={() => setShowAddBoard(true)}
        >
          <div className={styles.plusIcon}>+</div>
          <span>Create New Board</span>
        </div>
        {project.boards.map((board) => (
          <Link 
            key={board.id} 
            to={`/board/${board.id}`} 
            className={`${styles.card} ${styles.boardCard}`}
          >
            <div>
              <div className={styles.cardIcon}>
                <span style={{ fontSize: '1.2rem', color: board.color }}>◫</span>
              </div>
              <h3 className={styles.cardTitle}>{board.name}</h3>
            </div>
            <div>
              <div className={styles.cardDivider}></div>
              <div className={styles.cardFooter}>
                <span>{board.taskCount} Tasks</span>
                <span>{board.updatedAt}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {showAddBoard && (
        <AddBoardModal 
          onClose={() => setShowAddBoard(false)} 
          onSave={handleAddBoard} 
        />
      )}
      {showInvite && (
        <InviteMemberModal 
          onClose={() => setShowInvite(false)} 
          onInvite={handleInvite} 
        />
      )}
    </div>
  );
};
export default ProjectDetails;