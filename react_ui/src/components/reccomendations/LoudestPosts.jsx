import React, { useState, useEffect } from 'react';
import { POST_API_BASE_URL } from '../../config';
import { Link } from 'react-router-dom';

import FavoriteIcon from '@mui/icons-material/Favorite';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

function LoudestPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${POST_API_BASE_URL}/posts/loudest`);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP error! status: ${response.status}`);
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

  return (<ul>
    {posts.map((post, i)=>{
        return <li key={i}>
            <Link to={`/posts/detail?postId=${post._id}`}><h5>{post.title}</h5></Link>
            <Link to={`/profile/${post.user_id}`}><p>{post.user_display_name || post.user_email}</p></Link>
            <div className="post-meta">
              <span><FavoriteIcon fontSize="small" /> {post.total_like_times}</span>
              <span><ChatBubbleIcon fontSize="small" /> {post.reply_times}</span>
              <span><AccessTimeIcon fontSize="small" /> {new Date(post.create_time).toLocaleDateString()}</span>
            </div>
        </li>
    })}
  </ul>);
}

export default LoudestPosts

