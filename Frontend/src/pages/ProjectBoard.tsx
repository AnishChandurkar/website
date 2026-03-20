import { useState, useEffect, useCallback, type DragEvent } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styles from '../CSS Files/ProjectBoard.module.css';
import {
  fetchColumns, fetchTasks, createTask, moveTask,
  createColumn, renameColumn, deleteColumn, updateColumnLimit,
  reorderColumns, fetchTeamMembers, fetchProjectWorkflows
} from '../services/api';
import TaskDetailModal from '../ui_elements/TaskDetailModal';
interface Task {
  id: number;
  title: string;
  description: string | null;
  column_id: number | null;
  priority: 'HIGH' | 'CRITICAL' | 'MEDIUM' | 'LOW';
  type: 'Story' | 'Task' | 'Bug';
  assigned_to: number | null;
  assigned_first_name: string | null;
  assigned_surname: string | null;
  parent_id: number | null;
  parent_title: string | null;
  due_date: string | null;
  created_at: string;
}
interface Column {
  id: number;
  name: string;
  position: number;
  wip_limit: number | null;
}
interface Member {
  id: number;
  first_name: string;
  surname: string;
}
const PRIORITY_DOT: Record<string, string> = {
  LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#ef4444', CRITICAL: '#a855f7',
};
const COL_PALETTE = ['#6366f1','#3b82f6','#0ea5e9','#22c55e','#f59e0b','#ef4444','#a855f7'];
function formatDue(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}
function isOverdue(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso) < new Date();
}
const ProjectBoard = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const [columns, setColumns]       = useState<Column[]>([]);
  const [tasks, setTasks]           = useState<Task[]>([]);
  const [members, setMembers]       = useState<Member[]>([]);
  const [loading, setLoading]       = useState(true);
  const [projectId, setProjectId]   = useState<number | null>(null);
  const [allowedWorkflows, setAllowedWorkflows] = useState<{from_column_id: number, to_column_id: number}[]>([]);
  const [dragOverCol, setDragOverCol] = useState<number | null>(null);
  const [filterType, setFilterType]         = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterAssignee, setFilterAssignee] = useState<string>('ALL');
  const [searchQuery, setSearchQuery]       = useState('');
  const [showAddTask, setShowAddTask]   = useState<number | null>(null);
  const [newTitle, setNewTitle]         = useState('');
  const [newType, setNewType]           = useState<'Story' | 'Task' | 'Bug'>('Task');
  const [newPriority, setNewPriority]   = useState('MEDIUM');
  const [newAssignee, setNewAssignee]   = useState('');
  const [newDueDate, setNewDueDate]     = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newParentId, setNewParentId]   = useState('');
  const [showAddColumn, setShowAddColumn]   = useState(false);
  const [newColName, setNewColName]         = useState('');
  const [newColLimit, setNewColLimit]       = useState('');
  const [editingCol, setEditingCol]         = useState<number | null>(null);
  const [editColName, setEditColName]       = useState('');
  const [editingLimit, setEditingLimit]     = useState<number | null>(null);
  const [editLimitValue, setEditLimitValue] = useState('');
  const [openTaskId, setOpenTaskId] = useState<number | null>(null);
  const loadBoard = useCallback(async () => {
    try {
      const [colsData, tasksData] = await Promise.all([
        fetchColumns(Number(boardId)),
        fetchTasks(Number(boardId)),
      ]);
      setColumns(colsData);
      setTasks(tasksData);
    } catch (err) {
      console.error('failed to load board :(', err);
    } finally {
      setLoading(false);
    }
  }, [boardId]);
  useEffect(() => {
    const fetchBoardInfo = async () => {
      try {
        const res = await fetch(`http://localhost:3001/api/boards/${boardId}/project`, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setProjectId(data.project_id);
          const [membersData, workflowsData] = await Promise.all([
            fetchTeamMembers(data.project_id),
            fetchProjectWorkflows(data.project_id)
          ]);
          setMembers(membersData);
          setAllowedWorkflows(workflowsData);
        }
      } catch {
      }
    };
    fetchBoardInfo();
    loadBoard();
  }, [boardId, loadBoard]);
  const handleDragStart = (e: DragEvent<HTMLDivElement>, taskId: number) => {
    e.dataTransfer.setData('text/plain', String(taskId));
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: DragEvent<HTMLDivElement>, colId: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(colId);
  };
  const handleDrop = async (e: DragEvent<HTMLDivElement>, targetColId: number) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = parseInt(e.dataTransfer.getData('text/plain'));
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.column_id === targetColId) return;

    // Workflow Check
    const sourceIdx = columns.findIndex(c => c.id === task.column_id);
    const targetIdx = columns.findIndex(c => c.id === targetColId);
    
    if (sourceIdx !== -1 && targetIdx !== -1) {
      const distance = Math.abs(targetIdx - sourceIdx);
      if (distance > 1) {
        // Enforce custom transitions
        const isAllowed = allowedWorkflows.find(
          w => w.from_column_id === task.column_id && w.to_column_id === targetColId
        );
        if (!isAllowed) {
          alert('Invalid transition: You cannot skip stages unless permitted in Allowed Workflows!');
          return;
        }
      }
    }

    const prev = [...tasks];
    setTasks(ts => ts.map(t => t.id === taskId ? { ...t, column_id: targetColId } : t));
    try {
      await moveTask(taskId, targetColId);
    } catch (err: any) {
      setTasks(prev);
      alert(err.message || 'couldnt move that task :/');
    }
  };
  const resetAddForm = () => {
    setNewTitle(''); setNewType('Task'); setNewPriority('MEDIUM');
    setNewAssignee(''); setNewDueDate(''); setNewDescription('');
    setNewParentId(''); setShowAddTask(null);
  };
  const handleAddTask = async (columnId: number) => {
    if (!newTitle.trim()) return;
    try {
      await createTask(
        Number(boardId), newTitle.trim(), columnId,
        newPriority, newType, newDescription || undefined,
        newAssignee ? Number(newAssignee) : null,
        newDueDate || null,
        newParentId ? Number(newParentId) : null,
      );
      resetAddForm();
      await loadBoard();
    } catch (err: any) {
      alert(err.message || 'task creation failed :o');
    }
  };
  const handleAddColumn = async () => {
    if (!newColName.trim()) return;
    try {
      await createColumn(Number(boardId), newColName, newColLimit ? parseInt(newColLimit) : undefined);
      setNewColName(''); setNewColLimit(''); setShowAddColumn(false);
      await loadBoard();
    } catch (err: any) { alert(err.message || 'couldnt add the column'); }
  };
  const handleRenameColumn = async (colId: number) => {
    if (!editColName.trim()) return;
    try {
      await renameColumn(colId, editColName);
      setEditingCol(null);
      await loadBoard();
    } catch (err: any) { alert(err.message || 'rename failed'); }
  };
  const handleDeleteColumn = async (colId: number) => {
    if (!window.confirm('delete this column and all its tasks?')) return;
    try { await deleteColumn(colId); await loadBoard(); }
    catch (err: any) { alert(err.message || 'delete column failed'); }
  };
  const handleUpdateLimit = async (colId: number) => {
    try {
      const limit = editLimitValue.trim() === '' ? null : parseInt(editLimitValue);
      await updateColumnLimit(colId, limit);
      setEditingLimit(null); await loadBoard();
    } catch (err: any) { alert(err.message || 'wip limit update failed :('); }
  };
  const handleReorderColumn = async (colId: number, dir: 'left' | 'right') => {
    const idx = columns.findIndex(c => c.id === colId);
    if (dir === 'left' && idx === 0) return;
    if (dir === 'right' && idx === columns.length - 1) return;
    const next = [...columns];
    const ti = dir === 'left' ? idx - 1 : idx + 1;
    [next[idx], next[ti]] = [next[ti], next[idx]];
    setColumns(next);
    try { await reorderColumns(Number(boardId), next.map(c => c.id)); }
    catch (err: any) { alert(err.message || 'reorder went sideways :/'); await loadBoard(); }
  };
  const filteredTasks = tasks.filter(t => {
    if (filterType     !== 'ALL' && t.type     !== filterType)     return false;
    if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
    if (filterAssignee !== 'ALL') {
      if (filterAssignee === 'UNASSIGNED' && t.assigned_to !== null) return false;
      if (filterAssignee !== 'UNASSIGNED' && String(t.assigned_to) !== filterAssignee) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !String(t.id).includes(q)) return false;
    }
    return true;
  });
  const storyTasks = tasks.filter(t => t.type === 'Story');
  const dotColors: Record<number, string> = {};
  columns.forEach((col, i) => { dotColors[col.id] = COL_PALETTE[i % COL_PALETTE.length]; });
  const getPriorityClass = (p: string) => {
    if (p === 'HIGH')     return styles.priorityHigh;
    if (p === 'CRITICAL') return styles.priorityCritical;
    if (p === 'MEDIUM')   return styles.priorityMedium;
    if (p === 'LOW')      return styles.priorityLow;
    return '';
  };
  const getTypeClass = (t: string) => {
    if (t === 'Story') return styles.typeStory;
    if (t === 'Bug')   return styles.typeBug;
    return styles.typeTask;
  };
  const effectiveProjectId = projectId ?? 0;
  if (loading) {
    return <div className={styles.loadingContainer}>loading board...</div>;
  }
  return (
    <div className={styles.pageContainer}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Link to="/dashboard" className={styles.backLink}>Back to Projects</Link>
          <h2 className={styles.boardTitle}>Board</h2>
        </div>
        <div className={styles.filters}>
          <input
            className={styles.searchInput}
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <select className={styles.filterSelect} value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="ALL">All Types</option>
            <option value="Story">Story</option>
            <option value="Task">Task</option>
            <option value="Bug">Bug</option>
          </select>
          <select className={styles.filterSelect} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <select className={styles.filterSelect} value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
            <option value="ALL">All Assignees</option>
            <option value="UNASSIGNED">Unassigned</option>
            {members.map(m => (
              <option key={m.id} value={String(m.id)}>{m.first_name} {m.surname}</option>
            ))}
          </select>
        </div>
      </div>
      <div className={styles.contentArea}>
        <div className={styles.boardSidebar}>
          <button 
            className={styles.sidebarBtn} 
            onClick={() => navigate(`/board/${boardId}/allowed-workflows`)}>
            Allowed Workflows
          </button>
          <button 
            className={styles.sidebarBtn} 
            onClick={() => navigate(`/board/${boardId}/stories`)}>
            Stories
          </button>
          <button 
            className={styles.sidebarBtn} 
            onClick={() => navigate(`/board/${boardId}/audit-history`)}>
            Audit History
          </button>
        </div>
        <div className={styles.boardContainer}>
          {columns.map(col => {
            const colTasks    = filteredTasks.filter(t => t.column_id === col.id);
            const allColTasks = tasks.filter(t => t.column_id === col.id);
            const isOverLimit  = col.wip_limit !== null && allColTasks.length >= col.wip_limit;
            const isDragTarget = dragOverCol === col.id;
            return (
              <div
                key={col.id}
                className={`${styles.column} ${isDragTarget ? styles.columnDragOver : ''} ${isOverLimit ? styles.columnFull : ''}`}
                onDragOver={e => handleDragOver(e, col.id)}
                onDragLeave={() => setDragOverCol(null)}
                onDrop={e => handleDrop(e, col.id)}
              >
                <div className={styles.columnHeader}>
                  <div className={styles.columnTitle}>
                    <span className={styles.columnDot} style={{ backgroundColor: dotColors[col.id] }} />
                    {editingCol === col.id ? (
                      <input
                        value={editColName}
                        onChange={e => setEditColName(e.target.value)}
                        onBlur={() => handleRenameColumn(col.id)}
                        onKeyDown={e => e.key === 'Enter' && handleRenameColumn(col.id)}
                        autoFocus className={styles.inlineInput}
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
                        onChange={e => setEditLimitValue(e.target.value)}
                        onBlur={() => handleUpdateLimit(col.id)}
                        onKeyDown={e => e.key === 'Enter' && handleUpdateLimit(col.id)}
                        placeholder="no limit" autoFocus className={styles.limitInput}
                      />
                    ) : (
                      <span
                        className={`${styles.limitBadge} ${isOverLimit ? styles.limitFull : ''}`}
                        onClick={() => { setEditingLimit(col.id); setEditLimitValue(col.wip_limit !== null ? String(col.wip_limit) : ''); }}
                        title="click to edit wip limit"
                      >
                        {allColTasks.length}{col.wip_limit !== null ? ` / ${col.wip_limit}` : ''}
                      </span>
                    )}
                    <div className={styles.reorderArrows}>
                      <button onClick={() => handleReorderColumn(col.id, 'left')} className={styles.reorderBtn} title="move left" disabled={columns.findIndex(c => c.id === col.id) === 0}>‹</button>
                      <button onClick={() => handleReorderColumn(col.id, 'right')} className={styles.reorderBtn} title="move right" disabled={columns.findIndex(c => c.id === col.id) === columns.length - 1}>›</button>
                    </div>
                    <button onClick={() => handleDeleteColumn(col.id)} className={styles.deleteColBtn} title="delete column">×</button>
                  </div>
                </div>
                {colTasks.map(task => (
                  <div
                    key={task.id}
                    className={`${styles.taskCard} ${task.type === 'Story' ? styles.taskCardStory : ''} ${task.type === 'Bug' ? styles.taskCardBug : ''}`}
                    draggable
                    onDragStart={e => handleDragStart(e, task.id)}
                    onClick={() => setOpenTaskId(task.id)}
                  >
                    <div className={styles.taskTop}>
                      <span className={`${styles.typeBadge} ${getTypeClass(task.type)}`}>
                        {task.type}
                      </span>
                      <span className={styles.priorityDot} style={{ backgroundColor: PRIORITY_DOT[task.priority] }} title={task.priority} />
                    </div>
                    <p className={styles.taskTitle}>{task.title}</p>
                    {task.parent_id && task.parent_title && (
                      <span className={styles.parentCrumb}>
                        Story: {task.parent_title}
                      </span>
                    )}
                    <div className={styles.taskCardFooter}>
                      <div className={styles.taskMeta}>
                        <span className={`${styles.priorityBadge} ${getPriorityClass(task.priority)}`}>
                          {task.priority}
                        </span>
                        <span className={styles.taskId}>#{task.id}</span>
                      </div>
                      <div className={styles.taskFooterRight}>
                        {task.due_date && (
                          <span className={`${styles.dueDateTag} ${isOverdue(task.due_date) ? styles.dueDateOverdue : ''}`}>
                            {formatDue(task.due_date)}
                          </span>
                        )}
                        {task.assigned_first_name ? (
                          <div className={styles.taskAvatar} title={`${task.assigned_first_name} ${task.assigned_surname}`}>
                            {task.assigned_first_name.charAt(0)}
                          </div>
                        ) : (
                          <div className={styles.taskAvatarEmpty} title="unassigned">?</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {showAddTask === col.id ? (
                  <div className={styles.addTaskForm}>
                    <input
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      placeholder="title..."
                      autoFocus
                      className={styles.addTaskInput}
                      onKeyDown={e => e.key === 'Enter' && handleAddTask(col.id)}
                    />
                    <select
                      value={newType}
                      onChange={e => setNewType(e.target.value as 'Story' | 'Task' | 'Bug')}
                      className={styles.addFormSelect}
                    >
                      <option value="Story">Story</option>
                      <option value="Task">Task</option>
                      <option value="Bug">Bug</option>
                    </select>
                    <select
                      value={newPriority}
                      onChange={e => setNewPriority(e.target.value)}
                      className={styles.addFormSelect}
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                    <select
                      value={newAssignee}
                      onChange={e => setNewAssignee(e.target.value)}
                      className={styles.addFormSelect}
                    >
                      <option value="">Unassigned</option>
                      {members.map(m => (
                        <option key={m.id} value={String(m.id)}>{m.first_name} {m.surname}</option>
                      ))}
                    </select>
                    {newType !== 'Story' && storyTasks.length > 0 && (
                      <select
                        value={newParentId}
                        onChange={e => setNewParentId(e.target.value)}
                        className={styles.addFormSelect}
                      >
                        <option value="">No parent story</option>
                        {storyTasks.map(s => (
                          <option key={s.id} value={String(s.id)}>#{s.id} — {s.title}</option>
                        ))}
                      </select>
                    )}
                    <input
                      type="date"
                      value={newDueDate}
                      onChange={e => setNewDueDate(e.target.value)}
                      className={styles.addTaskInput}
                      title="due date"
                    />
                    <textarea
                      value={newDescription}
                      onChange={e => setNewDescription(e.target.value)}
                      placeholder="description (optional)..."
                      className={styles.addDescTextarea}
                      rows={2}
                    />
                    <div className={styles.addTaskActions}>
                      <button onClick={() => handleAddTask(col.id)} className={styles.addTaskConfirm}>Add</button>
                      <button onClick={resetAddForm} className={styles.addTaskCancel}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button className={styles.addTaskBtn} onClick={() => { setShowAddTask(col.id); setNewTitle(''); }}>
                    + Add Item
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
                onChange={e => setNewColName(e.target.value)}
                placeholder="column name..."
                autoFocus
                className={styles.addTaskInput}
                onKeyDown={e => e.key === 'Enter' && handleAddColumn()}
              />
              <input
                type="number"
                value={newColLimit}
                onChange={e => setNewColLimit(e.target.value)}
                placeholder="wip limit (optional)"
                className={`${styles.addTaskInput} ${styles.limitInputMargined}`}
              />
              <div className={styles.addTaskActionsMargined}>
                <button onClick={handleAddColumn} className={styles.addTaskConfirm}>Add Column</button>
                <button onClick={() => setShowAddColumn(false)} className={styles.addTaskCancel}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className={styles.addColSquareBtn} onClick={() => setShowAddColumn(true)} title="add new column">
              +
            </button>
          )}
        </div>
      </div>
      {openTaskId !== null && (
        <TaskDetailModal
          taskId={openTaskId}
          projectId={effectiveProjectId}
          onClose={() => setOpenTaskId(null)}
          onUpdated={loadBoard}
          onOpenTask={(id) => setOpenTaskId(id)}
        />
      )}
    </div>
  );
};
export default ProjectBoard;
