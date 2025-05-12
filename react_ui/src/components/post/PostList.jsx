import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { POST_API_BASE_URL } from '../../config';
import './PostList.css';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${POST_API_BASE_URL}/posts/page?page=${currentPage}`);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          setPosts(data.posts);
          setTotalPages(Math.ceil((data.totalPosts || 0) / 10));
        } else {
          throw new Error(data.error || 'Failed to fetch posts from API');
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [currentPage]);

  if (loading) return <div>Loading posts...</div>;
  if (error) return <div className="error-message">Error fetching posts: {error}</div>;

  return (
    <div className="post-list-container">
      <h2 className="post-list-title">Discussion Feed</h2>
      {posts.length > 0 ? (
        posts.map((post) => (
          <div key={post._id} className="post-card">
            <Link to={`/posts/detail?postId=${post._id}`} className="post-title-link">
              <h3 className="post-title">{post.title}</h3>
            </Link>

            {/* User link */}
            {post.user_id && (
              <p className="post-user">
                Posted by{' '}
                <Link to={`/profile/${post.user_id}`} className="post-user-link">
                  {post.user_display_name || post.user_email || 'Anonymous'}
                </Link>
              </p>
            )}

            <p className="post-snippet">{post.content}</p>
            <div className="post-meta">
              <span><FavoriteIcon fontSize="small" /> {post.total_like_times}</span>
              <span><ChatBubbleIcon fontSize="small" /> {post.reply_times}</span>
              <span><AccessTimeIcon fontSize="small" /> {new Date(post.create_time).toLocaleDateString()}</span>
            </div>
          </div>
        ))
      ) : (
        !loading && !error && <div>No posts found.</div>
      )}
      {totalPages > 0 && (
        <div className="pagination-controls">
          <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default PostList;
