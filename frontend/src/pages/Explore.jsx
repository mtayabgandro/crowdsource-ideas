import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import PostCard from '../components/PostCard';
import './Explore.css';

const Explore = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const location = useLocation();

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/posts');
        setPosts(response.data.posts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
  }, [location.pathname]);

  const filteredPosts = posts.filter(post => {
    // Type filter
    if (filter !== 'all' && post.type !== filter) return false;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        post.title?.toLowerCase().includes(searchLower) ||
        post.content?.toLowerCase().includes(searchLower) ||
        post.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return true;
  });

  const popularTags = [...new Set(posts.flatMap(post => post.tags || []))].slice(0, 10);

  if (loading) {
    return (
      <div className="loading">
        Discovering amazing ideas...
      </div>
    );
  }

  return (
    <div className="explore">
      <h1>Explore Community Ideas</h1>

      {/* Search Section */}
      <div className="search-filter-section">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search ideas, questions, or tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Results Count */}
        <div className="results-count">
          Showing <strong>{filteredPosts.length}</strong> of {posts.length} posts
          {searchTerm && ` for "${searchTerm}"`}
          {filter !== 'all' && ` in ${filter}s`}
        </div>

        {/* Filter Buttons */}
        <div className="filter-buttons">
          <button
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'active' : ''}
          >
            🌟 All Posts
          </button>
          <button
            onClick={() => setFilter('question')}
            className={filter === 'question' ? 'active' : ''}
          >
            ❓ Questions
          </button>
          <button
            onClick={() => setFilter('idea')}
            className={filter === 'idea' ? 'active' : ''}
          >
            💡 Ideas
          </button>
          <button
            onClick={() => setFilter('discussion')}
            className={filter === 'discussion' ? 'active' : ''}
          >
            💬 Discussions
          </button>
        </div>

        {/* Popular Tags */}
        {popularTags.length > 0 && (
          <div className="filter-tags">
            {popularTags.map(tag => (
              <span
                key={tag}
                className="filter-tag"
                onClick={() => setSearchTerm(tag)}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Posts Grid */}
      <div className={`posts-grid ${filter === 'idea' ? 'ideas-view' : ''}`}>
        {filteredPosts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              {filter === 'question' ? '❓' : filter === 'idea' ? '💡' : filter === 'discussion' ? '💬' : '🔍'}
            </div>
            <h3>No {filter === 'all' ? '' : filter + ' '}ideas found</h3>
            <p>
              {searchTerm
                ? `No results for "${searchTerm}". Try different keywords or browse all posts.`
                : `No ${filter === 'all' ? '' : filter + ' '}posts available yet.`
              }
            </p>
            {(searchTerm || filter !== 'all') && (
              <button
                className="refresh-btn"
                onClick={() => {
                  setSearchTerm('');
                  setFilter('all');
                }}
              >
                🔄 Show All Posts
              </button>
            )}
          </div>
        ) : (
          filteredPosts.map(post => (
            <PostCard key={post._id} post={post} />
          ))
        )}
      </div>
    </div>
  );
};

export default Explore;
