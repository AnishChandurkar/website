import { useState } from 'react';
interface InviteMemberModalProps {
  onClose: () => void;
  onInvite: (email: string) => void;
}
const InviteMemberModal = ({ onClose, onInvite }: InviteMemberModalProps) => {
  const [email, setEmail] = useState('');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      onInvite(email);
      onClose();
    }
  };
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#ffffff', padding: '30px', borderRadius: '4px', width: '400px',
        border: '1px solid #cccccc'
      }}>
        <h2 style={{ marginTop: 0, color: '#000000' }}>Invite to Project</h2>
        <p style={{ color: '#666666', marginBottom: '20px' }}>Enter the email address of the person you want to invite.</p>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#333333' }}>
              Email Address
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '4px', 
                border: '1px solid #cccccc',
                color: '#000000'
              }}
              autoFocus
            />
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
                borderRadius: '4px', 
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
                borderRadius: '4px', 
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