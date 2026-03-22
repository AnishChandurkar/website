import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { fetchColumns, fetchProjectWorkflows, addWorkflow, deleteWorkflow, fetchBoardProject } from '../services/api';
import styles from '../CSS Files/AllowedWorkflows.module.css';

interface Workflow {
  id: number;
  source: string;
  target: string;
}

interface Column {
  id: number;
  name: string;
}

const AllowedWorkflows = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [sourceColumn, setSourceColumn] = useState<string>('');
  const [targetColumn, setTargetColumn] = useState<string>('');
  const [projectId, setProjectId] = useState<number | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const initData = async () => {
      try {
        if (!boardId) return;

        // fetch board info
        const boardInfo = await fetchBoardProject(Number(boardId));
        setProjectId(boardInfo.project_id);

        // fetch columns and workflows
        const cols = await fetchColumns(Number(boardId));
        const wfs = await fetchProjectWorkflows(boardInfo.project_id);

        setColumns(Array.isArray(cols) ? cols as Column[] : []);
        setWorkflows(Array.isArray(wfs) ? wfs as Workflow[] : []);
      } catch (err: unknown) {
        console.error("failed to init allowed workflows:", err);
        // even if workflows fail, fetch columns for dropdowns
        try {
          const cols = await fetchColumns(Number(boardId));
          setColumns(Array.isArray(cols) ? cols as Column[] : []);
        } catch { }
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
      // find column ids
      const fromCol = columns.find(c => String(c.id) === sourceColumn);
      const toCol = columns.find(c => String(c.id) === targetColumn);
      if (!fromCol || !toCol) {
        alert("column not found!");
        return;
      }

      // call api to add workflow
      const res = await addWorkflow(projectId, Number(boardId), fromCol.id, toCol.id);

      // format new workflow and add to state
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