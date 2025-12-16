import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import './Dashboard.css';

const Dashboard = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalLikes: 0,
    totalViews: 0,
    totalComments: 0
  });
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/posts/user/${user._id}`);
        const userPosts = response.data;
        setPosts(userPosts);

        // Calculate stats
        const totalLikes = userPosts.reduce((sum, post) => sum + (post.likes?.length || 0), 0);
        const totalViews = userPosts.reduce((sum, post) => sum + (post.views || 0), 0);
        const totalComments = userPosts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);

        setStats({
          totalPosts: userPosts.length,
          totalLikes,
          totalViews,
          totalComments
        });
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserPosts();
  }, [user, location.pathname]);

  if (!user) {
    return (
      <div className="dashboard">
        <div className="error">You must be logged in to view your dashboard</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard">
        <h1>My Dashboard</h1>
        <div className="skeleton-stats">
          {[1, 2, 3, 4].map(item => (
            <div key={item} className="skeleton-stat">
              <div className="skeleton-number"></div>
              <div className="skeleton-text"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <h1>Welcome to Your Dashboard</h1>
      
      {/* Quick Actions */}
      <div className="quick-actions">
        <div className="action-card" onClick={() => navigate('/create-post')}>
          <div className="action-icon">📝</div>
          <h3>Create Post</h3>
          <p>Share your ideas</p>
        </div>
        <div className="action-card" onClick={() => navigate(`/profile/${user._id}`)}>
          <div className="action-icon">👤</div>
          <h3>Edit Profile</h3>
          <p>Update your info</p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="dashboard-stats">
        <div className="stat">
          <h3>{stats.totalPosts}</h3>
          <p>Total Posts</p>
        </div>
        <div className="stat">
          <h3>{stats.totalLikes}</h3>
          <p>Total Likes</p>
        </div>
        <div className="stat">
          <h3>{stats.totalViews}</h3>
          <p>Total Views</p>
        </div>
        <div className="stat">
          <h3>{stats.totalComments}</h3>
          <p>Total Comments</p>
        </div>
      </div>

      {/* User Posts Section */}
      <div className="user-posts">
        <h2>Your Recent Posts</h2>
        {posts.length === 0 ? (
          <div className="empty-state">
            <h3>No posts yet</h3>
            <p>Start sharing your ideas with the community!</p>
            <button 
              className="create-post-btn"
              onClick={() => navigate('/create-post')}
            >
              ✨ Create Your First Post
            </button>
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

export default Dashboard;