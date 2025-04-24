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

  // ---- State for liked statuses ----
  const [likedStatuses, setLikedStatuses] = useState({}); // { [replyId]: boolean }
  const [likeCounts, setLikeCounts] = useState({}); // { [replyId]: number } - For optimistic updates
  const [isLiking, setIsLiking] = useState({}); // { [replyId]: boolean } - Re-introducing loading state


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
  };

  // --- Fetch Sub-Replies --- (Like count initialization added previously)
  const fetchSubReplies = async (answerId) => {
      if (!postId || !answerId) return;
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
              // --- Initialize like counts for sub-replies ---
              const initialCounts = {};
              data.subReplies.forEach(reply => {
                  initialCounts[reply._id] = reply.liked_times || 0;
                  // TODO: Ideally, also fetch initial *liked status* for the current user here
              });
              setLikeCounts(prevCounts => ({ ...prevCounts, ...initialCounts }));
              // -----------------------------------------------------

              setSubRepliesData(prev => ({
                  ...prev,
                  [answerId]: { loading: false, error: null, list: data.subReplies }
              }));
          } else {
              throw new Error(data.error || 'Failed to fetch sub-replies or unexpected format.');
          }
      } catch (e) {
          console.error(`Error fetching sub-replies for ${answerId}:`, e);
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

  // --- Handle Like/Unlike Toggle (with API Call) ---
  const handleLikeToggle = async (reply) => {
      const replyId = reply._id;
      const currentUserId = getCurrentUserId();

      if (!currentUserId) {
          console.error("User not identified. Cannot like/unlike.");
          // Optionally show an error message to the user
          return;
      }
      if (isLiking[replyId]) {
        console.log("Already processing like/unlike for this reply.");
        return; // Prevent double-clicks
      }

      // Set loading state for this specific button
      setIsLiking(prev => ({ ...prev, [replyId]: true }));

      const isCurrentlyLiked = !!likedStatuses[replyId];
      const newLikedState = !isCurrentlyLiked;
      const originalLikeCount = likeCounts[replyId] ?? (reply.liked_times || 0); // Store original count for rollback

      // Optimistic UI updates
      setLikedStatuses(prev => ({ ...prev, [replyId]: newLikedState }));
      setLikeCounts(prev => ({
        ...prev,
        [replyId]: originalLikeCount + (newLikedState ? 1 : -1)
      }));

      const requestBody = {
          bizId: replyId,
          bizType: 'reply', // Hardcoded as per requirement
          liked: newLikedState,
          // userId: currentUserId // Include userId
      };

      try {
          console.log('Sending like request:', requestBody);
          // Capture the response
          const response = await fetch(`http://localhost:3001/likes`, { // Use your likes endpoint URL
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                   // Add Authorization header if needed
                  // 'Authorization': `Bearer ${your_auth_token}`
              },
              body: JSON.stringify(requestBody),
          });

          // Check if the request was successful (status code 2xx)
          if (!response.ok) {
              // Rollback optimistic updates on failure
              console.error("Like request failed, rolling back UI.", response.status, response.statusText);
              setLikedStatuses(prev => ({ ...prev, [replyId]: isCurrentlyLiked }));
              setLikeCounts(prev => ({ ...prev, [replyId]: originalLikeCount })); // Revert count
              // Throw an error to be caught by the catch block
              throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
          }


          console.log(`Like status updated successfully for reply ${replyId} to ${newLikedState}`);

      } catch (e) {
          console.error("Error toggling like:", e);
          
      } finally {
           // Remove loading state for this specific button
           setIsLiking(prev => ({ ...prev, [replyId]: false }));
      }
  };
  // --- End Handle Like/Unlike Toggle ---

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

  // --- Fetch Replies --- (Like count initialization added previously)
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
        console.log('Fetched replies data:', data.replies);

         // --- Initialize like counts for direct replies ---
         const initialCounts = {};
         data.replies.forEach(reply => {
             initialCounts[reply._id] = reply.liked_times || 0;
             // TODO: Fetch initial liked status for current user here
         });
         setLikeCounts(prevCounts => ({ ...prevCounts, ...initialCounts }));
         // -----------------------------------------------------

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

  // --- Submit Handlers --- (Like count initialization added previously)
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
               // 'Authorization': `Bearer ${your_auth_token}`
           },
           body: JSON.stringify(replyData),
       });

       const result = await response.json();

       if (!response.ok || !result.success) {
           throw new Error(result.error || `Failed to submit reply: ${response.statusText}`);
       }

       setMainReplySuccess('Reply submitted successfully!');

       // Add the new reply to the top of the list
       if (result.reply) {
           // --- Initialize like count for new reply ---
           setLikeCounts(prev => ({...prev, [result.reply._id]: 0}));
           // --------------------------------------------
           setReplies(prevReplies => [result.reply, ...prevReplies]);
       }

       setPost(prevPost => ({ ...prevPost, reply_times: (prevPost.reply_times || 0) + 1 }));
       setTimeout(() => setMainReplySuccess(null), 3000);

    } catch (e) {
        setMainReplyError(`Submit failed: ${e.message}`);
        console.error("Main reply submission error:", e);
         setTimeout(() => setMainReplyError(null), 5000);
    } finally {
        setIsSubmittingMainReply(false);
    }
  };

  const handleSubmitSubReply = async (parentReply, content, isAnonymous) => {
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
        post_id: postId,
        answer_id: parentReply.answer_id === null ? parentReply._id : parentReply.answer_id ,
        user_id: currentUserId,
        content: content,
        anonymity: isAnonymous,
        target_reply_id: parentReply._id,
        target_user_id: parentReply.anonymity ? null : parentReply.user_id,
    };

     try {
        const response = await fetch(`${API_BASE_URL}/replies/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // 'Authorization': `Bearer ${your_auth_token}`
            },
            body: JSON.stringify(replyData),
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'Failed');

        setReplyingToId(null);
        setMainReplySuccess(`Reply to ${parentReply.anonymity ? 'Anonymous User' : `User ${parentReply.user_id}`} submitted!`);

        // Update parent reply's reply_times count in the main replies list
        setReplies(prevReplies => prevReplies.map(r =>
            r._id === parentReply._id
             ? { ...r, reply_times: (r.reply_times || 0) + 1 }
             : r
        ));

        // Update parent reply's reply_times count if it exists within a sub-reply list
        if (parentReply.answer_id !== null) {
            setSubRepliesData(prevData => {
                const parentParentId = parentReply.answer_id;
                if (prevData[parentParentId]?.list) {
                    const updatedList = prevData[parentParentId].list.map(r =>
                        r._id === parentReply._id
                        ? { ...r, reply_times: (r.reply_times || 0) + 1 }
                        : r
                    );
                    return {
                        ...prevData,
                        [parentParentId]: { ...prevData[parentParentId], list: updatedList }
                    };
                }
                return prevData;
            });
        }

        // Add the new sub-reply to the correct sub-reply list
        if (result.reply) {
            // --- Initialize like count for new sub-reply ---
             setLikeCounts(prev => ({...prev, [result.reply._id]: 0}));
             // --------------------------------------------------

            setSubRepliesData(prev => {
                const topLevelParentId = parentReply.answer_id === null ? parentReply._id : parentReply.answer_id;

                if (prev[topLevelParentId]) {
                    return {
                        ...prev,
                        [topLevelParentId]: {
                            ...prev[topLevelParentId],
                            list: [...(prev[topLevelParentId].list || []), result.reply]
                        }
                    };
                }
                return prev;
            });
        }

        setTimeout(() => setMainReplySuccess(null), 3000);

        // No reload needed with optimistic updates

     } catch (e) {
        setMainReplyError(`Sub-reply failed: ${e.message}`);
        console.error("Sub-reply submission error:", e);
        setTimeout(() => setMainReplyError(null), 5000);
     } finally {
         setIsSubmittingMainReply(false);
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
        <ReplyForm
            onSubmit={handleSubmitMainReply}
            isLoading={isSubmittingMainReply}
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

                // ---- Get current like status and count ----
                const isLiked = !!likedStatuses[reply._id];
                const currentLikeCount = likeCounts[reply._id] ?? (reply.liked_times || 0);
                const likeButtonText = isLiked ? 'Liked' : 'Like';
                const isLoadingLike = isLiking[reply._id]; // Use the loading state
                // ------------------------------------------

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
                        {/* ---- Like Button ---- */}
                        <button
                            className={`reply-action-button like-button ${isLiked ? 'liked' : ''}`}
                            title={isLiked ? 'Unlike' : 'Like'}
                            onClick={() => handleLikeToggle(reply)}
                            disabled={isLoadingLike} // Disable while loading
                        >
                            {isLoadingLike ? '...' : likeButtonText} ({currentLikeCount})
                        </button>
                        {/* ----------------------------- */}
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
                                : (subReplyList.map(subReply => { // Map over sub-replies
                                     // ---- Get current like status and count for SUB-REPLY ----
                                    const isSubLiked = !!likedStatuses[subReply._id];
                                    const currentSubLikeCount = likeCounts[subReply._id] ?? (subReply.liked_times || 0);
                                    const subLikeButtonText = isSubLiked ? 'Liked' : 'Like';
                                    const isSubLoadingLike = isLiking[subReply._id]; // Use the loading state
                                    // ----------------------------------------------------------
                                    return (
                                        <div key={subReply._id} className="sub-reply-item">
                                            <div className="reply-header">
                                                <span className="reply-author">
                                                    {subReply.anonymity ? 'Anonymous' : `User ${subReply.user_id}`}
                                                    {subReply.target_reply_id &&
                                                        <> replied to {subReply.target_user_id
                                                                        ? `User ${subReply.target_user_id}`
                                                                        : 'Anonymous User'}
                                                        </>
                                                    }
                                                </span>
                                                <span className="reply-timestamp">
                                                    {new Date(subReply.create_time).toLocaleString()}
                                                </span>
                                            </div>
                                            <div className="reply-content">{subReply.content}</div>
                                            <div className="reply-actions sub-reply-actions">
                                                {/* ---- Sub-Reply Like Button ---- */}
                                                <button
                                                    className={`reply-action-button like-button ${isSubLiked ? 'liked' : ''}`}
                                                    title={isSubLiked ? 'Unlike' : 'Like'}
                                                    onClick={() => handleLikeToggle(subReply)}
                                                    disabled={isSubLoadingLike} // Disable while loading
                                                >
                                                     {isSubLoadingLike ? '...' : subLikeButtonText} ({currentSubLikeCount})
                                                </button>
                                                {/* --------------------------------------- */}
                                                <button
                                                    className="reply-action-button reply-to-reply-button"
                                                    title="Reply to this comment"
                                                    onClick={() => handleToggleReplyForm(subReply._id)}
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
                                    ); // End return for sub-reply map
                                }))
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