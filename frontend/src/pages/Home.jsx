import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useLocation } from 'react-router-dom';
import PostCard from '../components/PostCard';
import './Home.css';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalPosts: 0,
    totalUsers: 0,
    totalComments: 0
  });
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const [postsResponse, statsResponse] = await Promise.all([
          axios.get('http://localhost:5000/api/posts?limit=6'), // ✅ Added limit parameter
          axios.get('http://localhost:5000/api/posts/stats')
        ]);

        // Handle posts response (could be array or object with posts property)
        const postsData = postsResponse.data.posts || postsResponse.data;
        setPosts(Array.isArray(postsData) ? postsData : []);

        // Handle stats response with fallbacks
        setStats({
          totalPosts: statsResponse.data.totalPosts || 0,
          totalUsers: statsResponse.data.totalUsers || 0,
          totalComments: statsResponse.data.totalComments || 0
        });

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
        
        // Fallback: try to get at least posts
        try {
          const postsResponse = await axios.get('http://localhost:5000/api/posts?limit=10');
          const postsData = postsResponse.data.posts || postsResponse.data;
          setPosts(Array.isArray(postsData) ? postsData : []);
        } catch (postsError) {
          console.error('Error fetching posts:', postsError);
          setPosts([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [location.pathname]);

  // Retry function for error recovery
  const retryFetch = () => {
    setError('');
    setLoading(true);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading amazing ideas...</p>
      </div>
    );
  }

  // Show error state
  if (error && posts.length === 0) {
    return (
      <div className="error-state">
        <div className="error-icon">⚠️</div>
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button onClick={retryFetch} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  const recentPosts = posts.slice(0, 6);

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Share. Collaborate. Innovate.</h1>
          <p>
            Join our community of thinkers, creators, and innovators. 
            Share your ideas, get feedback, and turn imagination into reality.
          </p>
          <div className="hero-actions">
            <Link to="/explore" className="cta-button primary">
              🚀 Explore Ideas
            </Link>
            <Link to="/create-post" className="cta-button secondary">
              💡 Share Your Idea
            </Link>
          </div>
        </div>
      </section>

      {/* Error Banner (if partial failure) */}
      {error && posts.length > 0 && (
        <div className="error-banner">
          <span>{error}</span>
          <button onClick={retryFetch} className="retry-btn-small">
            Retry
          </button>
        </div>
      )}

      {/* Features Section */}
      <section className="features">
        <h2>Why Join Crowdsource Ideas?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">💡</div>
            <h3>Share Ideas</h3>
            <p>Post your innovative ideas and get valuable feedback from the community</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🤝</div>
            <h3>Collaborate</h3>
            <p>Connect with like-minded individuals and work together on amazing projects</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Grow Together</h3>
            <p>Learn from others, improve your ideas, and watch your concepts evolve</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats">
        <div className="stats-grid">
          <div className="stat-item">
            <h3>{stats.totalPosts.toLocaleString()}+</h3>
            <p>Ideas Shared</p>
          </div>
          <div className="stat-item">
            <h3>{stats.totalUsers.toLocaleString()}+</h3>
            <p>Community Members</p>
          </div>
          <div className="stat-item">
            <h3>{stats.totalComments.toLocaleString()}+</h3>
            <p>Collaborative Comments</p>
          </div>
        </div>
      </section>

      {/* Recent Posts Section */}
      <section className="recent-posts">
        <h2>Recently Shared Ideas</h2>
        
        {recentPosts.length > 0 ? (
          <>
            <div className="posts-grid">
              {recentPosts.map(post => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
            {posts.length >= 6 && (
              <div className="view-all-container">
                <Link to="/explore" className="view-all-btn">
                  View All Posts →
                </Link>
              </div>
            )}
          </>
        ) : (
          <div className="no-posts">
            <div className="no-posts-icon">💭</div>
            <h3>No posts yet</h3>
            <p>Be the first to share an idea with the community!</p>
            <Link to="/create-post" className="cta-button primary">
              Create First Post
            </Link>
          </div>
        )}
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to share your ideas?</h2>
          <p>Join thousands of innovators already sharing their ideas</p>
          <Link to="/create-post" className="cta-button large">
            Start Sharing Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;