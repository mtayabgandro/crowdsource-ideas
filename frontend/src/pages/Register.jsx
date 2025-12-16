import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters long');
      return false;
    }
    return true;
  };

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, text: '' };
    if (password.length < 6) return { strength: 1, text: 'Weak' };
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    let strength = 1;
    if (password.length >= 8) strength++;
    if (hasUpperCase && hasLowerCase) strength++;
    if (hasNumbers) strength++;
    if (hasSpecialChar) strength++;
    
    const strengthText = strength <= 2 ? 'Weak' : strength <= 3 ? 'Medium' : 'Strong';
    return { strength, text: strengthText };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setLoading(true);
    
    try {
      const result = await register(formData.username, formData.email, formData.password);
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-form success-state">
          <div className="success-icon">🎉</div>
          <h3>Welcome to Crowdsource Ideas!</h3>
          <p>Your account has been created successfully. Redirecting you to your dashboard...</p>
          <div className="loading" style={{ fontSize: '1rem' }}>
            <div>Setting up your profile...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form register">
        <h2>Join Our Community! 🌟</h2>
        <p style={{ textAlign: 'center', color: 'var(--gray-text)', marginBottom: '2rem' }}>
          Start sharing your amazing ideas with the world
        </p>

        {error && <div className="error">{error}</div>}

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            type="text"
            id="username"
            name="username"
            placeholder="Choose a username"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={loading}
            minLength="3"
          />
          {formData.username.length > 0 && formData.username.length < 3 && (
            <div className="validation-message invalid">
              Username must be at least 3 characters
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Create a password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            minLength="6"
          />
          {formData.password && (
            <div className="password-strength">
              <div className="strength-bar">
                <div className={`strength-fill ${passwordStrength.text.toLowerCase()}`}></div>
              </div>
              <div className="strength-text">
                Password strength: <strong>{passwordStrength.text}</strong>
              </div>
            </div>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Confirm your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            disabled={loading}
          />
          {formData.confirmPassword && (
            <div className={`password-match ${passwordsMatch ? 'matching' : 'not-matching'}`}>
              {passwordsMatch ? '✅' : '❌'} 
              {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
            </div>
          )}
        </div>

        <button
          type="submit"
          className={`auth-button ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          {loading ? 'Creating Account...' : 'Create Account 🚀'}
        </button>

        <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          Already part of our community?{' '}
          <Link to="/login" style={{ fontWeight: '600' }}>Sign In Here</Link>
        </p>


      </form>
    </div>
  );
};

export default Register;