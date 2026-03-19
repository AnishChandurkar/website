import { useState, useEffect, type DragEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from '../CSS Files/ProjectBoard.module.css';
import { fetchColumns, fetchTasks, createTask, moveTask, createColumn, renameColumn, deleteColumn, updateColumnLimit, reorderColumns } from '../services/api';

interface Task {
  id: number;
  title: string;
  column_id: number | null;
  priority: 'HIGH' | 'CRITICAL' | 'MEDIUM' | 'LOW';
  type: string;
  assigned_name: string | null;
  created_at: string;
}

interface Column {
  id: number;
  name: string;
  position: number;
  wip_limit: number | null;
}

const ProjectBoard = () => {
  const { boardId } = useParams();
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOverCol, setDragOverCol] = useState<number | null>(null);
  const [showAddTask, setShowAddTask] = useState<number | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColName, setNewColName] = useState('');
  const [newColLimit, setNewColLimit] = useState('');
  const [editingCol, setEditingCol] = useState<number | null>(null);
  const [editColName, setEditColName] = useState('');
  const [editingLimit, setEditingLimit] = useState<number | null>(null);
  const [editLimitValue, setEditLimitValue] = useState('');

  const loadBoard = async () => {
    try {
      const [colsData, tasksData] = await Promise.all([
        fetchColumns(Number(boardId)),
        fetchTasks(Number(boardId))
      ]);
      setColumns(colsData);
      setTasks(tasksData);
    } catch (err: any) {
      console.error('failed to load board :(', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBoard();
  }, [boardId]);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, taskId: number) => {
    e.dataTransfer.setData('text/plain', String(taskId));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>, colId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colId);
  };

  const handleDragLeave = () => {
    setDragOverCol(null);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetColId: number) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = parseInt(e.dataTransfer.getData('text/plain'));
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.column_id === targetColId) return;

    const prevTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, column_id: targetColId } : t));

    try {
      await moveTask(taskId, targetColId);
    } catch (err: any) {
      setTasks(prevTasks);
      alert(err.message || 'cant move task :(');
    }
  };

  const handleAddTask = async (columnId: number) => {
    if (!newTaskTitle.trim()) return;
    try {
      await createTask(Number(boardId), newTaskTitle, columnId, newTaskPriority);
      setNewTaskTitle('');
      setNewTaskPriority('MEDIUM');
      setShowAddTask(null);
      await loadBoard();
    } catch (err: any) {
      alert(err.message || 'cant create task :(');
    }
  };

  const handleAddColumn = async () => {
    if (!newColName.trim()) return;
    try {
      await createColumn(Number(boardId), newColName, newColLimit ? parseInt(newColLimit) : undefined);
      setNewColName('');
      setNewColLimit('');
      setShowAddColumn(false);
      await loadBoard();
    } catch (err: any) {
      alert(err.message || 'cant add column :(');
    }
  };

  const handleRenameColumn = async (colId: number) => {
    if (!editColName.trim()) return;
    try {
      await renameColumn(colId, editColName);
      setEditingCol(null);
      await loadBoard();
    } catch (err: any) {
      alert(err.message || 'cant rename column :(');
    }
  };

  const handleDeleteColumn = async (colId: number) => {
    if (!window.confirm('delete this column?')) return;
    try {
      await deleteColumn(colId);
      await loadBoard();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateLimit = async (colId: number) => {
    try {
      const limit = editLimitValue.trim() === '' ? null : parseInt(editLimitValue);
      await updateColumnLimit(colId, limit);
      setEditingLimit(null);
      await loadBoard();
    } catch (err: any) {
      alert(err.message || 'cant update limit :(');
    }
  };

  const handleReorderColumn = async (colId: number, direction: 'left' | 'right') => {
    const currentIndex = columns.findIndex(c => c.id === colId);
    if (direction === 'left' && currentIndex === 0) return;
    if (direction === 'right' && currentIndex === columns.length - 1) return;

    const newColumns = [...columns];
    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    [newColumns[currentIndex], newColumns[targetIndex]] = [newColumns[targetIndex], newColumns[currentIndex]];
    
    setColumns(newColumns);
    const newOrder = newColumns.map(c => c.id);
    
    try {
      await reorderColumns(Number(boardId), newOrder);
    } catch (err: any) {
      alert(err.message || 'cant reorder columns :(');
      await loadBoard();
    }
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

  const dotColors: Record<number, string> = {};
  const colorPalette = ['#eab308', '#3b82f6', '#a855f7', '#22c55e', '#ef4444', '#06b6d4', '#f97316'];
  columns.forEach((col, i) => {
    dotColors[col.id] = colorPalette[i % colorPalette.length];
  });

  if (loading) {
    return <div className={styles.loadingContainer}>loading board...</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Link to="/dashboard" className={styles.backLink}>
            ← Back to Projects
          </Link>
          <h2 className={styles.boardTitle}>Board</h2>
        </div>
      </div>

      <div className={styles.boardContainer}>
        {columns.map((col) => {
          const columnTasks = tasks.filter(t => t.column_id === col.id);
          const isOverLimit = col.wip_limit !== null && columnTasks.length >= col.wip_limit;
          const isDragTarget = dragOverCol === col.id;

          return (
            <div
              key={col.id}
              className={`${styles.column} ${isDragTarget ? styles.columnDragOver : ''} ${isOverLimit ? styles.columnFull : ''}`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div className={styles.columnHeader}>
                <div className={styles.columnTitle}>
                  <span className={styles.columnDot} style={{ backgroundColor: dotColors[col.id] }}></span>
                  {editingCol === col.id ? (
                    <input
                      value={editColName}
                      onChange={(e) => setEditColName(e.target.value)}
                      onBlur={() => handleRenameColumn(col.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRenameColumn(col.id)}
                      autoFocus
                      className={styles.inlineInput}
                    />
                  ) : (
                    <span
                      onClick={() => { setEditingCol(col.id); setEditColName(col.name); }}
                      className={styles.clickableTitle}
                      title="click to rename"
                    >
                      {col.name}
                    </span>
                  )}
                </div>
                <div className={styles.columnActions}>
                  {editingLimit === col.id ? (
                    <input
                      type="number"
                      value={editLimitValue}
                      onChange={(e) => setEditLimitValue(e.target.value)}
                      onBlur={() => handleUpdateLimit(col.id)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdateLimit(col.id)}
                      placeholder="∞"
                      autoFocus
                      className={styles.limitInput}
                    />
                  ) : (
                    <span
                      className={`${styles.limitBadge} ${isOverLimit ? styles.limitFull : ''}`}
                      onClick={() => { setEditingLimit(col.id); setEditLimitValue(col.wip_limit !== null ? String(col.wip_limit) : ''); }}
                      title="click to edit wip limit"
                    >
                      {columnTasks.length}{col.wip_limit !== null ? ` / ${col.wip_limit}` : ''}
                    </span>
                  )}
                  <div className={styles.reorderArrows}>
                    <button 
                      onClick={() => handleReorderColumn(col.id, 'left')} 
                      className={styles.reorderBtn} 
                      title="move left"
                      disabled={columns.findIndex(c => c.id === col.id) === 0}
                    >
                      ‹
                    </button>
                    <button 
                      onClick={() => handleReorderColumn(col.id, 'right')} 
                      className={styles.reorderBtn} 
                      title="move right"
                      disabled={columns.findIndex(c => c.id === col.id) === columns.length - 1}
                    >
                      ›
                    </button>
                  </div>
                  <button
                    onClick={() => handleDeleteColumn(col.id)}
                    className={styles.deleteColBtn}
                    title="delete column"
                  >
                    ×
                  </button>
                </div>
              </div>

              {columnTasks.map((task) => (
                <div
                  key={task.id}
                  className={styles.taskCard}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id)}
                >
                  <div className={styles.taskTop}>
                    <span className={`${styles.priorityBadge} ${getPriorityClass(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className={styles.taskType}>{task.type}</span>
                  </div>
                  <p className={styles.taskTitle}>{task.title}</p>
                  <div className={styles.taskCardFooter}>
                    <span>#{task.id}</span>
                    {task.assigned_name && (
                      <div className={styles.taskAvatar}>{task.assigned_name.charAt(0)}</div>
                    )}
                  </div>
                </div>
              ))}

              {showAddTask === col.id ? (
                <div className={styles.addTaskForm}>
                  <input
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="task title..."
                    autoFocus
                    className={styles.addTaskInput}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask(col.id)}
                  />
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className={styles.prioritySelect}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                  <div className={styles.addTaskActions}>
                    <button onClick={() => handleAddTask(col.id)} className={styles.addTaskConfirm}>Add</button>
                    <button onClick={() => setShowAddTask(null)} className={styles.addTaskCancel}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button
                  className={styles.addTaskBtn}
                  onClick={() => setShowAddTask(col.id)}
                >
                  + Add Task
                </button>
              )}
            </div>
          );
        })}

        {showAddColumn ? (
          <div className={styles.addColumnForm}>
            <h4 className={styles.addColumnTitle}>New Column</h4>
            <input
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              placeholder="column name..."
              autoFocus
              className={styles.addTaskInput}
              onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
            />
            <input
              type="number"
              value={newColLimit}
              onChange={(e) => setNewColLimit(e.target.value)}
              placeholder="wip limit (optional)"
              className={`${styles.addTaskInput} ${styles.limitInputMargined}`}
            />
            <div className={styles.addTaskActionsMargined}>
              <button onClick={handleAddColumn} className={styles.addTaskConfirm}>Add Column</button>
              <button onClick={() => setShowAddColumn(false)} className={styles.addTaskCancel}>Cancel</button>
            </div>
          </div>
        ) : (
          <button 
            className={styles.addColSquareBtn} 
            onClick={() => setShowAddColumn(true)}
            title="add new column"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
};
export default ProjectBoard;