import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import './Profile.css';

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, updateUser, getFullAvatarUrl } = useAuth();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: '',
    description: '',
    website: '',
    twitter: '',
    linkedin: '',
    github: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const [userResponse, postsResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/users/${id}`),
          axios.get(`http://localhost:5000/api/posts/user/${id}`)
        ]);
        
        const userData = userResponse.data;
        setUser({ ...userData, avatar: getFullAvatarUrl(userData.avatar) });
        setPosts(postsResponse.data || []);
        
        // Initialize edit form with user data
        setEditForm({
          bio: userData.bio || '',
          description: userData.description || '',
          website: userData.socialLinks?.website || '',
          twitter: userData.socialLinks?.twitter || '',
          linkedin: userData.socialLinks?.linkedin || '',
          github: userData.socialLinks?.github || ''
        });

        // Set avatar preview
        setAvatarPreview(getFullAvatarUrl(userData.avatar));

      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id, getFullAvatarUrl]);

  const calculateStats = () => {
    const totalLikes = posts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
    const totalViews = posts.reduce((sum, post) => sum + (post.views || 0), 0);
    const totalComments = posts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);

    return {
      posts: posts.length,
      likes: totalLikes,
      views: totalViews,
      comments: totalComments
    };
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError('');

    try {
      const formData = new FormData();
      
      // Append bio and description
      formData.append('bio', editForm.bio);
      formData.append('description', editForm.description);

      // Create and append socialLinks object
      const socialLinks = {
        website: editForm.website,
        twitter: editForm.twitter,
        linkedin: editForm.linkedin,
        github: editForm.github
      };
      formData.append('socialLinks', JSON.stringify(socialLinks));
      
      // Append avatar if selected
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await axios.put(`http://localhost:5000/api/users/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const updatedUser = { ...response.data.user, avatar: getFullAvatarUrl(response.data.user.avatar) };
      
      // Update local state
      setUser(updatedUser);
      setIsEditing(false);
      setAvatarFile(null);
      
      // Update global auth context
      updateUser(response.data.user);
      
      // Update avatar preview
      setAvatarPreview(updatedUser.avatar);

    } catch (error) {
      console.error('Error updating profile:', error);
      setEditError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setEditError('Please select an image file (JPG, PNG, GIF)');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setEditError('Image size must be less than 5MB');
        return;
      }

      setAvatarFile(file);
      setEditError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setAvatarFile(null);
    setEditError('');
    
    // Reset form to current user data
    if (user) {
      setEditForm({
        bio: user.bio || '',
        description: user.description || '',
        website: user.socialLinks?.website || '',
        twitter: user.socialLinks?.twitter || '',
        linkedin: user.socialLinks?.linkedin || '',
        github: user.socialLinks?.github || ''
      });
      setAvatarPreview(user.avatar);
    }
  };

  const handleRemoveAvatar = async () => {
    setEditLoading(true);
    setEditError('');
    try {
      const response = await axios.put(`http://localhost:5000/api/users/${id}`, { removeAvatar: true });
      
      const updatedUser = { ...response.data.user, avatar: getFullAvatarUrl(response.data.user.avatar) };

      // Update local state
      setUser(updatedUser);
      setAvatarPreview(updatedUser.avatar);
      setAvatarFile(null);
      
      // Update global auth context
      updateUser(response.data.user);
      
    } catch (error) {
      console.error('Error removing avatar:', error);
      setEditError(error.response?.data?.error || 'Error removing avatar');
    } finally {
      setEditLoading(false);
    }
  };

  const isOwnProfile = currentUser && currentUser._id === id;

  if (loading) {
    return (
      <div className="profile">
        <div className="profile-header">
          <div className="skeleton-profile">
            <div className="skeleton-avatar"></div>
            <div className="skeleton-info">
              <div className="skeleton-name"></div>
              <div className="skeleton-bio"></div>
              <div className="skeleton-stats">
                <div className="skeleton-stat"></div>
                <div className="skeleton-stat"></div>
                <div className="skeleton-stat"></div>
                <div className="skeleton-stat"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="profile">
        <div className="error-message">
          {error}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile">
        <div className="error-message">
          User not found
        </div>
      </div>
    );
  }

  const stats = calculateStats();
  const joinDate = new Date(user.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="profile">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-header-content">
          <img
            src={avatarPreview}
            alt={user.username}
            className="profile-avatar"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjUwIiBmaWxsPSIjRjNGNEY2Ii8+CjxjaXJjbGUgY3g9IjUwIiBjeT0iMzUiIHI9IjE1IiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0yMCA4NWMwLTE1IDEyLjUtMjcuNSAyNy41LTI3LjVzMjcuNSAxMi41IDI3LjUgMjcuNSIgc3Ryb2tlPSIjOUNBM0FGIiBzdHJva2Utd2lkdGg9IjQiIGZpbGw9Im5vbmUiLz4KPC9zdmc+';
            }}
          />
          <div className="profile-info">
            {isEditing ? (
              <form onSubmit={handleEditSubmit} className="edit-profile-form">
                <h2>Edit Your Profile</h2>

                {/* Avatar Upload */}
                <div className="avatar-edit-section">
                  <div className="avatar-preview-container">
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="avatar-edit-preview"
                    />
                    {avatarPreview && !avatarPreview.startsWith('data:') && (
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
                  <div className="avatar-upload-controls">
                    <label htmlFor="avatar-upload" className="avatar-upload-btn">
                      📷 Change Avatar
                    </label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="avatar-upload-input"
                    />
                    <p className="avatar-upload-hint">JPG, PNG or GIF. Max 5MB.</p>
                  </div>
                </div>

                {/* Bio */}
                <div className="form-group">
                  <label htmlFor="bio">Short Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={editForm.bio}
                    onChange={handleEditChange}
                    placeholder="A brief introduction about yourself..."
                    rows="3"
                    maxLength="500"
                  />
                  <div className="char-count">{editForm.bio.length}/500</div>
                </div>

                {/* Description */}
                <div className="form-group">
                  <label htmlFor="description">Detailed Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={editForm.description}
                    onChange={handleEditChange}
                    placeholder="Tell us more about your interests, skills, and background..."
                    rows="5"
                    maxLength="1000"
                  />
                  <div className="char-count">{editForm.description.length}/1000</div>
                </div>

                {/* Social Links */}
                <div className="social-links-edit">
                  <h4>Social Links</h4>
                  <div className="social-inputs-grid">
                    <div className="form-group">
                      <label htmlFor="website">🌐 Website</label>
                      <input
                        type="url"
                        id="website"
                        name="website"
                        value={editForm.website}
                        onChange={handleEditChange}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="twitter">🐦 Twitter</label>
                      <input
                        type="url"
                        id="twitter"
                        name="twitter"
                        value={editForm.twitter}
                        onChange={handleEditChange}
                        placeholder="https://twitter.com/username"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="linkedin">💼 LinkedIn</label>
                      <input
                        type="url"
                        id="linkedin"
                        name="linkedin"
                        value={editForm.linkedin}
                        onChange={handleEditChange}
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="github">💻 GitHub</label>
                      <input
                        type="url"
                        id="github"
                        name="github"
                        value={editForm.github}
                        onChange={handleEditChange}
                        placeholder="https://github.com/username"
                      />
                    </div>
                  </div>
                </div>

                {editError && (
                  <div className="edit-error-message">
                    {editError}
                  </div>
                )}

                <div className="edit-form-actions">
                  <button 
                    type="submit" 
                    disabled={editLoading}
                    className="save-profile-btn"
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCancelEdit}
                    className="cancel-edit-btn"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <h1>{user.username}</h1>
                
                {/* Bio and Description */}
                <div className="profile-text-content">
                  <p className={`profile-bio ${!user.bio ? 'empty' : ''}`}>
                    {user.bio || 'This user hasn\'t written a bio yet.'}
                  </p>
                  {user.description && (
                    <p className="profile-description">
                      {user.description}
                    </p>
                  )}
                </div>

                {/* Profile Stats */}
                <div className="profile-stats">
                  <div className="stat-item">
                    <div className="stat-number">{stats.posts}</div>
                    <div className="stat-label">Posts</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{stats.likes}</div>
                    <div className="stat-label">Likes</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{stats.views}</div>
                    <div className="stat-label">Views</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-number">{stats.comments}</div>
                    <div className="stat-label">Comments</div>
                  </div>
                </div>

                {/* Join Date */}
                <div className="join-date">
                  🗓️ Joined {joinDate}
                </div>

                {/* Social Links */}
                {(user.socialLinks?.website || user.socialLinks?.twitter || user.socialLinks?.linkedin || user.socialLinks?.github) && (
                  <div className="profile-social-links">
                    <h4>Connect</h4>
                    <div className="social-links-grid">
                      {user.socialLinks.website && (
                        <a href={user.socialLinks.website} className="social-link" target="_blank" rel="noopener noreferrer">
                          🌐 Website
                        </a>
                      )}
                      {user.socialLinks.twitter && (
                        <a href={user.socialLinks.twitter} className="social-link" target="_blank" rel="noopener noreferrer">
                          🐦 Twitter
                        </a>
                      )}
                      {user.socialLinks.linkedin && (
                        <a href={user.socialLinks.linkedin} className="social-link" target="_blank" rel="noopener noreferrer">
                          💼 LinkedIn
                        </a>
                      )}
                      {user.socialLinks.github && (
                        <a href={user.socialLinks.github} className="social-link" target="_blank" rel="noopener noreferrer">
                          💻 GitHub
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Edit Button */}
                {isOwnProfile && (
                  <div className="profile-actions">
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="edit-profile-btn"
                    >
                      ✏️ Edit Profile
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* User Posts Section */}
      <div className="user-posts-section">
        <h2>📝 Posts by {user.username}</h2>
        
        {posts.length === 0 ? (
          <div className="empty-posts-state">
            <h3>No posts yet</h3>
            <p>{user.username} hasn't shared any ideas with the community yet.</p>
            {isOwnProfile && (
              <button 
                onClick={() => navigate('/create-post')}
                className="create-first-post-btn"
              >
                ✨ Create Your First Post
              </button>
            )}
          </div>
        ) : (
          <div className="posts-grid">
            {posts.map(post => (
              <PostCard key={post._id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;