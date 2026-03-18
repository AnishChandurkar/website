import { useState } from 'react';

interface NewProjectModalProps {
  onClose: () => void;
  onSave?: (name: string, description: string, status: string) => void;
  onUpdate?: (id: number, name: string, description: string, status: string, progress: number) => void;
  initialData?: {
    id: number;
    name: string;
    description: string;
    status: 'In Progress' | 'Completed' | 'Planning' | 'On Hold' | 'Review';
    progress: number;
  };
}

const NewProjectModal = ({ onClose, onSave, onUpdate, initialData }: NewProjectModalProps) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [status, setStatus] = useState<'In Progress' | 'Completed' | 'Planning' | 'On Hold' | 'Review'>(initialData?.status || 'Planning');
  const [progress, setProgress] = useState(initialData?.progress || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      if (initialData && onUpdate) {
        onUpdate(initialData.id, name, description, status, progress);
      } else if (onSave) {
        onSave(name, description, status);
      }
      onClose();
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: '#ffffff', padding: '30px', borderRadius: '4px', width: '450px', border: '1px solid #cccccc' }}>
        <h2 style={{ marginTop: 0, color: '#000000' }}>{initialData ? 'Edit Project Details' : 'Create New Project'}</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333333' }}>Project Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cccccc', color: '#000000', boxSizing: 'border-box' }}
              placeholder="e.g. My Website Redesign"
              required
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333333' }}>Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cccccc', color: '#000000', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical' }}
              placeholder="What is this project about?"
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333333' }}>Status</label>
            <select 
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cccccc', color: '#000000', boxSizing: 'border-box' }}
            >
              <option value="Planning">Planning</option>
              <option value="In Progress">In Progress</option>
              <option value="On Hold">On Hold</option>
              <option value="Review">Review</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          {initialData && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333333' }}>Progress ({progress}%)</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={progress}
                onChange={(e) => setProgress(parseInt(e.target.value))}
                style={{ width: '100%', cursor: 'pointer' }}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 15px', backgroundColor: '#eeeeee', color: '#333333', border: '1px solid #cccccc', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#007bff', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              {initialData ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;
