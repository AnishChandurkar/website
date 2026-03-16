import { useState, type DragEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from '../CSS Files/ProjectBoard.module.css';
import TaskModal from '../ui_elements/TaskModal';
import HistoryModal from '../ui_elements/HistoryModal';
// Types
interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'HIGH' | 'CRITICAL' | 'MEDIUM' | 'LOW';
  date: string;
}
interface ColumnConfig {
  id: string;
  title: string;
  limit: number;
  dotColor: string;
}
const ProjectBoard = () => {
  const { boardId } = useParams();
  const columns: ColumnConfig[] = [
    { id: 'TODO', title: 'To Do', limit: 10, dotColor: '#eab308' },
    { id: 'IN_PROGRESS', title: 'In Progress', limit: 2, dotColor: '#3b82f6' },
    { id: 'REVIEW', title: 'Review', limit: 3, dotColor: '#a855f7' },
    { id: 'DONE', title: 'Done', limit: 100, dotColor: '#22c55e' }
  ];
  const [tasks, setTasks] = useState<Task[]>([
    { id: 'T-1', title: 'Design Homepage', status: 'TODO', priority: 'HIGH', date: 'Oct 24' }
  ]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const handleDragStart = (e: DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  const handleDrop = (e: DragEvent<HTMLDivElement>, targetStatus: Task['status']) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const tasksInTarget = tasks.filter(t => t.status === targetStatus).length;
    const colConfig = columns.find(c => c.id === targetStatus);
    if (colConfig && tasksInTarget >= colConfig.limit) {
      alert(`Cannot move task! ${colConfig.title} has reached its limit of ${colConfig.limit} tasks.`);
      return;
    }
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId ? { ...task, status: targetStatus } : task
      )
    );
  };
  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'HIGH': return styles.priorityHigh;
      case 'CRITICAL': return styles.priorityCritical;
      case 'MEDIUM': return styles.priorityMedium;
      case 'LOW': return styles.priorityLow;
      default: return '';
    }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f4f4f9' }}>
      <div style={{
        padding: '15px 24px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #cccccc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to={`/project/${boardId || '1'}`} style={{ color: '#007bff', textDecoration: 'none', fontSize: '0.9rem' }}>
            ← Back to Project
          </Link>
          <div>
            <h2 style={{ margin: 0, color: '#000000', fontSize: '1.3rem' }}>Development Board</h2>
            <p style={{ margin: '2px 0 0 0', color: '#666666', fontSize: '0.8rem' }}>Manage tasks for the current sprint.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{
            padding: '8px 16px',
            backgroundColor: '#ffffff',
            border: '1px solid #cccccc',
            borderRadius: '4px',
            color: '#666666',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            🔍 Search tasks...
          </div>
          <button
            onClick={() => setShowHistory(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#eeeeee',
              color: '#333333',
              border: '1px solid #cccccc',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 'bold'
            }}
          >
            History Table
          </button>
        </div>
      </div>
      <div className={styles.boardContainer}>
        {columns.map((col) => {
          const columnTasks = tasks.filter(task => task.status === col.id);
          return (
            <div
              key={col.id}
              className={styles.column}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id as Task['status'])}
            >
              <div className={styles.columnHeader}>
                <span>
                  <span className={styles.columnDot} style={{ backgroundColor: col.dotColor }}></span>
                  {col.title}
                </span>
                <span className={styles.limitBadge}>
                  {columnTasks.length} / {col.limit}
                </span>
              </div>
              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  className={styles.taskCard}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <span className={`${styles.priorityBadge} ${getPriorityClass(task.priority)}`}>
                    {task.priority}
                  </span>
                  <p>{task.title}</p>
                  <div className={styles.taskCardFooter}>
                    <span>{task.date}</span>
                    <div className={styles.taskAvatar}>
                      {task.id.charAt(2)}
                    </div>
                  </div>
                </div>
              ))}
              <button className={styles.addTaskBtn}>+ Add Task</button>
            </div>
          );
        })}
      </div>
      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
      {showHistory && (
        <HistoryModal onClose={() => setShowHistory(false)} />
      )}
    </div>
  );
};
export default ProjectBoard;