import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed. Please try again.');
    }
    
    setLoading(false);
  };

  const handleDemoLogin = async () => {
    setEmail('demo@example.com');
    setPassword('demo123');
    // You can auto-submit or show a message
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Welcome Back! 👋</h2>
        
        {error && <div className="error">{error}</div>}

        <div className="form-group">
          <label htmlFor="login-email">Email</label>
          <input
            type="email"
            id="login-email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="login-password">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            id="login-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>

        <button 
          type="submit" 
          className={`auth-button ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          {loading ? 'Signing In...' : 'Sign In 🚀'}
        </button>

        {/* Demo Login Option */}
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <button
            type="button"
            onClick={handleDemoLogin}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--soft-teal)',
              cursor: 'pointer',
              fontSize: '0.9rem',
              textDecoration: 'underline'
            }}
          >
            Try Demo Account
          </button>
        </div>

        <p>
          Don't have an account?{' '}
          <Link to="/register">Create one here</Link>
        </p>
      </form>
    </div>
  );
};

export default Login;