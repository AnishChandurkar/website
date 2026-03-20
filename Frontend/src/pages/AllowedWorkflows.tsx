import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from '../CSS Files/AllowedWorkflows.module.css';
interface Workflow {
  id: number;
  source: string;
  target: string;
}
const AllowedWorkflows = () => {
  const { boardId } = useParams();
  const [showModal, setShowModal] = useState(false);
  const [sourceColumn, setSourceColumn] = useState('');
  const [targetColumn, setTargetColumn] = useState('');
  const [columns] = useState([
    { id: 1, name: 'To Do' },
  ]);
  const [workflows, setWorkflows] = useState<Workflow[]>([
    { id: 1, source: 'To Do', target: 'In Progress' },
  ]);
  const handleSave = () => {
    if (!sourceColumn || !targetColumn) {
      alert("Please select both columns!");
      return;
    }
    const newWorkflow: Workflow = {
      id: Date.now(),
      source: sourceColumn,
      target: targetColumn
    };    
    setWorkflows([...workflows, newWorkflow]);
    setShowModal(false);
    setSourceColumn('');
    setTargetColumn('');
  };
  return (
    <div className={styles.pageContainer}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <Link to={`/board/${boardId}`} className={styles.backLink}>← Back to Board</Link>
          <h2 className={styles.boardTitle}>Allowed Workflows</h2>
        </div>
      </div>
      <div className={styles.contentArea}>
        <button 
          className={styles.addBtn} 
          onClick={() => setShowModal(true)}
        >
          Add customised Workflow
        </button>
        <div className={styles.tableContainer}>
          <table className={styles.workflowTable}>
            <thead>
              <tr>
                <th className={styles.tableHeader}>From Column</th>
                <th className={styles.tableHeader}>To Column</th>
              </tr>
            </thead>
            <tbody>
              {workflows.length === 0 ? (
                <tr>
                  <td colSpan={2} className={styles.tableCell} style={{ textAlign: 'center', color: '#999999' }}>
                    No custom workflows defined yet.
                  </td>
                </tr>
              ) : (
                workflows.map(wf => (
                  <tr key={wf.id} className={styles.tableRow}>
                    <td className={styles.tableCell}>{wf.source}</td>
                    <td className={styles.tableCell}>{wf.target}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Add Custom Workflow</h3>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>From Column</label>
              <select 
                className={styles.selectInput}
                value={sourceColumn}
                onChange={(e) => setSourceColumn(e.target.value)}
              >
                <option value="">Select starting column...</option>
                {columns.map(col => (
                  <option key={col.id} value={col.name}>{col.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>To Column</label>
              <select 
                className={styles.selectInput}
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
              >
                <option value="">Select destination column...</option>
                {columns.map(col => (
                  <option key={col.id} value={col.name}>{col.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button className={styles.saveBtn} onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AllowedWorkflows;