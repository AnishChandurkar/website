import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';
import { useAuth } from '../context/AuthContext';
import styles from '../CSS Files/Login.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { saveAuth } = useAuth();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const data = await loginUser(email, password);
      saveAuth(data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.formPanel}>
        <div className={styles.formContainer}>
          <h2 className={styles.formTitle}>Log in to WorkSpace</h2>
          <p className={styles.formSubtitle}>Manage your projects efficiently.</p>
          {error && <p style={{ color: 'red', fontSize: '0.9rem', margin: '0 0 10px' }}>{error}</p>}
          <form onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>Email or username</label>
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
                  placeholder="Password"
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
            <div className={styles.formRow}>
              <label className={styles.rememberMe}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember me
              </label>
              <Link to="#" className={styles.forgotLink}>Forgot password?</Link>
            </div>
            <button type="submit" className={styles.submitBtn}>
              Log In
            </button>
          </form>
          <div className={styles.bottomLink}>
            Don't have an account? <Link to="/register">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Login;