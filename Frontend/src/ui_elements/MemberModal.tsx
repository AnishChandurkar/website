import styles from './MemberModal.module.css';
interface TeamMember {
  id: number;
  name: string;
  role: string;
  location: string;
  email: string;
}
interface MemberModalProps {
  member: TeamMember;
  onClose: () => void;
}
const MemberModal = ({ member, onClose }: MemberModalProps) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>&times;</button>
        
        <div className={styles.avatar}>
          {member.name.charAt(0)}
        </div>
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