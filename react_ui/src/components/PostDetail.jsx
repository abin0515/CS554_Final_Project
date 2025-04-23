import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import './PostDetail.css'; // Import CSS file

// Placeholder for getting the current user ID - replace with your actual auth logic
const getCurrentUserId = () => {
  // Example: retrieve from local storage, context, etc.
  // IMPORTANT: Replace this with your actual implementation
  return localStorage.getItem('userId') || '2001'; // Replace placeholder ID
};

function PostDetail() {
  const [searchParams] = useSearchParams();
  const postId = searchParams.get('postId');
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // State for the reply form
  const [replyContent, setReplyContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [replyError, setReplyError] = useState(null);
  const [replySuccess, setReplySuccess] = useState(null);

  // State for displaying replies
  const [replies, setReplies] = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(true);
  const [repliesError, setRepliesError] = useState(null);

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

  // --- Fetch Replies --- 
  const fetchReplies = async () => {
    if (!postId) return;
    setRepliesLoading(true);
    setRepliesError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/replies/byPost/${postId}`);
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success && Array.isArray(data.replies)) {
        setReplies(data.replies);
      } else {
          throw new Error(data.error || 'Failed to fetch replies or unexpected format.');
      }
    } catch (e) {
      setRepliesError(e.message);
      console.error("Error fetching replies:", e);
    } finally {
      setRepliesLoading(false);
    }
  };

  // --- End Fetch Replies ---

  // --- Reply Form Handlers ---
  const handleReplyChange = (event) => {
    setReplyContent(event.target.value);
  };

  const handleAnonymityChange = (event) => {
    setIsAnonymous(event.target.checked);
  };

  const handleSubmitReply = async (event) => {
    event.preventDefault(); // Prevent default form submission if wrapped in <form>
    setIsSubmittingReply(true);
    setReplyError(null);
    setReplySuccess(null);

    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
        setReplyError('User not logged in.'); // Or handle appropriately
        setIsSubmittingReply(false);
        return;
    }

    if (replyContent.trim().length === 0) {
        setReplyError('Reply content cannot be empty.');
        setIsSubmittingReply(false);
        return;
    }

    if (replyContent.length > 500) {
        setReplyError('Reply content cannot exceed 500 characters.');
        setIsSubmittingReply(false);
        return;
    }

    const replyData = {
        post_id: postId,
        user_id: currentUserId, // Use the retrieved user ID
        content: replyContent,
        anonymity: isAnonymous,
        parent_reply_id: null, // Direct reply to post
        target_user_id: null   // Direct reply to post
    };

    try {
       console.log('Sending anonymously:', replyData.anonymity);
       const response = await fetch(`${API_BASE_URL}/replies/create`, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
               // Add Authorization header if needed
               // 'Authorization': `Bearer ${your_auth_token}`
           },
           body: JSON.stringify(replyData),
       });

       const result = await response.json();

       if (!response.ok || !result.success) {
           throw new Error(result.error || `Failed to submit reply: ${response.statusText}`);
       }

       setReplySuccess('Reply submitted successfully!');
       setReplyContent(''); 
       setIsAnonymous(false); 
       
       // Add the new reply to the top of the list
       if (result.reply) {
           setReplies(prevReplies => [result.reply, ...prevReplies]);
       }
       
       setPost(prevPost => ({ ...prevPost, reply_times: (prevPost.reply_times || 0) + 1 }));
       // Clear success message after a delay
       setTimeout(() => setReplySuccess(null), 3000);

    } catch (e) {
        setReplyError(`Submit failed: ${e.message}`);
        console.error("Reply submission error:", e);
        // Clear error message after a delay
         setTimeout(() => setReplyError(null), 5000);
    } finally {
        setIsSubmittingReply(false);
    }
  };
  // --- End Reply Form Handlers ---

  // Effect to fetch replies
   useEffect(() => {
    fetchReplies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]); // Fetch replies when postId changes

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
    <>
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
      <div className="post-detail-replies">
        <h2>Add Your Reply</h2>
        <div className="reply-form-container">
          {/* We can use a form tag or just divs/buttons */} 
          <textarea
            className="reply-textarea"
            placeholder="Share your thoughts..."
            value={replyContent}
            onChange={handleReplyChange}
            maxLength={500} // Enforce max length
            disabled={isSubmittingReply}
          />
          <div className="reply-form-footer">
            <div className="reply-char-count">
              {replyContent.length}/500
            </div>
            <div className="reply-options">
              <label className="anonymity-label">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={handleAnonymityChange}
                  disabled={isSubmittingReply}
                />
                Reply anonymously
              </label>
              <button 
                className="submit-reply-button"
                onClick={handleSubmitReply}
                disabled={isSubmittingReply || replyContent.trim().length === 0}
              >
                {isSubmittingReply ? 'Submitting...' : 'Submit Reply'}
              </button>
            </div>
          </div>
           {replyError && <div className="error-message reply-error">{replyError}</div>}
           {replySuccess && <div className="success-message reply-success">{replySuccess}</div>}
        </div>
      </div>
      <div className="post-detail-replies-list">
        <h3>Replies ({replies.length})</h3>
        {repliesLoading && <div>Loading replies...</div>}
        {repliesError && <div className="error-message">Error loading replies: {repliesError}</div>}
        {!repliesLoading && !repliesError && (
            replies.length === 0 
            ? (<div>Be the first to reply!</div>)
            : (replies.map(reply => (
                <div key={reply._id} className="reply-item">
                  <div className="reply-header">
                     <span className="reply-author">
                       {reply.anonymity ? 'Anonymous User' : `User ${reply.user_id}`}
                     </span>
                     <span className="reply-timestamp">
                       {new Date(reply.create_time).toLocaleString()}
                     </span>
                  </div>
                  <div className="reply-content">{reply.content}</div>
                  {/* TODO: Add like/reply buttons for replies */}
                </div>
            )))
        )}
      </div>
    </>
  );
}

export default PostDetail; 