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

// Reusable Reply Form Component (Optional but good practice)
// You could move this to a separate file later
const ReplyForm = ({
    onSubmit,
    
    parentReplyAuthor, // Display 'Replying to X'
    isLoading,
    initialContent = '',
    initialAnonymous = false,
    submitButtonText = 'Submit Reply',
    
}) => {
    const [content, setContent] = useState(initialContent);
    const [isAnonymous, setIsAnonymous] = useState(initialAnonymous);
    const [error, setError] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(null);
        if (content.trim().length === 0) {
            setError('Reply content cannot be empty.');
            return;
        }
        if (content.length > 500) {
            setError('Reply content cannot exceed 500 characters.');
            return;
        }
        // Pass content and anonymity state back up to the parent handler
        onSubmit(content, isAnonymous);
    };

    return (
        <div className="reply-form-container sub-reply-form-container">
            <textarea
              className="reply-textarea"
              placeholder={parentReplyAuthor ? `Replying to ${parentReplyAuthor}...` : "Share your thoughts..."}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              disabled={isLoading}
              rows={3} // Make sub-reply box smaller initially
            />
            <div className="reply-form-footer">
              <div className="reply-char-count">
                {content.length}/500
              </div>
              <div className="reply-options">
                <label className="anonymity-label">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    disabled={isLoading}
                  />
                  Reply anonymously
                </label>
                {/* {onCancel && ( // Only show Cancel for sub-replies
                    <button
                        type="button"
                        className="cancel-reply-button"
                        onClick={onCancel}
                        disabled={isLoading}
                    >
                       {cancelButtonText}
                    </button>
                )} */}
                <button
                  type="button" // Use type="button" to prevent default form submission if wrapped in <form>
                  className="submit-reply-button"
                  onClick={handleSubmit}
                  disabled={isLoading || content.trim().length === 0}
                >
                  {isLoading ? 'Submitting...' : submitButtonText}
                </button>
              </div>
            </div>
             {error && <div className="error-message reply-error">{error}</div>}
             {/* Success message handled by parent component */}
        </div>
    );
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

  // State for the MAIN reply form (replying directly to post)
 
  const [isSubmittingMainReply, setIsSubmittingMainReply] = useState(false);
  const [mainReplyError, setMainReplyError] = useState(null);
  const [mainReplySuccess, setMainReplySuccess] = useState(null);

  // State for displaying replies
  const [replies, setReplies] = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(true);
  const [repliesError, setRepliesError] = useState(null);

  // State for SUB-REPLY form (replying to a specific reply)
  const [replyingToId, setReplyingToId] = useState(null); // ID of the reply being replied to


  // State for showing/hiding and storing sub-replies
  const [visibleSubRepliesId, setVisibleSubRepliesId] = useState(null); // ID of the direct reply whose sub-replies are visible
  const [subRepliesData, setSubRepliesData] = useState({}); // Stores { [parentReplyId]: { loading, error, list } }

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

  // --- Toggle Sub-Reply Form ---
  const handleToggleReplyForm = (replyId) => {
      setReplyingToId(currentId => (currentId === replyId ? null : replyId));
      // Reset main form messages if user interacts with sub-reply
      setMainReplyError(null);
      setMainReplySuccess(null);
      // Close sub-reply list if opening form for same reply
      // setVisibleSubRepliesId(null); // Optional: Decide if opening reply form should hide sub-replies
  };

  // --- Fetch Sub-Replies --- 
  const fetchSubReplies = async (answerId) => {
      if (!postId || !answerId) return;
      // Set loading state specifically for this answerId
      setSubRepliesData(prev => ({ 
          ...prev, 
          [answerId]: { loading: true, error: null, list: prev[answerId]?.list || [] } 
      }));

      try {
          const response = await fetch(`${API_BASE_URL}/replies/subReplies/${postId}/${answerId}`);
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          if (data.success && Array.isArray(data.subReplies)) {
              // Update state with fetched sub-replies
              setSubRepliesData(prev => ({ 
                  ...prev, 
                  [answerId]: { loading: false, error: null, list: data.subReplies } 
              }));
          } else {
              throw new Error(data.error || 'Failed to fetch sub-replies or unexpected format.');
          }
      } catch (e) {
          console.error(`Error fetching sub-replies for ${answerId}:`, e);
          // Update state with error
          setSubRepliesData(prev => ({ 
              ...prev, 
              [answerId]: { loading: false, error: e.message, list: [] } 
          }));
      }
  };
  // --- End Fetch Sub-Replies ---

  // --- Toggle Sub-Replies Visibility ---
  const handleToggleSubReplies = (directReplyId) => {
      const isCurrentlyVisible = visibleSubRepliesId === directReplyId;
      
      if (isCurrentlyVisible) {
          setVisibleSubRepliesId(null); // Hide
      } else {
          setVisibleSubRepliesId(directReplyId); // Show
          // Fetch if not already loaded or loading
          if (!subRepliesData[directReplyId]?.list && !subRepliesData[directReplyId]?.loading) {
              fetchSubReplies(directReplyId);
          }
          // Close any open reply forms when showing sub-replies
          setReplyingToId(null);
      }
  };
  // --- End Toggle Sub-Replies Visibility ---

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
        console.log('Fetched replies data:', data.replies); // Log the received replies array
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

  // --- Submit Handlers ---

  // Handles submitting the MAIN reply (direct to post)
  const handleSubmitMainReply = async (content, isAnonymous) => {
    setIsSubmittingMainReply(true);
    setMainReplyError(null);
    setMainReplySuccess(null);
    setReplyingToId(null); // Close any open sub-reply forms

    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
        setMainReplyError('User not logged in.'); // Or handle appropriately
        setIsSubmittingMainReply(false);
        return;
    }

    const replyData = {
        post_id: postId,
        answer_id: null,
        user_id: currentUserId,
        content: content,
        anonymity: isAnonymous,
        target_reply_id: null, // Direct reply to post
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

       setMainReplySuccess('Reply submitted successfully!');
       // setMainReplyContent(''); // No longer needed
       // setMainReplyIsAnonymous(false); // No longer needed
       
       // Add the new reply to the top of the list
       if (result.reply) {
           setReplies(prevReplies => [result.reply, ...prevReplies]);
       }
       
       setPost(prevPost => ({ ...prevPost, reply_times: (prevPost.reply_times || 0) + 1 }));
       // Clear success message after a delay
       setTimeout(() => setMainReplySuccess(null), 3000);

    } catch (e) {
        setMainReplyError(`Submit failed: ${e.message}`);
        console.error("Main reply submission error:", e);
        // Clear error message after a delay
         setTimeout(() => setMainReplyError(null), 5000);
    } finally {
        setIsSubmittingMainReply(false);
    }
  };

  // Handles submitting a SUB-REPLY (reply to another reply)
  const handleSubmitSubReply = async (parentReply, content, isAnonymous) => {
    // Note: We might want separate loading state for sub-replies later
    setIsSubmittingMainReply(true); // Reuse main loading state for now
    setMainReplyError(null); // Clear main messages
    setMainReplySuccess(null);

    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
        setMainReplyError('User not logged in.'); // Or handle appropriately
        setIsSubmittingMainReply(false);
        return;
    }

    const replyData = {
        post_id: postId, // Belongs to the same post
        answer_id: parentReply.answer_id === null ? parentReply._id : parentReply.answer_id , // ID of the top-level answer reply
        user_id: currentUserId,
        content: content,
        anonymity: isAnonymous,
        target_reply_id: parentReply._id, // ID of the reply being replied to
        target_user_id: parentReply.anonymity ? null : parentReply.user_id, // ID of the user being replied to
    };

     try {
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
        if (!response.ok || !result.success) throw new Error(result.error || 'Failed');

        // Sub-reply submitted successfully!
        setReplyingToId(null); // Close the form
        setMainReplySuccess(`Reply to ${parentReply.anonymity ? 'Anonymous User' : `User ${parentReply.user_id}`} submitted!`); // Show success in main area

        // IMPORTANT: We are NOT adding the sub-reply to the top-level 'replies' state here.
        // We need to update the parent reply's reply_times count instead.
        setReplies(prevReplies => prevReplies.map(r => 
            r._id === parentReply._id 
             ? { ...r, reply_times: (r.reply_times || 0) + 1 } 
             : r
        ));

        // Always update the stored sub-reply data if it exists, regardless of visibility
        if (result.reply) {
            setSubRepliesData(prev => {
                const parentId = parentReply._id;
                if (prev[parentId]) { // Only update if we have data loaded for this parent
                    return {
                        ...prev,
                        [parentId]: {
                            ...prev[parentId],
                            // Add the new reply, maintaining sort order (oldest first)
                            list: [...(prev[parentId].list || []), result.reply] 
                        }
                    };
                }
                return prev; // Otherwise, don't change the state
            });
        }

        setTimeout(() => setMainReplySuccess(null), 3000);

        // Force a full page reload after successful sub-reply submission
        window.location.reload();

     } catch (e) {
        setMainReplyError(`Sub-reply failed: ${e.message}`);
        console.error("Sub-reply submission error:", e);
        setTimeout(() => setMainReplyError(null), 5000);
     } finally {
         setIsSubmittingMainReply(false); // Reuse main loading state
     }
  };

  // --- End Submit Handlers ---

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

  // Filter replies before rendering
  const directReplies = replies.filter(reply => reply.answer_id === null);

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
        {/* Using the reusable component for the main form */}
        <ReplyForm
            onSubmit={handleSubmitMainReply}
            isLoading={isSubmittingMainReply}
            // We could add state for mainReplyContent back if needed,
            // or let ReplyForm manage its own internal state completely.
            // For now, assume ReplyForm manages its state.
        />
         {mainReplyError && <div className="error-message reply-error">{mainReplyError}</div>}
         {mainReplySuccess && <div className="success-message reply-success">{mainReplySuccess}</div>}
      </div>
      <div className="post-detail-replies-list">
        <h3>Direct Replies ({directReplies.length})</h3>
        {repliesLoading && <div>Loading replies...</div>}
        {repliesError && <div className="error-message">Error loading replies: {repliesError}</div>}
        {!repliesLoading && !repliesError && (
            directReplies.length === 0 
            ? (<div>Be the first to reply!</div>)
            : (directReplies.map(reply => { // Start of map for direct replies
                const isSubRepliesVisible = visibleSubRepliesId === reply._id;
                const currentSubReplyData = subRepliesData[reply._id];
                const subReplyList = currentSubReplyData?.list || [];
                const isLoadingSubReplies = currentSubReplyData?.loading;
                const subReplyError = currentSubReplyData?.error;
            
                return (
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
                    <div className="reply-actions">
                        <button className="reply-action-button like-button" title="Like">
                            Like ({reply.liked_times || 0})
                        </button>
                        <button 
                            className="reply-action-button show-replies-button"
                            title={isSubRepliesVisible ? "Hide Replies" : "Show Replies"}
                            onClick={() => handleToggleSubReplies(reply._id)}
                            disabled={isLoadingSubReplies} // Disable while loading sub-replies
                        >
                            {isLoadingSubReplies 
                                ? "Loading..." 
                                : isSubRepliesVisible 
                                    ? "Hide Replies" 
                                    : `Show (${reply.reply_times || 0}) Replies`}
                        </button>
                        <button
                            className="reply-action-button reply-to-reply-button"
                            title="Reply to this comment"
                            onClick={() => handleToggleReplyForm(reply._id)}
                        >
                            Reply
                        </button>
                    </div>

                    {/* Conditionally render the Sub-Reply Form */} 
                    {replyingToId === reply._id && (
                        <ReplyForm
                            onSubmit={(content, isAnonymous) => handleSubmitSubReply(reply, content, isAnonymous)}
                            onCancel={() => setReplyingToId(null)} 
                            parentReplyAuthor={reply.anonymity ? 'Anonymous User' : `User ${reply.user_id}`}
                            isLoading={isSubmittingMainReply} 
                            submitButtonText="Submit Reply"
                        />
                    )}

                    {/* Conditionally render the Sub-Replies List */} 
                    {isSubRepliesVisible && (
                        <div className="sub-replies-container">
                            {isLoadingSubReplies && <div>Loading sub-replies...</div>}
                            {subReplyError && <div className="error-message">Failed to load: {subReplyError}</div>}
                            {!isLoadingSubReplies && !subReplyError && (
                                subReplyList.length === 0
                                ? (<div className="no-sub-replies">No sub-replies yet.</div>)
                                : (subReplyList.map(subReply => (
                                    <div key={subReply._id} className="sub-reply-item">
                                        <div className="reply-header">
                                            <span className="reply-author">
                                                {subReply.anonymity ? 'Anonymous' : `User ${subReply.user_id}`}
                                                {/* Show who they replied to, based on target_user_id */}
                                                {subReply.target_reply_id && // Check if it's replying to a specific reply ID
                                                    <> replied to {subReply.target_user_id 
                                                                    ? `User ${subReply.target_user_id}` // Display target user ID if available
                                                                    : 'Anonymous User'}             {/* Otherwise assume target was anonymous */}
                                                    </>
                                                }
                                            </span>
                                            <span className="reply-timestamp">
                                                {new Date(subReply.create_time).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="reply-content">{subReply.content}</div>
                                        {/* Add actions for sub-replies */}
                                        <div className="reply-actions sub-reply-actions">
                                            <button className="reply-action-button like-button" title="Like">
                                                Like ({subReply.liked_times || 0})
                                            </button>
                                            <button
                                                className="reply-action-button reply-to-reply-button"
                                                title="Reply to this comment"
                                                onClick={() => handleToggleReplyForm(subReply._id)} // Toggle form for this sub-reply
                                            >
                                                Reply
                                            </button>
                                        </div>
                                        {/* Conditionally render the Reply Form for this sub-reply */} 
                                        {replyingToId === subReply._id && (
                                            <ReplyForm
                                                onSubmit={(content, isAnonymous) => handleSubmitSubReply(subReply, content, isAnonymous)} // Pass subReply as parentReply
                                                onCancel={() => setReplyingToId(null)} 
                                                parentReplyAuthor={subReply.anonymity ? 'Anonymous User' : `User ${subReply.user_id}`} 
                                                isLoading={isSubmittingMainReply} 
                                                submitButtonText="Submit Reply" // Keep button text simple
                                            />
                                        )}
                                    </div>
                                )))
                            )}
                        </div>
                    )}
                    </div>
                ); // End return for direct reply map
            })) // End map over directReplies
        )} 
      </div>
    </>
  );
}

export default PostDetail; 