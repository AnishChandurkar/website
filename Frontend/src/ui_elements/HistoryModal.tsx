import styles from '../CSS Files/HistoryModal.module.css';
interface HistoryModalProps {
  onClose: () => void;
}
interface TaskHistory {
  id: string;
  name: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  reporter: string;
  assignee: string;
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}
const HistoryModal = ({ onClose }: HistoryModalProps) => {
  const historyData: TaskHistory[] = [
    {
      id: "T-1",
      name: "Setup React Project",
      status: "DONE",
      reporter: "Keshav",
      assignee: "John Smith",
      priority: "High",
      dueDate: "2026-02-28",
      createdAt: "2026-02-25 10:00 AM",
      updatedAt: "2026-02-26 02:30 PM"
    }
  ];
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Project History</h2>
          <button className={styles.closeButton} onClick={onClose}>&times;</button>
        </div>
        <div className={styles.content}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Task Name</th>
                <th>Status</th>
                <th>Reporter</th>
                <th>Assignee</th>
                <th>Priority</th>
                <th>Due Date</th>
                <th>Created At</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {historyData.map((task) => (
                <tr key={task.id}>
                  <td><strong>{task.id}:</strong> {task.name}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[task.status.toLowerCase().replace('_', '')]}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>{task.reporter}</td>
                  <td>{task.assignee}</td>
                  <td>{task.priority}</td>
                  <td>{task.dueDate}</td>
                  <td>{task.createdAt}</td>
                  <td>{task.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default HistoryModal;