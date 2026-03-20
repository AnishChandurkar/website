import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from '../CSS Files/AuditHistory.module.css';
interface AuditRecord {
  id: number;
  taskId: number;
  taskName: string;
  eventType: string;
  oldValue: string;
  newValue: string;
  creator: string;
  editor: string;
  closed: string;
  resolved: string;
  createdAt: string;
  lastUpdated: string;
}
const AuditHistory = () => {
  const { boardId } = useParams();
  const [auditLogs] = useState<AuditRecord[]>([
    {
      id: 1,
      taskId: 1042,
      taskName: 'Design Database Schema',
      eventType: 'Status Update',
      oldValue: 'To Do',
      newValue: 'In Progress',
      creator: 'Johnnny h',
      editor: 'Aliceyyy Johnson',
      closed: 'No',
      resolved: 'No',
      createdAt: 'vadl',
      lastUpdated: '2026'
    }
  ]);
  return (
    <div className={styles.pageContainer}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Link to={`/board/${boardId}`} className={styles.backLink}>← Back to Board</Link>
          <h2 className={styles.boardTitle}>Audit History</h2>
        </div>
      </div> 
      <div className={styles.contentArea}>
        <div className={styles.tableContainer}>
          <table className={styles.auditTable}>
            <thead>
              <tr>
                <th className={styles.tableHeader}>Task Name</th>
                <th className={styles.tableHeader}>Task ID</th>
                <th className={styles.tableHeader}>Event Type</th>
                <th className={styles.tableHeader}>Old Value</th>
                <th className={styles.tableHeader}>New Value</th>
                <th className={styles.tableHeader}>Creator</th>
                <th className={styles.tableHeader}>Editor</th>
                <th className={styles.tableHeader}>Closed</th>
                <th className={styles.tableHeader}>Resolved</th>
                <th className={styles.tableHeader}>Created At</th>
                <th className={styles.tableHeader}>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={11} className={styles.tableCell} style={{ textAlign: 'center', color: '#999999' }}>
                    No audit history found for this board.
                  </td>
                </tr>
              ) : (
                auditLogs.map(log => (
                  <tr key={log.id} className={styles.tableRow}>
                    <td className={styles.tableCell} style={{ fontWeight: 'bold', color: '#000000' }}>{log.taskName}</td>
                    <td className={styles.tableCell}>#{log.taskId}</td>
                    <td className={styles.tableCell}>{log.eventType}</td>
                    <td className={styles.tableCell}>{log.oldValue}</td>
                    <td className={styles.tableCell}>{log.newValue}</td>
                    <td className={styles.tableCell}>{log.creator}</td>
                    <td className={styles.tableCell}>{log.editor}</td>
                    <td className={styles.tableCell}>{log.closed}</td>
                    <td className={styles.tableCell}>{log.resolved}</td>
                    <td className={styles.tableCell}>{log.createdAt}</td>
                    <td className={styles.tableCell}>{log.lastUpdated}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
export default AuditHistory;