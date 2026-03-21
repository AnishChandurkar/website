import { useState } from 'react';
interface AddBoardModalProps {
  onClose: () => void;
  onSave: (boardName: string) => void;
}
const AddBoardModal = ({ onClose, onSave }: AddBoardModalProps) => {
  const [boardName, setBoardName] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // handle form submission for new board
    if (boardName.trim()) {
      onSave(boardName);
      onClose();
    }
  };
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
      <div style={{ backgroundColor: 'powderblue', padding: '30px', borderRadius: '7px', width: '400px', border: '1px solid #cccccc',fontSize: '1rem' }}>
        <h2 style={{ marginTop: 0, color: '#000000' }}>Create New Board</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333333', fontSize: '1.3rem' }}>Board Name</label>
            <input 
              type="text" 
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #cccccc', color: '#000000', boxSizing: 'border-box',fontSize: '1rem' }}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 15px', backgroundColor: '#eeeeee', color: '#333333', border: '1px solid #cccccc', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>Cancel</button>
            <button type="submit" style={{ padding: '10px 15px', backgroundColor: '#007bff', color: '#ffffff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '1rem' }}>Create Board</button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AddBoardModal;