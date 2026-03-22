import { useState, useEffect } from 'react';
import Sidebar from '../ui_elements/SideBar';
import '../CSS Files/DashBoard.css';
import MemberModal from '../ui_elements/MemberModal';
import { fetchMyTeammates } from '../services/api';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  location: string;
  email: string;
  avatar_data?: string;
}

const Team = () => {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [search, setSearch] = useState('');

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // fetch team members from backend
    const loadTeammates = async () => {
      try {
        const data = await fetchMyTeammates();
        const formatted = data.map((u: { id: number; first_name: string | null; surname: string | null; emailid: string; avatar_data: string | null }) => ({
          id: u.id,
          name: `${u.first_name || ''} ${u.surname || ''}`.trim(),
          role: "Team Member",
          location: "Remote",
          email: u.emailid,
          avatar_data: u.avatar_data || undefined
        }));
        setMembers(formatted);
      } catch (err) {
        console.error("Failed to load teammates", err);
      } finally {
        setLoading(false);
      }
    };
    loadTeammates();
  }, []);

  const filteredMembers = members.filter(member =>
    // filter members by search criteria
    member.name.toLowerCase().includes(search.toLowerCase()) ||
    member.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleInvite = () => {
    // invite new member to team
    const email = window.prompt("Enter the email address to invite:");
    if (email) {
      alert(`Invite sent to ${email}!`);
    }
  };

  const getInitials = (name: string) => {
    // get first letters of member name
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="main-content">
        <h1 style={{ color: '#000000', margin: '0 0 5px 0' }}>Team Members</h1>
        <p style={{ marginBottom: '20px', color: '#666666' }}>Manage your team across all projects.</p>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', maxWidth: '500px' }}>
          <input
            type="text"
            placeholder="Search team members by name or email"
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

        {loading ? (
          <p>Loading teammates...</p>
        ) : filteredMembers.length === 0 ? (
          <p style={{ color: '#666666' }}>No team members found.</p>
        ) : (
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
                  textAlign: 'center',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'transform 0.1s ease',
                }}
              >
                {member.avatar_data ? (
                  <img
                    src={member.avatar_data}
                    alt={member.name}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      margin: '0 auto 15px auto',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    backgroundColor: '#007bff', color: '#ffffff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.2rem', fontWeight: 'bold', margin: '0 auto 15px auto'
                  }}>
                    {getInitials(member.name)}
                  </div>
                )}

                <h3 style={{ margin: '0 0 5px 0', color: '#000000' }}>{member.name}</h3>
                <p style={{ color: '#666666', margin: 0, fontSize: '0.9rem' }}>{member.email}</p>
              </div>
            ))}
          </div>
        )}

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