import { useState, useEffect, type ChangeEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, uploadAvatar } from '../services/api';
import Sidebar from '../ui_elements/SideBar';
import styles from '../CSS Files/Profile.module.css';

interface FullProfile {
  id: number;
  first_name: string;
  surname: string;
  emailid: string;
  profile_url: string | null;
  created_at: string;
}

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch {
        setProfile(null);
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const getInitials = (firstName: string, surname: string) => {
    return `${firstName.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const data = await uploadAvatar(e.target.files[0]);
        if (profile) {
          setProfile({ ...profile, profile_url: data.profile_url });
        }
      } catch (err: any) {
        alert(err.message || 'Failed to upload avatar');
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.layout}>
        <Sidebar />
        <div className={styles.container}>
          <div className={styles.card}>
            <p>Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  const displayProfile = profile || (user ? {
    id: user.id,
    first_name: user.first_name,
    surname: user.surname,
    emailid: user.emailid,
    profile_url: null,
    created_at: new Date().toISOString()
  } : null);

  if (!displayProfile) {
    return (
      <div className={styles.layout}>
        <Sidebar />
        <div className={styles.container}>
          <div className={styles.card}>
            <p>Unable to load profile</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1>My Profile</h1>
          </div>

          <div className={styles.avatarSection}>
            {displayProfile.profile_url ? (
              <img
                src={displayProfile.profile_url.startsWith('data:') ? displayProfile.profile_url : `http://localhost:3001${displayProfile.profile_url}`}
                alt="Profile"
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {getInitials(displayProfile.first_name, displayProfile.surname)}
              </div>
            )}
            <label className={styles.uploadBtn}>
              Change Photo
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={styles.fileInput}
              />
            </label>
          </div>

          <div className={styles.infoSection}>
            <div className={styles.infoRow}>
              <div className={styles.label}>First Name</div>
              <div className={styles.value}>{displayProfile.first_name}</div>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.label}>Surname</div>
              <div className={styles.value}>{displayProfile.surname}</div>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.label}>Email Address</div>
              <div className={styles.value}>{displayProfile.emailid}</div>
            </div>
            <div className={styles.infoRow}>
              <div className={styles.label}>Member Since</div>
              <div className={styles.value}>{formatDate(displayProfile.created_at)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Profile;