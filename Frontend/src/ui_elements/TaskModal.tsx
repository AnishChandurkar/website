import { useState, useEffect } from 'react';
import styles from '../CSS Files/TaskModal.module.css';
interface TaskDetails {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assignee: string;
  reporter: string;
  dueDate: string;
  comments: { id: number; user: string; text: string; date: string }[];
}
interface TaskModalProps {
  taskId: string;
  onClose: () => void;
}
const TaskModal = ({ taskId, onClose }: TaskModalProps) => {
  const [task, setTask] = useState<TaskDetails | null>(null);
  useEffect(() => {
    const mockDetails: TaskDetails = {
      id: taskId,
      title: "kam karo kam",
      description: "desci",
      status: 'TODO',
      priority: 'High',
      assignee: "John Smith",
      reporter: "Keshav",
      dueDate: "202worjnvwoiv",
      comments: [
        { id: 1, user: "Sarah Connor", text: "I think this is related to the flexbox settings.", date: "2026-03-01" }
      ]
    };
    setTask(mockDetails);
  }, [taskId]);
  if (!task) return null;
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        
        <div className={styles.header}>
          <h2 style={{ margin: 0, color: '#000000' }}>{task.id}: {task.title}</h2>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>
        <div className={styles.body}>
          <div className={styles.mainContent}>
            <div className={styles.section}>
              <h3 className={styles.label}>Description</h3>
              <p style={{ color: '#000000' }}>{task.description}</p>
            </div>
            <div className={styles.section}>
              <h3 className={styles.label}>Activity / Comments</h3>
              {task.comments.map(comment => (
                <div key={comment.id} className={styles.comment}>
                  <div className={styles.commentHeader}>
                    <strong>{comment.user}</strong> - {comment.date}
                  </div>
                  <div style={{ color: '#000000' }}>{comment.text}</div>
                </div>
              ))}
              <textarea placeholder="Write a comment..." style={{ width: '100%', height: '60px', marginTop: '10px', padding: '8px', boxSizing: 'border-box', border: '1px solid #cccccc', borderRadius: '4px' }} />
              <button style={{ marginTop: '10px', padding: '8px 15px', backgroundColor: '#007bff', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Save</button>
            </div>
          </div>
          <div className={styles.sidebar}>
            <div className={styles.section}>
              <span className={styles.label}>Status</span>
              <span className={`${styles.badge} ${styles[task.status.toLowerCase().replace('_', '')]}`}>
                {task.status.replace('_', ' ')}
              </span>
            </div>
            <div className={styles.section}>
              <span className={styles.label}>Priority</span>
              <span style={{ fontWeight: 'bold', color: task.priority === 'Critical' ? '#cc0000' : '#000000' }}>
                {task.priority}
              </span>
            </div>
            <div className={styles.section}>
              <span className={styles.label}>Assignee</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#000000' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#007bff', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem' }}>
                  {task.assignee.charAt(0)}
                </div>
                {task.assignee}
              </div>
            </div>
            <div className={styles.section}>
              <span className={styles.label}>Reporter</span>
              <div style={{ color: '#000000' }}>{task.reporter}</div>
            </div>
            <div className={styles.section}>
              <span className={styles.label}>Due Date</span>
              <div style={{ color: '#000000' }}>{task.dueDate}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TaskModal;