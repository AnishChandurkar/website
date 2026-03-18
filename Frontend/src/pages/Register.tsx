import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';
import styles from '../CSS Files/Login.module.css';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const { saveAuth } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    try {
      const data = await registerUser(firstName, lastName, email, password);
      if (data.token && data.user) {
        saveAuth(data.token, data.user);
      }
      navigate('/dashboard');
    } catch (err: any) {
      alert(err.message || 'Registration failed');
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Create your account</h2>
          <p className={styles.formSubtitle}>Join WorkSpace and start managing projects.</p>
          <form onSubmit={handleSubmit}>
            <div className={styles.nameRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>First name</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  required
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Last name</label>
                <input
                  type="text"
                  className={styles.fieldInput}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Smith"
                  required
                />
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Email address</label>
              <input
                type="email"
                className={styles.fieldInput}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                required
              />
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Password</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={styles.fieldInput}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Confirm password</label>
              <input
                type="password"
                className={styles.fieldInput}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                required
              />
            </div>
            <button type="submit" className={styles.submitBtn} style={{ marginTop: '8px' }}>
              Create Account
            </button>
          </form>
          <div className={styles.bottomLink}>
            Already have an account? <Link to="/login">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Register;