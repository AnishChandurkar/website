import { useState, useReducer, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Sidebar from '../ui_elements/SideBar';
import styles from '../CSS Files/ProjectDetails.module.css';
import AddBoardModal from '../ui_elements/AddBoardModal';
import InviteMemberModal from '../ui_elements/InviteMemberModal';
import { 
  fetchProjectById, createBoard, inviteMember, updateMemberRole
} from '../services/api';
import type { ProjectFull } from '../services/api';
import { useAuth } from '../context/AuthContext';


const ProjectDetails = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState<ProjectFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // manage which modal is visible
  interface ViewStates {
    addBoard: boolean;
    invite: boolean;
  }
  
  type PopupActions = { type: 'SWITCH_BOARD'; payload: boolean } | { type: 'SWITCH_INVITE'; payload: boolean };

  function viewReducer(state: ViewStates, action: PopupActions): ViewStates {
    switch (action.type) {
      case 'SWITCH_BOARD': return { ...state, addBoard: action.payload };
      case 'SWITCH_INVITE': return { ...state, invite: action.payload };
      default: return state;
    }
  }

  const [popups, setPopup] = useReducer(viewReducer, { addBoard: false, invite: false });
  const { addBoard: showAddBoard, invite: showInvite } = popups;


  const fetchProjectData = async () => {
    try {
      const resp = await fetchProjectById(Number(projectId));
      setProject(resp);
    } catch (e: any) {
      setError(e.message || 'error loading project');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [projectId]);

  const handleAddBoard = async (boardName: string) => {
    try {
      // create new board in project
      await createBoard(Number(projectId), boardName);
      await fetchProjectData();
      setPopup({ type: 'SWITCH_BOARD', payload: false });
    } catch (err: any) {
      alert(err.message || 'Failed to create board');
    }
  };

  const handleInvite = async (email: string, role: string) => {
    try {
      // invite member to project
      await inviteMember(Number(projectId), email, role);
      await fetchProjectData();
      setPopup({ type: 'SWITCH_INVITE', payload: false });
    } catch (err: any) {
      alert(err.message || 'Failed to invite member');
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await updateMemberRole(Number(projectId), userId, newRole);
      setProject((prev: ProjectFull | null) => {
        if (!prev) return prev;
        return {
          ...prev,
          members: prev.members.map((m) => m.id === userId ? { ...m, role: newRole } : m)
        };
      });
    } catch (err: any) {
      alert(err.message || 'Failed to update member role');
    }
  };

  const formatDate = (dateString: string) => {
    // format creation date
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTimeAgo = (dateString: string) => {
    // calculate time since update
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
      <div className={styles.layout}>
        <Sidebar />
        <div className={styles.container}>
          <p>Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className={styles.layout}>
        <Sidebar />
        <div className={styles.container}>
          <p style={{ color: '#dc3545' }}>{error || 'Project not found'}</p>
          <Link to="/dashboard">← Back to Projects</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.container}>
        <div className={styles.topBar}>
          <Link to="/dashboard" className={styles.backLink}>
            ← Back to Projects
          </Link>
        </div>

        <div className={styles.header}>
          <div className={styles.titleSection}>
            <h1>{project.name}</h1>
            <p className={styles.description}>
              {project.description || 'No description'}
            </p>
            <div className={styles.metaRow}>
              <span className={styles.statusBadge}>{project.status}</span>
              <span className={styles.metaText}>Created {formatDate(project.created_at)}</span>
              <span className={styles.metaText}>Updated {formatTimeAgo(project.updated_at)}</span>
            </div>
          </div>
          <div className={styles.actionButtons}>
            <button
              className={styles.inviteBtn}
              onClick={() => setPopup({ type: 'SWITCH_INVITE', payload: true })}
            >
              + Invite People
            </button>
            <button
              className={styles.newBoardBtn}
              onClick={() => setPopup({ type: 'SWITCH_BOARD', payload: true })}
            >
              + New Board
            </button>
          </div>
        </div>

        <div className={styles.membersSection}>
          <h3>Team ({project.members.length})</h3>
          <div className={styles.membersList}>
            {project.members.map((member) => {
              const isGlobalAdmin = user?.global_role === 'Global Admin';
              const isProjectAdmin = isGlobalAdmin || project.members.find(m => m.id === user?.id)?.role === 'Project Admin';

              const isSelf = member.id === user?.id;
              const isTargetGlobalAdmin = member.global_role === 'Global Admin';
              const isTargetProjectAdmin = member.role === 'Project Admin';

              // ui permission checks
              // project admins can see the edit dropdown
              // cannot edit self
              // cannot edit a global admin
              // project admins cannot demote other project admins (only global admins can)
              const canEditRole =
                isProjectAdmin &&
                !isSelf &&
                !isTargetGlobalAdmin &&
                (!isTargetProjectAdmin || isGlobalAdmin);

              return (
                <div key={member.id} className={styles.memberChip}>
                  <div className={styles.memberAvatar}>
                    {member.first_name.charAt(0)}{member.surname.charAt(0)}
                  </div>
                  <div>
                    <span className={styles.memberName}>
                      {member.first_name} {member.surname}
                    </span>
                    {canEditRole ? (
                      <select
                        value={member.role}
                        onChange={(e) => handleRoleChange(member.id, e.target.value)}
                        style={{ display: 'block', marginTop: '4px', fontSize: '0.85rem', padding: '2px 4px', borderRadius: '4px', border: '1px solid #ccc', outline: 'none' }}
                      >
                        <option value="Project Admin">Project Admin</option>
                        <option value="Project Member">Project Member</option>
                        <option value="Project Viewer">Project Viewer</option>
                      </select>
                    ) : (
                      <span className={styles.memberRole}>{member.role}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <h3 style={{ marginBottom: '15px', color: '#1a1a1a' }}>
          Boards ({project.boards.length})
        </h3>
        <div className={styles.grid}>
          <div
            className={`${styles.card} ${styles.createCard}`}
            onClick={() => setPopup({ type: 'SWITCH_BOARD', payload: true })}
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
                  <span>{board.task_count} Tasks</span>
                  <span>{formatTimeAgo(board.created_at)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {showAddBoard && (
          <AddBoardModal
            onClose={() => setPopup({ type: 'SWITCH_BOARD', payload: false })}
            onSave={handleAddBoard}
          />
        )}
        {showInvite && (
          <InviteMemberModal
            onClose={() => setPopup({ type: 'SWITCH_INVITE', payload: false })}
            onInvite={handleInvite}
          />
        )}
      </div>
    </div>
  );
};
export default ProjectDetails;