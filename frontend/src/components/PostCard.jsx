import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './PostCard.css';

const PostCard = ({ post, onUpdate }) => {
  const { user, getFullAvatarUrl } = useAuth();
  const [likes, setLikes] = useState(post.likes.length);
  const [dislikes, setDislikes] = useState(post.dislikes.length);
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: post.title,
    content: post.content,
    type: post.type,
    tags: post.tags.join(', ')
  });
  const [editLoading, setEditLoading] = useState(false);
  const commentInputRef = useRef(null);

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments]);

  const fetchComments = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/posts/${post._id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async () => {
    if (!user || loading) return;
    setLoading(true);
    try {
      const response = await axios.post(`http://localhost:5000/api/posts/${post._id}/like`);
      setLikes(response.data.post.likes.length);
      setDislikes(response.data.post.dislikes.length);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDislike = async () => {
    if (!user || loading) return;
    setLoading(true);
    try {
      const response = await axios.post(`http://localhost:5000/api/posts/${post._id}/dislike`);
      setLikes(response.data.post.likes.length);
      setDislikes(response.data.post.dislikes.length);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error disliking post:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      await axios.post(`http://localhost:5000/api/posts/${post._id}/comments`, {
        content: newComment
      });
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleLikeComment = async (commentId) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/posts/${post._id}/comments/${commentId}/like`);
      setComments(comments.map(c => c._id === commentId ? response.data.comment : c));
    } catch (error) {
      console.error('Error liking comment:', error);
    }
  };

  const handleDislikeComment = async (commentId) => {
    try {
      const response = await axios.post(`http://localhost:5000/api/posts/${post._id}/comments/${commentId}/dislike`);
      setComments(comments.map(c => c._id === commentId ? response.data.comment : c));
    } catch (error) {
      console.error('Error disliking comment:', error);
    }
  };

  const handleEditComment = async (commentId, newContent) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/posts/${post._id}/comments/${commentId}`, {
        content: newContent
      });
      setComments(comments.map(c => c._id === commentId ? response.data.comment : c));
    } catch (error) {
      console.error('Error editing comment:', error);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    try {
      const tags = editForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      const response = await axios.put(`http://localhost:5000/api/posts/${post._id}`, {
        title: editForm.title,
        content: editForm.content,
        type: editForm.type,
        tags
      });
      // Update the post data
      if (onUpdate) onUpdate();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating post:', error);
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

  const isOwnPost = user && user._id === post.author._id;

  return (
    <div className="post-card" data-type={post.type}>
      <div className="post-header">
        <div className="post-author">
          <img src={getFullAvatarUrl(post.author.avatar)} alt={post.author.username} className="author-avatar" />
          <div className="author-info">
            <span className="author-name">{post.author.username}</span>
            {post.author.bio && <p className="author-bio">{post.author.bio}</p>}
          </div>
        </div>
        <div className="post-header-actions">
          <span className={`post-type ${post.type}`}>{post.type}</span>
          {isOwnPost && (
            <button onClick={() => setIsEditing(!isEditing)} className="edit-post-btn">
              {isEditing ? 'Cancel' : '✏️ Edit'}
            </button>
          )}
        </div>
      </div>
      {isEditing ? (
        <form onSubmit={handleEditSubmit} className="edit-post-form">
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              name="title"
              value={editForm.title}
              onChange={handleEditChange}
              required
              maxLength="200"
            />
            <div className="char-count">{editForm.title.length}/200</div>
          </div>
          <div className="form-group">
            <label>Type</label>
            <select name="type" value={editForm.type} onChange={handleEditChange}>
              <option value="question">Question</option>
              <option value="idea">Idea</option>
              <option value="discussion">Discussion</option>
            </select>
          </div>
          <div className="form-group">
            <label>Content</label>
            <textarea
              name="content"
              value={editForm.content}
              onChange={handleEditChange}
              required
              maxLength="10000"
              rows="4"
            />
            <div className="char-count">{editForm.content.length}/10000</div>
          </div>
          <div className="form-group">
            <label>Tags (comma separated)</label>
            <input
              type="text"
              name="tags"
              value={editForm.tags}
              onChange={handleEditChange}
              placeholder="tag1, tag2, tag3"
            />
          </div>
          <div className="edit-form-actions">
            <button type="submit" disabled={editLoading}>
              {editLoading ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </form>
      ) : (
        <>
          <h3 className="post-title">
            <Link to={`/post/${post._id}`}>{post.title}</Link>
          </h3>
          <p className="post-content">{post.content}</p>
          <div className="post-footer">
            <div className="post-stats">
              <span className="views">👁 {post.views}</span>
              <span className="likes" onClick={handleLike} style={{ cursor: user ? 'pointer' : 'default' }}>👍 {likes}</span>
              <span className="dislikes" onClick={handleDislike} style={{ cursor: user ? 'pointer' : 'default' }}>👎 {dislikes}</span>
              <button onClick={() => {
                const willShow = !showComments;
                setShowComments(willShow);
                // Focus the comment input when opening comments
                if (willShow) {
                  setTimeout(() => {
                    if (commentInputRef.current) {
                      commentInputRef.current.focus();
                    }
                  }, 100);
                }
              }} className="comments-btn">💬 {comments.length}</button>
            </div>
            <div className="post-tags">
              {post.tags.map(tag => (
                <span key={tag} className="tag">#{tag}</span>
              ))}
            </div>
          </div>
          {showComments && (
            <div className="comments-section">
              {user ? (
                <form onSubmit={handleCommentSubmit} className="comment-form">
                  <textarea
                    ref={commentInputRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="comment-input"
                  />
                  <button type="submit" className="comment-submit-btn">Post Comment</button>
                </form>
              ) : (
                <div className="comment-form" style={{textAlign: 'center', padding: '2rem'}}>
                  <p>Please <a href="/login">login</a> to join the discussion</p>
                </div>
              )}
              <div className="comments-list">
                {comments.map(comment => (
                  <CommentItem
                    key={comment._id}
                    comment={comment}
                    user={user}
                    onLike={handleLikeComment}
                    onDislike={handleDislikeComment}
                    onEdit={handleEditComment}
                    getFullAvatarUrl={getFullAvatarUrl}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const CommentItem = ({ comment, user, onLike, onDislike, onEdit, getFullAvatarUrl }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const handleSaveEdit = () => {
    onEdit(comment._id, editContent);
    setIsEditing(false);
  };

  return (
    <div className="comment">
      <div className="comment-header">
        <img src={getFullAvatarUrl(comment.author?.avatar)} alt={comment.author?.username || 'Unknown'} className="comment-author-avatar" />
        <span className="comment-author-name">{comment.author?.username || 'Unknown'}</span>
        <span className="comment-date">{new Date(comment.createdAt).toLocaleDateString()}</span>
      </div>
      {isEditing ? (
        <div className="comment-edit">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="comment-edit-input"
          />
          <div className="comment-edit-actions">
            <button onClick={handleSaveEdit} className="save-btn">Save</button>
            <button onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
          </div>
        </div>
      ) : (
        <p className="comment-content">{comment.content}</p>
      )}
      <div className="comment-actions">
        <button onClick={() => onLike(comment._id)} className="comment-action-btn">👍 {comment.likes?.length || 0}</button>
        <button onClick={() => onDislike(comment._id)} className="comment-action-btn">👎 {comment.dislikes?.length || 0}</button>
        {user && user._id === comment.author?._id && (
          <button onClick={() => setIsEditing(true)} className="comment-action-btn edit-btn">✏️ Edit</button>
        )}
      </div>
    </div>
  );
};

export default PostCard;
