import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fetchColumns, fetchProjectWorkflows, addWorkflow, deleteWorkflow, fetchBoardProject } from '../services/api';
import styles from '../CSS Files/AllowedWorkflows.module.css';
interface Workflow {
  id: number;
  source: string;
  target: string;
}
const AllowedWorkflows = () => {
  const { boardId } = useParams();
  const [showModal, setShowModal] = useState(false);
  const [sourceColumn, setSourceColumn] = useState<string>('');
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [projectId, setProjectId] = useState<number | null>(null);
  const [columns, setColumns] = useState<any[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  useEffect(() => {
    const initData = async () => {
      try {
        if (!boardId) return;
        
        // 1. Fetch Board Info (gives project_id)
        const boardInfo = await fetchBoardProject(Number(boardId));
        setProjectId(boardInfo.project_id);

        // 2. Fetch Columns and Workflows in parallel
        const [cols, wfs] = await Promise.all([
          fetchColumns(Number(boardId)),
          fetchProjectWorkflows(boardInfo.project_id)
        ]);
        
        setColumns(Array.isArray(cols) ? cols : []);
        setWorkflows(Array.isArray(wfs) ? wfs : []);
      } catch (err: any) {
        console.error("Failed to init AllowedWorkflows:", err);
        // Even if workflows fail, we want columns for the dropdowns
        try {
           const cols = await fetchColumns(Number(boardId));
           setColumns(Array.isArray(cols) ? cols : []);
        } catch {}
      }
    };
    initData();
  }, [boardId]);

  const handleSave = async () => {
    if (!sourceColumn || !targetColumn) {
      alert("Please select both columns!");
      return;
    }
    if (!projectId) return;
    try {
      const fromCol = columns.find(c => String(c.id) === sourceColumn);
      const toCol = columns.find(c => String(c.id) === targetColumn);
      if (!fromCol || !toCol) {
        alert("Column not found!");
        return;
      }

      const res = await addWorkflow(projectId, Number(boardId), fromCol.id, toCol.id);
      const newWorkflow: Workflow = {
        id: res.id,
        source: fromCol.name,
        target: toCol.name
      };    
      setWorkflows([...workflows, newWorkflow]);
      setShowModal(false);
      setSourceColumn('');
      setTargetColumn('');
    } catch (err: any) {
      alert(err.message || "Failed to add workflow.");
    }
  };

  const handleDelete = async (wfId: number) => {
    if (!projectId) return;
    try {
      await deleteWorkflow(projectId, wfId);
      setWorkflows(workflows.filter(w => w.id !== wfId));
    } catch (err: any) {
      alert("Failed to delete workflow");
    }
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
                <th className={styles.tableHeader}>Action</th>
              </tr>
            </thead>
            <tbody>
              {workflows.length === 0 ? (
                <tr>
                  <td colSpan={3} className={styles.tableCell} style={{ textAlign: 'center', color: '#999999' }}>
                    No custom workflows defined yet.
                  </td>
                </tr>
              ) : (
                workflows.map(wf => (
                  <tr key={wf.id} className={styles.tableRow}>
                    <td className={styles.tableCell}>{wf.source}</td>
                    <td className={styles.tableCell}>{wf.target}</td>
                    <td className={styles.tableCell}>
                      <button 
                        onClick={() => handleDelete(wf.id)}
                        style={{ background: 'transparent', color: '#ef4444', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Delete
                      </button>
                    </td>
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
                  <option key={col.id} value={String(col.id)}>{col.name}</option>
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
                  <option key={col.id} value={String(col.id)}>{col.name}</option>
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