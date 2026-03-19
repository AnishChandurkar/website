import { useState, useEffect, useCallback } from 'react';
import styles from '../CSS Files/TaskDetailModal.module.css';
import { getTask, getChildTasks, updateTask, deleteTask, fetchTeamMembers } from '../services/api';

interface Task {
  id: number;
  title: string;
  description: string | null;
  type: 'Story' | 'Task' | 'Bug';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  column_id: number | null;
  column_name: string | null;
  parent_id: number | null;
  parent_title: string | null;
  parent_type: string | null;
  assigned_to: number | null;
  assigned_first_name: string | null;
  assigned_surname: string | null;
  reporter_first_name: string | null;
  reporter_surname: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  board_id: number;
}

interface ChildTask {
  id: number;
  title: string;
  type: string;
  priority: string;
  column_name: string | null;
  assigned_first_name: string | null;
  assigned_surname: string | null;
}

interface Member {
  id: number;
  first_name: string;
  surname: string;
  emailid: string;
}

interface Props {
  taskId: number;
  projectId: number;
  onClose: () => void;
  onUpdated: () => void;
  onOpenTask?: (taskId: number) => void;
}

const TYPE_LABEL: Record<string, string> = {
  Story: 'Story',
  Task:  'Task',
  Bug:   'Bug',
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW:      'Low',
  MEDIUM:   'Medium',
  HIGH:     'High',
  CRITICAL: 'Critical',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso) < new Date();
}

