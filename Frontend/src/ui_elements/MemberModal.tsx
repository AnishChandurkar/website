import styles from './MemberModal.module.css';

interface TeamMember {
  id: number;
  name: string;
  role: string;
  location: string;
  email: string;
  profile_url?: string;
}

interface MemberModalProps {
  member: TeamMember;
  onClose: () => void;
}

const MemberModal = ({ member, onClose }: MemberModalProps) => {
  const getInitials = (name: string) => {
    // extract member initials from name
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>&times;</button>
        
        {member.profile_url ? (
          <img 
            src={member.profile_url.startsWith('data:') ? member.profile_url : `http://localhost:3001${member.profile_url}`} 
            alt={member.name} 
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              objectFit: 'cover',
              margin: '0 auto 15px auto',
              display: 'block'
            }}
          />
        ) : (
          <div className={styles.avatar}>
            {getInitials(member.name)}
          </div>
        )}
        
        <h2 className={styles.name}>{member.name}</h2>
        <div className={styles.role}>{member.role}</div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Email Address</span>
          <div className={styles.value}>{member.email}</div>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Location</span>
          <div className={styles.value}>{member.location}</div>
        </div>
        <div className={styles.infoRow}>
          <span className={styles.label}>Designation</span>
          <div className={styles.value}>{member.role}</div>
        </div>
        
        <button 
          onClick={onClose}
          style={{
            marginTop: '10px',
            padding: '8px 20px',
            backgroundColor: '#007bff',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default MemberModal;