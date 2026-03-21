import { useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import styles from '../CSS Files/Stories.module.css';

interface Story {
  id: number;
  title: string;
  description: string;
}

interface ChildTask {
  id: number;
  parent_id: number;
  title: string;
  type: 'Task' | 'Bug';
}

const Stories = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  
  const [stories, setStories] = useState<Story[]>([
    { id: 101, title: 'User Authentication Epic', description: ''},
  ]);
  const [childTasks, setChildTasks] = useState<ChildTask[]>([
    { id: 1, parent_id: 101, title: 'Build Login UI', type: 'Task' }
  ]);
  const [availableBoardTasks, setAvailableBoardTasks] = useState([
    { id: 1, title: 'Design Database Schema', type: 'Task' }
  ]);
  const [showAddStoryModal, setShowAddStoryModal] = useState(false);
  const [newStoryTitle, setNewStoryTitle] = useState('');
  const [newStoryDesc, setNewStoryDesc] = useState('');
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const handleAddStory = () => {
    if (!newStoryTitle.trim()) return;
    const newStory: Story = {
      id: Date.now(),
      title: newStoryTitle,
      description: newStoryDesc
    };
    setStories([...stories, newStory]);
    setShowAddStoryModal(false);
    setNewStoryTitle('');
    setNewStoryDesc('');
  };
  const handleAddTaskToStory = () => {
    if (!selectedTaskId || !selectedStory) return;
    const taskToAdd = availableBoardTasks.find(t => t.id === Number(selectedTaskId));
    if (!taskToAdd) return;
    const newTask: ChildTask = {
      id: taskToAdd.id,
      parent_id: selectedStory.id,
      title: taskToAdd.title,
      type: taskToAdd.type as 'Task' | 'Bug'
    };
    setChildTasks([...childTasks, newTask]);
    setAvailableBoardTasks(availableBoardTasks.filter(t => t.id !== taskToAdd.id));
    setSelectedTaskId('');
  };
  const handleRemoveTask = (taskId: number) => {
    if (window.confirm('Remove this task from the story?')) {
      const taskToRemove = childTasks.find(t => t.id === taskId);  
      if (taskToRemove) {
        setAvailableBoardTasks([...availableBoardTasks, { 
          id: taskToRemove.id, 
          title: taskToRemove.title, 
          type: taskToRemove.type as 'Task' | 'Bug'
        }]);
      }
      setChildTasks(childTasks.filter(task => task.id !== taskId));
    }
  };
  return (
    <div className={styles.pageContainer}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Link to={`/board/${boardId}`} className={styles.backLink}>← Back to Board</Link>
          <h2 className={styles.boardTitle}>Stories</h2>
        </div>
      </div>
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
          <button 
            className={styles.addBtn}
            onClick={() => setShowAddStoryModal(true)}
          >
            Add Story
          </button>
          <div className={styles.storiesGrid}>
            {stories.map(story => {
              const storyTasks = childTasks.filter(t => t.parent_id === story.id);
              return (
                <div 
                  key={story.id} 
                  className={styles.storyCard}
                  onClick={() => setSelectedStory(story)}
                >
                  <h3 className={styles.storyTitle}>{story.title}</h3>
                  <p className={styles.storyMeta}>
                    {storyTasks.length} items linked
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
                placeholder=""
                autoFocus
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Description</label>
              <textarea 
                className={styles.textInput}
                value={newStoryDesc}
                onChange={(e) => setNewStoryDesc(e.target.value)}
                placeholder=""
                rows={3}
                style={{ resize: 'vertical' }}
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
          <div className={styles.modalContent}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <h3 className={styles.modalTitle} style={{ margin: 0 }}>Story: {selectedStory.title}</h3>
              <button className={styles.cancelBtn} style={{ padding: '4px 8px' }} onClick={() => setSelectedStory(null)}>Close</button>
            </div>
            <div className={styles.taskList}>
              {childTasks.filter(t => t.parent_id === selectedStory.id).length === 0 ? (
                <p style={{ color: '#999999', textAlign: 'center', padding: '20px 0' }}>task wagera nahi aaye.</p>
              ) : (
                childTasks
                  .filter(t => t.parent_id === selectedStory.id)
                  .map(task => (
                    <div key={task.id} className={styles.taskItem}>
                      <div className={styles.taskInfo}>
                        <span className={`${styles.typeBadge} ${task.type === 'Task' ? styles.typeTask : styles.typeBug}`}>
                          {task.type}
                        </span>
                        <span style={{ color: '#333333', fontSize: '0.9rem' }}>{task.title}</span>
                      </div>
                      <button className={styles.removeBtn} onClick={() => handleRemoveTask(task.id)}>Remove</button>
                    </div>
                  ))
              )}
            </div>
            <div className={styles.addTaskRow}>
              <select 
                className={styles.textInput} 
                style={{ flex: 1 }}
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
              >
                <option value="">Select an existing taskyy or bugggy...</option>
                {availableBoardTasks.map(task => (
                  <option key={task.id} value={task.id}>
                    [{task.type}] {task.title}
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