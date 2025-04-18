import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import './PostDetail.css'; // Import CSS file

function PostDetail() {
  const [searchParams] = useSearchParams();
  const postId = searchParams.get('postId');
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const handleBack = () => {
    navigate(-1);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(prev => !prev);
  };

  const handleEdit = () => {
    navigate(`/posts/edit?postId=${postId}`);
    setIsDropdownOpen(false);
  };

  const handleDelete = async () => {
    setIsDropdownOpen(false);
    if (window.confirm('Are you sure you want to delete this post and all its associated images?')) {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/posts/removePost?postId=${postId}`, {
          method: 'DELETE',
        });
        
        const result = await response.json();
        
        if (!response.ok || !result.success) {
            throw new Error(result.error || `Failed to delete post: ${response.statusText}`);
        }

        console.log('Post deleted successfully', result.message);
        navigate('/');

      } catch (e) {
        setError(`Delete failed: ${e.message}`);
        console.error("Delete error:", e);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        if (!event.target.closest('.more-options-button')) {
           setIsDropdownOpen(false);
        }
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (!postId) {
      setError('No post ID provided.');
      setLoading(false);
      return;
    }

    const fetchPostDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/posts/detail?postId=${postId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setPost(data.post || data);
      } catch (e) {
        setError(e.message);
        console.error("Error fetching post details:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetail();
  }, [postId]);

  if (loading) {
    return <div>Loading post details...</div>;
  }

  if (error) {
    return <div className="error-message">Error: {error}</div>;
  }

  if (!post) {
    return <div>Post not found.</div>;
  }

  const getImageFullUrl = (relativePath) => {
    if (relativePath.startsWith('http')) {
      return relativePath;
    } 
    return `${API_BASE_URL.replace(/\/$/, '')}/${relativePath.replace(/^\//, '')}`;
  };

  return (
    <div className="post-detail-container"> 
      <div className="post-detail-top-actions">
        <button onClick={handleBack} className="back-button" title="Go Back">
          &lt;
        </button>
        <div className="more-options-container">
          <button 
            onClick={toggleDropdown} 
            className="more-options-button" 
            title="More Options"
          >
            &#8943;
          </button>
          {isDropdownOpen && (
            <div className="options-dropdown" ref={dropdownRef}>
              <button onClick={handleEdit} className="dropdown-button edit-button">
                Edit
              </button>
              <button onClick={handleDelete} className="dropdown-button delete-button">
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <h1 className="post-detail-title">{post.title}</h1>
      
      {Array.isArray(post.image_urls) && post.image_urls.length > 0 && (
        <div className="post-detail-image-gallery">
          {post.image_urls.map((url, index) => (
            <img 
              key={index} 
              src={getImageFullUrl(url)} 
              alt={`${post.title} - Image ${index + 1}`} 
              className="post-detail-image" 
            />
          ))}
        </div>
      )}

      <div className="post-detail-content">{post.content}</div>
      <div className="post-detail-meta">
        <span>Likes: {post.total_like_times}</span>
        <span>Replies: {post.reply_times}</span>
        <span>Created: {new Date(post.create_time).toLocaleString()}</span>
        <span>Updated: {new Date(post.update_time).toLocaleString()}</span>
      </div>
    </div>
  );
}

export default PostDetail; 