const TaskDetailModal = ({ taskId, projectId, onClose, onUpdated, onOpenTask }: Props) => {
  const [task, setTask]           = useState<Task | null>(null);
  const [children, setChildren]   = useState<ChildTask[]>([]);
  const [members, setMembers]     = useState<Member[]>([]);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [dirty, setDirty]         = useState(false);
  const [editDesc, setEditDesc]   = useState(false);

  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [type, setType]             = useState<'Story' | 'Task' | 'Bug'>('Task');
  const [priority, setPriority]     = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('MEDIUM');
  const [assignedTo, setAssignedTo] = useState<number | null>(null);
  const [dueDate, setDueDate]       = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [taskData, childrenData, membersData] = await Promise.all([
        getTask(taskId),
        getChildTasks(taskId),
        fetchTeamMembers(projectId),
      ]);
      setTask(taskData);
      setChildren(childrenData);
      setMembers(membersData);

      setTitle(taskData.title ?? '');
      setDescription(taskData.description ?? '');
      setType(taskData.type ?? 'Task');
      setPriority(taskData.priority ?? 'MEDIUM');
      setAssignedTo(taskData.assigned_to ?? null);
      setDueDate(taskData.due_date ? taskData.due_date.substring(0, 10) : '');
      setDirty(false);
    } catch (err) {
      console.error('couldnt load task details :(', err);
    } finally {
      setLoading(false);
    }
  }, [taskId, projectId]);

  useEffect(() => { load(); }, [load]);

  const markDirty = () => setDirty(true);

  const handleSave = async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      await updateTask(taskId, {
        title:       title.trim() || task?.title,
        description: description || null,
        type,
        priority,
        assigned_to: assignedTo,
        due_date:    dueDate || null,
      });
      setDirty(false);
      onUpdated();
      await load();
    } catch (err: any) {
      alert(err.message || 'save went sideways :/');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`delete "${task?.title}"? this cant be undone! :o`)) return;
    try {
      await deleteTask(taskId);
      onUpdated();
      onClose();
    } catch (err: any) {
      alert(err.message || 'couldnt delete that task :/');
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      if (dirty) {
        if (window.confirm('you have unsaved changes, ditch them? :/')) onClose();
      } else {
        onClose();
      }
    }
  };

  const getTypeClass = (t: string) => {
    if (t === 'Story') return styles.typeStory;
    if (t === 'Bug')   return styles.typeBug;
    return styles.typeTask;
  };

  const getPriorityClass = (p: string) => {
    if (p === 'LOW')      return styles.priorityLow;
    if (p === 'MEDIUM')   return styles.priorityMedium;
    if (p === 'HIGH')     return styles.priorityHigh;
    if (p === 'CRITICAL') return styles.priorityCritical;
    return '';
  };

  if (loading) {
    return (
      <div className={styles.overlay} onClick={handleBackdropClick}>
        <div className={styles.modal}>
          <div style={{ padding: 40, textAlign: 'center', color: '#666666', fontSize: '0.9rem' }}>
            loading task details...
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className={styles.overlay} onClick={handleBackdropClick}>
        <div className={styles.modal}>
          <div style={{ padding: 40, textAlign: 'center', color: '#cc0000' }}>
            couldnt find that task :o
          </div>
        </div>
      </div>
    );
  }

  const assignedMember = members.find(m => m.id === assignedTo);
  const overdue = isOverdue(dueDate || null);

  return (
    <div className={styles.overlay} onClick={handleBackdropClick}>
      <div className={styles.modal}>

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerMeta}>
              <span className={styles.taskIdBadge}>#{task.id}</span>
              <span className={`${styles.typeBadge} ${getTypeClass(type)}`}>
                {TYPE_LABEL[type]}
              </span>
              <span className={`${styles.priorityBadge} ${getPriorityClass(priority)}`}>
                {PRIORITY_LABELS[priority]}
              </span>
            </div>
            <input
              className={styles.editableTitle}
              value={title}
              onChange={e => { setTitle(e.target.value); markDirty(); }}
              placeholder="Task title…"
            />
          </div>
          <div className={styles.headerActions}>
            <button className={styles.deleteBtn} onClick={handleDelete}>Delete</button>
            <button className={styles.closeBtn} onClick={onClose} title="Close">✕</button>
          </div>
        </div>

        <div className={styles.body}>

          <div className={styles.mainContent}>

            {task.parent_id && (
              <div className={styles.section}>
                <span className={styles.sectionLabel}>↑ Parent Story</span>
                <div>
                  <span
                    className={styles.parentLink}
                    onClick={() => onOpenTask && onOpenTask(task.parent_id!)}
                    title="Open parent story"
                  >
                    <span className={styles.parentLinkText}>
                      #{task.parent_id} — {task.parent_title ?? 'Story'}
                    </span>
                  </span>
                </div>
              </div>
            )}

            <div className={styles.section}>
              <span className={styles.sectionLabel}>Description</span>
              {editDesc ? (
                <textarea
                  className={styles.descriptionTextarea}
                  value={description}
                  onChange={e => { setDescription(e.target.value); markDirty(); }}
                  placeholder="Add a description…"
                  autoFocus
                  onBlur={() => setEditDesc(false)}
                />
              ) : (
                <div
                  className={styles.descriptionPlaceholder}
                  onClick={() => setEditDesc(true)}
                  title="Click to edit description"
                >
                  {description
                    ? <span style={{ color: '#374151', fontStyle: 'normal', whiteSpace: 'pre-wrap' }}>{description}</span>
                    : 'Click to add a description…'}
                </div>
              )}
            </div>

            {(task.type === 'Story' || type === 'Story') && (
              <div className={styles.section}>
                <span className={styles.sectionLabel}>
                  Child Tasks & Bugs ({children.length})
                </span>
                {children.length === 0 ? (
                  <p className={styles.noChildren}>No child tasks yet. Create a Task or Bug and link it to this Story.</p>
                ) : (
                  <div className={styles.childrenList}>
                    {children.map(child => (
                      <div
                        key={child.id}
                        className={styles.childItem}
                        onClick={() => onOpenTask && onOpenTask(child.id)}
                      >
                        <span className={`${styles.typeBadge} ${getTypeClass(child.type)}`}>
                          {child.type}
                        </span>
                        <span className={styles.childItemTitle}>
                          #{child.id} — {child.title}
                        </span>
                        <span className={styles.childColumnTag}>
                          {child.column_name ?? 'Unplaced'}
                        </span>
                        {(child.assigned_first_name) && (
                          <div className={styles.assigneeAvatar} style={{ width: 22, height: 22, fontSize: '0.65rem' }}>
                            {child.assigned_first_name.charAt(0)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className={styles.section}>
              <span className={styles.sectionLabel}>Reporter</span>
              <div className={styles.assigneeChip}>
                <div className={styles.assigneeAvatar} style={{ background: 'linear-gradient(135deg,#10b981,#059669)' }}>
                  {task.reporter_first_name?.charAt(0) ?? '?'}
                </div>
                <span>{task.reporter_first_name} {task.reporter_surname}</span>
              </div>
            </div>

            <div className={styles.section}>
              <span className={styles.sectionLabel}>Created</span>
              <span className={styles.dueDateValue}>{formatDate(task.created_at)}</span>
            </div>

            {task.updated_at !== task.created_at && (
              <div className={styles.section}>
                <span className={styles.sectionLabel}>Last Updated</span>
                <span className={styles.dueDateValue}>{formatDate(task.updated_at)}</span>
              </div>
            )}
          </div>

          <div className={styles.sidebar}>

            <div className={styles.section}>
              <span className={styles.sectionLabel}>Type</span>
              <select
                className={styles.fieldSelect}
                value={type}
                onChange={e => { setType(e.target.value as 'Story' | 'Task' | 'Bug'); markDirty(); }}
              >
                <option value="Story">Story</option>
                <option value="Task">Task</option>
                <option value="Bug">Bug</option>
              </select>
              {type === 'Story' && task.parent_id && (
                <span style={{ fontSize: '0.75rem', color: '#cc6600', marginTop: 4 }}>
                  note: stories cannot have a parent story
                </span>
              )}
            </div>

            <div className={styles.divider} />

            <div className={styles.section}>
              <span className={styles.sectionLabel}>Priority</span>
              <select
                className={styles.fieldSelect}
                value={priority}
                onChange={e => { setPriority(e.target.value as any); markDirty(); }}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div className={styles.divider} />

            <div className={styles.section}>
              <span className={styles.sectionLabel}>Assignee</span>
              <select
                className={styles.fieldSelect}
                value={assignedTo ?? ''}
                onChange={e => { setAssignedTo(e.target.value ? Number(e.target.value) : null); markDirty(); }}
              >
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.first_name} {m.surname}
                  </option>
                ))}
              </select>
              {assignedMember ? (
                <div className={styles.assigneeChip} style={{ marginTop: 6 }}>
                  <div className={styles.assigneeAvatar}>
                    {assignedMember.first_name.charAt(0)}
                  </div>
                  <span>{assignedMember.first_name} {assignedMember.surname}</span>
                </div>
              ) : (
                <div className={styles.unassignedChip} style={{ marginTop: 6 }}>
                  <span>Unassigned</span>
                </div>
              )}
            </div>

            <div className={styles.divider} />

            <div className={styles.section}>
              <span className={styles.sectionLabel}>Due Date</span>
              <input
                type="date"
                className={styles.fieldDateInput}
                value={dueDate}
                onChange={e => { setDueDate(e.target.value); markDirty(); }}
              />
              {dueDate && (
                <span className={`${styles.dueDateValue} ${overdue ? styles.dueDateOverdue : ''}`}>
                  {overdue ? 'overdue! ' : ''}{formatDate(dueDate)}
                </span>
              )}
            </div>

            <div className={styles.divider} />

            <div className={styles.section}>
              <span className={styles.sectionLabel}>Current Column</span>
              <span style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>
                {task.column_name ?? <span style={{ color: '#9ca3af' }}>Unplaced</span>}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.saveBtn}
            onClick={handleSave}
            disabled={!dirty || saving}
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
