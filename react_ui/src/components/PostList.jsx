import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { POST_API_BASE_URL } from '../config';
import './PostList.css';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${POST_API_BASE_URL}/posts/page?page=1`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          setPosts(data.posts);
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
  }, []);

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
            <p className="post-snippet">{post.content}</p>
            <div className="post-meta">
              <span><FavoriteIcon fontSize="small" /> {post.total_like_times}</span>
              <span><ChatBubbleIcon fontSize="small" /> {post.reply_times}</span>
              <span><AccessTimeIcon fontSize="small" /> {new Date(post.create_time).toLocaleDateString()}</span>
            </div>
          </div>
        ))
      ) : (
        <div>No posts found.</div>
      )}
    </div>
  );
}

export default PostList;
