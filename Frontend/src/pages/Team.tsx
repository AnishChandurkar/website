import { useState } from 'react';
import Sidebar from '../ui_elements/SideBar';
import '../CSS Files/DashBoard.css';
import MemberModal from '../ui_elements/MemberModal';
interface TeamMember {
  id: number;
  name: string;
  role: string;
  location: string;
  email: string;
}
const Team = () => {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [search, setSearch] = useState('');
  const members: TeamMember[] = [
    { id: 1, name: "John Smith", role: "Frontend Engineer", location: "San Francisco", email: "john@workspace.com" }
  ];
  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(search.toLowerCase())
  );
  const handleInvite = () => {
    const email = window.prompt("Enter the email address to invite:");
    if (email) {
      alert(`Invite sent to ${email}!`);
    }
  };
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <h1 style={{ color: '#000000', margin: '0 0 5px 0' }}>Team Members</h1>
        <p style={{ marginBottom: '20px', color: '#666666' }}>Manage your team.</p>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', maxWidth: '500px' }}>
          <input
            type="text"
            placeholder="Search team members"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              flex: 1, 
              padding: '10px 14px',
              backgroundColor: '#ffffff',
              border: '1px solid #cccccc',
              borderRadius: '4px',
              color: '#000000',
              fontSize: '0.9rem',
              outline: 'none'
            }}
          />
          
          <button 
            onClick={handleInvite}
            style={{
              backgroundColor: '#007bff',
              color: '#ffffff',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            Invite People
          </button>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
          gap: '20px'
        }}>
          {filteredMembers.map((member) => (
            <div
              key={member.id}
              onClick={() => setSelectedMember(member)}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cccccc',
                padding: '20px',
                borderRadius: '4px',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{
                width: '60px', height: '60px', borderRadius: '50%',
                backgroundColor: '#007bff', color: '#ffffff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.5rem', fontWeight: 'bold', margin: '0 auto 15px auto'
              }}>
                {member.name.charAt(0)}
              </div>
              <h3 style={{ margin: '0 0 5px 0', color: '#000000' }}>{member.name}</h3>
              <p style={{ color: '#666666', margin: 0, fontSize: '0.9rem' }}>{member.role}</p>
            </div>
          ))}
        </div>
        {selectedMember && (
          <MemberModal
            member={selectedMember}
            onClose={() => setSelectedMember(null)}
          />
        )}
      </div>
    </div>
  );
};
export default Team;