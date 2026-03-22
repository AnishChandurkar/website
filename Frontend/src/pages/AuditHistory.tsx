import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import styles from '../CSS Files/AuditHistory.module.css';
import { fetchAuditLogs } from '../services/api';

interface AuditLog {
  id: number;
  task_title: string;
  task_id: number;
  event_type: string;
  old_value: string | null;
  new_value: string | null;
  creator_first_name: string | null;
  creator_surname: string | null;
  editor_first_name: string | null;
  editor_surname: string | null;
  is_closed: boolean;
  is_resolved: boolean;
  created_at: string;
}

const AuditHistory = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    // fetch audit logs when component loads
    const loadLogs = async () => {
      try {
        if (boardId) {
          const data = await fetchAuditLogs(boardId);
          setAuditLogs(data);
        }
      } catch (err) {
        console.error("Failed to load audit logs:", err);
      } finally {
        setLoading(false);
      }
    };
    loadLogs();
  }, [boardId]);

  const formatDate = (dateStr: string) => {
    // convert date string to readable format
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Link to={`/board/${boardId}`} className={styles.backLink}>← Back to Board</Link>
          <h2 className={styles.boardTitle}>Audit History</h2>
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
                <th className={styles.tableHeader}>Event Time</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className={styles.tableCell} style={{ textAlign: 'center' }}>Loading...</td></tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={10} className={styles.tableCell} style={{ textAlign: 'center', color: '#999999' }}>
                    No audit history found for this board.
                  </td>
                </tr>
              ) : (
                auditLogs.map(log => (
                  <tr key={log.id} className={styles.tableRow}>
                    <td className={styles.tableCell} style={{ fontWeight: 'bold', color: '#000000' }}>{log.task_title}</td>
                    <td className={styles.tableCell}>#{log.task_id}</td>
                    <td className={styles.tableCell}>{log.event_type}</td>
                    <td className={styles.tableCell}>{log.old_value || '-'}</td>
                    <td className={styles.tableCell}>{log.new_value || '-'}</td>
                    <td className={styles.tableCell}>{log.creator_first_name} {log.creator_surname}</td>
                    <td className={styles.tableCell}>{log.editor_first_name} {log.editor_surname}</td>
                    <td className={styles.tableCell}>{log.is_closed ? 'YES' : '-'}</td>
                    <td className={styles.tableCell}>{log.is_resolved ? 'YES' : '-'}</td>
                    <td className={styles.tableCell}>{formatDate(log.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  );
};

export default AuditHistory;
