import { useState, type ChangeEvent } from 'react';
import styles from '../CSS Files/Profile.module.css';
interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string | null; 
}
const Profile = () => {
  const [user, setUser] = useState<UserProfile>({
    name: "Keshav",
    email: "keshav@iitd.ac.in",
    avatarUrl: null
  });
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      console.log("File selected for upload:", e.target.files[0].name);
    }
  };
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 style={{ color: '#000000', marginTop: 0 }}>My Profile</h1>
        <div className={styles.avatarSection}>
          <img
            src={user.avatarUrl || "https://via.placeholder.com/150"}
            alt="Profile"
            className={styles.avatar}
          />
          <br />
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className={styles.fileInput}
          />
        </div>
        <div className={styles.infoSection}>
          <div className={styles.label}>Full Name</div>
          <div className={styles.value} style={{ color: '#000000' }}>{user.name}</div>
          <div className={styles.label}>Email Address</div>
          <div className={styles.value} style={{ color: '#000000' }}>{user.email}</div>
          <div className={styles.label}>Role</div>
          <div className={styles.value} style={{ color: '#000000' }}>Student / Developer</div>
        </div>
      </div>
    </div>
  );
};
export default Profile;