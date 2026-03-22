import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import styles from '../CSS Files/Stories.module.css';
import { fetchTasks, createTask, updateTask, deleteTask } from '../services/api';

interface Story {
  id: number;
  title: string;
  description: string;
  column_name?: string;
}

interface ChildTask {
  id: number;
  parent_id: number | null;
  title: string;
  type: string;
  column_name?: string;
}

interface TaskItem {
  id: number;
  title: string;
  type: string;
  parent_id: number | null;
  column_name?: string;
  description?: string;
}

const Stories = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const [stories, setStories] = useState<Story[]>([]);
  const [childTasks, setChildTasks] = useState<ChildTask[]>([]);
  const [availableBoardTasks, setAvailableBoardTasks] = useState<ChildTask[]>([]);

  const [showAddStoryModal, setShowAddStoryModal] = useState(false);
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newStoryDesc, setNewStoryDesc] = useState('');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState('');

  const loadData = async () => {
    try {
      if (boardId) {
        // load board tasks and stories
        const fetchedTasks = await fetchTasks(Number(boardId)) as TaskItem[];
        const allStories = fetchedTasks.filter((t: TaskItem) => t.type === 'Story').map((t: TaskItem) => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          column_name: t.column_name
        } as Story));
        const allChildTasks = fetchedTasks.filter((t: TaskItem) => t.type !== 'Story' && t.parent_id !== null).map((t: TaskItem) => ({
          id: t.id,
          parent_id: t.parent_id,
          title: t.title,
          type: t.type,
          column_name: t.column_name
        } as ChildTask));
        const allAvailableTasks = fetchedTasks.filter((t: TaskItem) => t.type !== 'Story' && t.parent_id === null).map((t: TaskItem) => ({
          id: t.id,
          parent_id: t.parent_id,
          title: t.title,
          type: t.type,
          column_name: t.column_name
        } as ChildTask));

        setStories(allStories);
        setChildTasks(allChildTasks);
        setAvailableBoardTasks(allAvailableTasks);

        if (selectedStory) {
          const updated = allStories.find((s) => s.id === selectedStory.id);
          if (updated) setSelectedStory(updated);
        }
      }
    } catch (error) {
      console.error("Failed to fetch stories and tasks", error);
    }
  };

  useEffect(() => {
    loadData();
  }, [boardId]);

  const handleAddStory = async () => {
    if (!newStoryTitle.trim()) return;
    try {
      if (boardId) {
        // create a new story on board
        await createTask(Number(boardId), newStoryTitle, null, 'MEDIUM', 'Story', newStoryDesc, null, null, null);
        setShowAddStoryModal(false);
        setNewStoryTitle('');
        setNewStoryDesc('');
        loadData();
      }
    } catch (err: any) {
      alert(err.message || "Failed to create story");
    }
  };

  const handleAddTaskToStory = async () => {
    if (!selectedTaskId || !selectedStory) return;
    try {
      // link a task to a story
      await updateTask(Number(selectedTaskId), { parent_id: selectedStory.id });
      setSelectedTaskId('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add task to story');
    }
  };

  const handleRemoveTask = async (taskId: number) => {
    if (window.confirm('Remove this task from the story?')) {
      try {
        // unlink task from story
        await updateTask(taskId, { parent_id: null });
        loadData();
      } catch (err: any) {
        alert(err.message || "Failed to remove task from story");
      }
    }
  };

  const handleDeleteStory = async (storyId: number) => {
    if (window.confirm('Delete this story? This will also delete all tasks currently within this story!')) {
      try {
        await deleteTask(storyId);
        if (selectedStory?.id === storyId) {
          setSelectedStory(null);
        }
        setStories(prev => prev.filter(s => s.id !== storyId));
        loadData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete story');
      }
    }
  };


  return (
    <div className={styles.pageContainer}>
      <header className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Link to={`/board/${boardId}`} className={styles.backLink}>← Back to Board</Link>
          <h2 className={styles.boardTitle}>Story Management</h2>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* Action buttons removed */}
        </div>
      </header>

      <div className={styles.contentArea}>
        <div className={styles.boardSidebar}>
          <button
            className={`${styles.sidebarBtn} ${isActive(`/board/${boardId}/allowed-workflows`) ? styles.active : ''}`}
            onClick={() => navigate(`/board/${boardId}/allowed-workflows`)}>
            Allowed Workflows
          </button>
          <button
            className={`${styles.sidebarBtn} ${isActive(`/board/${boardId}/stories`) ? styles.active : ''}`}
            onClick={() => navigate(`/board/${boardId}/stories`)}>
            Stories
          </button>
          <button
            className={`${styles.sidebarBtn} ${isActive(`/board/${boardId}/audit-history`) ? styles.active : ''}`}
            onClick={() => navigate(`/board/${boardId}/audit-history`)}>
            Audit History
          </button>
        </div>

        <div className={styles.mainWorkArea}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button
              className={styles.addBtn}
              onClick={() => setShowAddStoryModal(true)}
            >
              + Add Story
            </button>
          </div>
          <div className={styles.storiesGrid}>
            {stories.map(story => {
              const storyTasks = childTasks.filter(t => t.parent_id === story.id);
              return (
                <div
                  key={story.id}
                  className={styles.storyCard}
                  onClick={() => setSelectedStory(story)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 className={styles.storyTitle}>{story.title}</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className={styles.statusBadgeGlobal}>
                        {story.column_name || 'Unplaced'}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteStory(story.id); }}
                        style={{ padding: '0px 6px', backgroundColor: 'transparent', border: 'none', color: '#cc0000', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold' }}
                        title="Delete Story"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <p className={styles.storyMeta}>
                    {storyTasks.length} items present
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {showAddStoryModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ width: '400px' }}>
            <h3 className={styles.modalTitle}>Create New Story</h3>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Story Title</label>
              <input
                type="text"
                className={styles.textInput}
                value={newStoryTitle}
                onChange={(e) => setNewStoryTitle(e.target.value)}
                autoFocus
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Description</label>
              <textarea
                className={styles.textInput}
                value={newStoryDesc}
                onChange={(e) => setNewStoryDesc(e.target.value)}
                rows={3}
              />
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowAddStoryModal(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleAddStory}>Save Story</button>
            </div>
          </div>
        </div>
      )}

      {selectedStory && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ width: '600px', maxWidth: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
              <div>
                <h3 className={styles.modalTitle} style={{ margin: 0 }}>{selectedStory.title}</h3>
                <div style={{ marginTop: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>Current Story Status: </span>
                  <span className={styles.statusBadgeDetail}>{selectedStory.column_name || 'Unplaced'}</span>
                </div>
              </div>
              <button className={styles.cancelBtn} style={{ padding: '4px 12px' }} onClick={() => setSelectedStory(null)}>Close</button>
            </div>

            <div className={styles.taskList}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#333' }}>Current Tasks </h4>
              {childTasks.filter(t => t.parent_id === selectedStory.id).length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '20px 0' }}>No tasks present in this story.</p>
              ) : (
                childTasks
                  .filter(t => t.parent_id === selectedStory.id)
                  .map(task => (
                    <div key={task.id} className={styles.taskItem}>
                      <div className={styles.taskInfo}>
                        <span className={`${styles.typeBadge} ${task.type === 'Task' ? styles.typeTask : styles.typeBug}`}>
                          {task.type}
                        </span>
                        <span style={{ color: '#333', fontSize: '0.9rem', fontWeight: 500 }}>{task.title}</span>
                        {task.column_name ? (
                          <span className={styles.taskStatusTag}>
                            {task.column_name}
                          </span>
                        ) : (
                          <span className={styles.taskStatusTagEmpty}>No Status</span>
                        )}
                      </div>
                      <button className={styles.removeBtn} onClick={() => handleRemoveTask(task.id)}>Remove</button>
                    </div>
                  ))
              )}
            </div>

            <div className={styles.addTaskRow}>
              <label className={styles.formLabel} style={{ marginBottom: 0, alignSelf: 'center' }}>Choose Task:</label>
              <select
                className={styles.textInput}
                style={{ flex: 1 }}
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
              >
                <option value="">Select an available task...</option>
                {availableBoardTasks.map(task => (
                  <option key={task.id} value={task.id}>
                    [{task.type}] {task.title} — {task.column_name || 'Unplaced'}
                  </option>
                ))}
              </select>
              <button className={styles.saveBtn} onClick={handleAddTaskToStory}>Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stories;