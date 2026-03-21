import { useState } from 'react';
interface InviteMemberModalProps {
  onClose: () => void;
  onInvite: (email: string, role: string) => void;
}
const InviteMemberModal = ({ onClose, onInvite }: InviteMemberModalProps) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Project Member');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onInvite(email, role);
    }
  };
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'powderblue', padding: '30px', borderRadius: '7px', width: '420px',
        border: '1px solid #e0e0e0'
      }}>
        <h2 style={{ marginTop: 0, color: '#1a1a1a' }}>Invite to Project</h2>
        <p style={{ color: '#666666', marginBottom: '20px' }}>Enter the email address and assign a role.</p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333333', fontSize: '0.9rem' }}>
              Email Address
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              required
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '6px', 
                border: '1px solid #cccccc',
                color: '#000000',
                boxSizing: 'border-box'
              }}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333333', fontSize: '0.9rem' }}>
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid #cccccc',
                color: '#000000',
                boxSizing: 'border-box',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="Project Admin">Project Admin — can edit project & manage members</option>
              <option value="Project Member">Project Member — can create & edit tasks</option>
              <option value="Project Viewer">Project Viewer — read-only access</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button 
              type="button" 
              onClick={onClose} 
              style={{ 
                padding: '10px 15px', 
                backgroundColor: '#eeeeee', 
                color: '#333333', 
                border: '1px solid #cccccc', 
                borderRadius: '6px', 
                cursor: 'pointer' 
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={{ 
                padding: '10px 15px', 
                backgroundColor: '#007bff',
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: 'pointer' 
              }}
            >
              Send Invite
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default InviteMemberModal;