import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import './PostDetail.css';

const PostDetail = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        const [postResponse, commentsResponse] = await Promise.all([
          axios.get(`http://localhost:5000/api/posts/${id}`),
          axios.get(`http://localhost:5000/api/posts/${id}/comments`)
        ]);
        setPost(postResponse.data);
        setComments(commentsResponse.data);
      } catch (error) {
        setError('Failed to load post');
        console.error('Error fetching post:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPostAndComments();

    // Increment view count
    const incrementView = async () => {
      try {
        const response = await axios.post(`http://localhost:5000/api/posts/${id}/view`);
        // Update the post views in state
        setPost(prevPost => prevPost ? { ...prevPost, views: response.data.views } : null);
      } catch (error) {
        console.error('Error incrementing view:', error);
      }
    };
    incrementView();
  }, [id]);

  const handleLike = async () => {
    if (!user) {
      setError('Please login to like posts');
      return;
    }
    try {
      await axios.post(`http://localhost:5000/api/posts/${id}/like`);
      const response = await axios.get(`http://localhost:5000/api/posts/${id}`);
      setPost(response.data);
    } catch (error) {
      console.error('Error liking post:', error);
      setError('Failed to like post');
    }
  };

  const handleDislike = async () => {
    if (!user) {
      setError('Please login to dislike posts');
      return;
    }
    try {
      await axios.post(`http://localhost:5000/api/posts/${id}/dislike`);
      const response = await axios.get(`http://localhost:5000/api/posts/${id}`);
      setPost(response.data);
    } catch (error) {
      console.error('Error disliking post:', error);
      setError('Failed to dislike post');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please login to comment');
      return;
    }
    if (!newComment.trim()) return;

    setCommentLoading(true);
    try {
      await axios.post(`http://localhost:5000/api/posts/${id}/comments`, {
        content: newComment
      });
      setNewComment('');
      const response = await axios.get(`http://localhost:5000/api/posts/${id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Failed to add comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/posts/${id}/comments/${commentId}/like`);
      setComments(comments.map(c => c._id === commentId ? response.data.comment : c));
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleDislikeComment = async (commentId) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/posts/${id}/comments/${commentId}/dislike`);
      setComments(comments.map(c => c._id === commentId ? response.data.comment : c));
    } catch (error) {
      console.error('Error disliking comment:', error);
    }
  };

  const getTypeEmoji = (type) => {
    switch (type) {
      case 'question': return '❓';
      case 'idea': return '💡';
      case 'discussion': return '💬';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className="loading">
        Loading post...
      </div>
    );
  }

  if (error && !post) {
    return <div className="error">{error}</div>;
  }

  if (!post) {
    return <div className="error">Post not found</div>;
  }

  return (
    <div className="post-detail">
      {/* Post Header */}
      <div className="post-header">
        <div className="post-author">
          <img 
            src={post.author?.avatar || '/default-avatar.png'} 
            alt={post.author?.username} 
            className="author-avatar" 
          />
          <div>
            <div className="author-name">{post.author?.username || 'Unknown User'}</div>
            <div className="post-date">
              {new Date(post.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
        </div>
        <span className={`post-type ${post.type}`}>
          {getTypeEmoji(post.type)} {post.type}
        </span>
      </div>

      {/* Post Content */}
      <h1 className="post-title">{post.title}</h1>
      <div className="post-content">
        {post.content}
      </div>

      {/* Post Footer */}
      <div className="post-footer">
        <div className="post-stats">
          <span className="views">👁 {post.views || 0}</span>
          <span
            className={`likes ${user ? 'clickable' : ''}`}
            onClick={handleLike}
            title={user ? 'Like this post' : 'Login to like'}
          >
            👍 {post.likes?.length || 0}
          </span>
          <span
            className={`dislikes ${user ? 'clickable' : ''}`}
            onClick={handleDislike}
            title={user ? 'Dislike this post' : 'Login to dislike'}
          >
            👎 {post.dislikes?.length || 0}
          </span>
        </div>
        {post.tags && post.tags.length > 0 && (
          <div className="post-tags">
            {post.tags.map(tag => (
              <span key={tag} className="tag">#{tag}</span>
            ))}
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="comments-section">
        <h2>Community Discussion ({comments.length})</h2>
        
        {user ? (
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts... 💭"
              required
              disabled={commentLoading}
            />
            <button 
              type="submit" 
              disabled={commentLoading || !newComment.trim()}
            >
              {commentLoading ? 'Posting...' : 'Post Comment 🚀'}
            </button>
          </form>
        ) : (
          <div className="comment-form" style={{textAlign: 'center', padding: '2rem'}}>
            <p>Please <a href="/login">login</a> to join the discussion</p>
          </div>
        )}

        <div className="comments-list">
          {comments.length === 0 ? (
            <div className="empty-comments">
              <h3>No comments yet</h3>
              <p>Be the first to share your thoughts!</p>
            </div>
          ) : (
            comments.map(comment => (
              <div key={comment._id} className="comment">
                <div className="comment-author">
                  <img 
                    src={comment.author?.avatar || '/default-avatar.png'} 
                    alt={comment.author?.username} 
                    className="author-avatar" 
                  />
                  <div>
                    <div className="author-name">{comment.author?.username || 'Unknown User'}</div>
                    <div className="comment-date">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <p className="comment-content">{comment.content}</p>
                <div className="comment-footer">
                  <span className="comment-time">
                    {new Date(comment.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {user && (
                    <div className="comment-actions">
                      <button title="Like comment">👍</button>
                      <button title="Reply">💬</button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {error && (
        <div className="error" style={{marginTop: '2rem'}}>
          {error}
        </div>
      )}
    </div>
  );
};

export default PostDetail;