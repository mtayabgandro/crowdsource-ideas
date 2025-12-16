import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './CreatePost.css';

const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState('question');
  const [tags, setTags] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to create a post');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const postData = {
        title,
        content,
        type,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      await axios.post('http://localhost:5000/api/posts', postData);
      navigate('/explore');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="create-post">
        <div className="error">You must be logged in to create a post</div>
      </div>
    );
  }

  const postTypes = [
    { value: 'question', label: '❓ Question' },
    { value: 'idea', label: '💡 Idea' },
    { value: 'discussion', label: '💬 Discussion' }
  ];

  return (
    <div className="create-post">
      <h1>Share Your Idea</h1>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit} className="post-form">
        <input
          type="text"
          placeholder="What's your amazing idea about?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        
        <textarea
          placeholder="Describe your idea in detail... ✨"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        
        <div className="post-type-container">
          <label>Post Type</label>
          <div className="type-selector">
            {postTypes.map((postType) => (
              <div
                key={postType.value}
                className={`type-option ${type === postType.value ? 'active' : ''}`}
                onClick={() => setType(postType.value)}
              >
                {postType.label}
              </div>
            ))}
          </div>
        </div>
        
        <input
          type="text"
          placeholder="Add relevant tags (comma separated)"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
        />
        <div className="tags-hint">e.g., technology, startup, marketing</div>
        
        <button 
          type="submit" 
          className={`submit-button ${loading ? 'loading' : ''}`}
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Publish Idea 🚀'}
        </button>
      </form>
    </div>
  );
};

export default CreatePost;