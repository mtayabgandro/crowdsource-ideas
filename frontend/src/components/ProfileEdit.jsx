// components/ProfileEdit.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './ProfileEdit.css';

const ProfileEdit = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    bio: '',
    description: '',
    website: '',
    twitter: '',
    linkedin: '',
    github: ''
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axios.get('/api/profile/me/edit');
        const userData = response.data;
        
        setFormData({
          bio: userData.bio || '',
          description: userData.description || '',
          website: userData.socialLinks?.website || '',
          twitter: userData.socialLinks?.twitter || '',
          linkedin: userData.socialLinks?.linkedin || '',
          github: userData.socialLinks?.github || ''
        });
        
        // Set avatar preview if exists
        if (userData.avatar) {
          setAvatarPreview(`http://localhost:5000${userData.avatar}`);
        } else {
          setAvatarPreview('/default-avatar.png');
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        setError('Failed to load profile data');
      }
    };

    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (JPG, PNG, GIF)');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      setAvatar(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      const response = await axios.delete('/api/profile/avatar');
      setAvatarPreview('/default-avatar.png');
      setAvatar(null);
      setMessage('Avatar removed successfully');
      
      // Update global user context
      updateUser(response.data.user);
      
    } catch (error) {
      setError('Error removing avatar');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const submitData = new FormData();
      
      // Append form data
      Object.keys(formData).forEach(key => {
        submitData.append(key, formData[key]);
      });
      
      // Append avatar if selected
      if (avatar) {
        submitData.append('avatar', avatar);
      }

      const response = await axios.put('/api/profile/update', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage('Profile updated successfully!');
      
      // Update global user context
      updateUser(response.data.user);
      
      // Redirect to profile page after 2 seconds
      setTimeout(() => {
        navigate(`/profile/${user._id}`);
      }, 2000);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.error || 'Error updating profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-edit">
      <div className="profile-edit-header">
        <h1>Edit Your Profile</h1>
        <p>Customize how you appear to the community</p>
      </div>

      <form onSubmit={handleSubmit} className="profile-edit-form">
        {message && (
          <div className="alert alert-success">
            <span>✅</span> {message}
          </div>
        )}
        {error && (
          <div className="alert alert-error">
            <span>❌</span> {error}
          </div>
        )}

        {/* Avatar Upload Section */}
        <div className="form-section">
          <h3>Profile Picture</h3>
          <div className="avatar-upload-section">
            <div className="avatar-preview-container">
              <img 
                src={avatarPreview} 
                alt="Avatar preview" 
                className="avatar-preview"
                onError={(e) => {
                  e.target.src = '/default-avatar.png';
                }}
              />
              {avatarPreview && avatarPreview !== '/default-avatar.png' && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="remove-avatar-btn"
                  title="Remove avatar"
                >
                  🗑️
                </button>
              )}
            </div>
            
            <div className="avatar-controls">
              <label htmlFor="avatar-upload" className="upload-btn">
                <span>📷</span> Choose Image
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="upload-input"
              />
              <p className="upload-info">
                JPG, PNG or GIF. Max 5MB. Square images work best.
              </p>
            </div>
          </div>
        </div>

        {/* Bio Section */}
        <div className="form-section">
          <h3>About You</h3>
          
          <div className="form-group">
            <label htmlFor="bio">Short Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="A brief introduction about yourself..."
              rows="3"
              maxLength="500"
              className="form-input"
            />
            <div className="input-footer">
              <span className="char-count">{formData.bio.length}/500</span>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Detailed Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Tell us more about your interests, skills, and background..."
              rows="5"
              maxLength="1000"
              className="form-input"
            />
            <div className="input-footer">
              <span className="char-count">{formData.description.length}/1000</span>
            </div>
          </div>
        </div>

        {/* Social Links Section */}
        <div className="form-section">
          <h3>Social Links</h3>
          <p className="section-description">Connect your social profiles</p>
          
          <div className="social-inputs">
            <div className="form-group">
              <label htmlFor="website">🌐 Website</label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://yourwebsite.com"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="twitter">🐦 Twitter</label>
              <input
                type="url"
                id="twitter"
                name="twitter"
                value={formData.twitter}
                onChange={handleInputChange}
                placeholder="https://twitter.com/username"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="linkedin">💼 LinkedIn</label>
              <input
                type="url"
                id="linkedin"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleInputChange}
                placeholder="https://linkedin.com/in/username"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="github">💻 GitHub</label>
              <input
                type="url"
                id="github"
                name="github"
                value={formData.github}
                onChange={handleInputChange}
                placeholder="https://github.com/username"
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="form-actions">
          <button 
            type="button"
            onClick={() => navigate(`/profile/${user._id}`)}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileEdit;