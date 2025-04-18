import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { API_BASE_URL } from '../config'; // Import the base URL
import './PostList.css'; // Import the CSS file

function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use the imported base URL and correct endpoint path without /api
        const response = await fetch(`${API_BASE_URL}/posts/page?page=1`); 
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success) {
          setPosts(data.posts);
          console.log(data.posts);
        } else {
          // Use error message from backend if available
          throw new Error(data.error || 'Failed to fetch posts from API');
        }
      } catch (e) {
        setError(e.message);
        console.error("Error fetching posts:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []); // Empty dependency array means this effect runs once on mount

  if (loading) {
    return <div>Loading posts...</div>;
  }

  if (error) {
    return <div className="error-message">Error fetching posts: {error}</div>;
  }

  return (
    <div className="post-list-container">
      <h2 className="post-list-title">Discussion Posts</h2>
      {posts.length > 0 ? (
        posts.map((post) => (
          <div key={post._id} className="post-item">
            <Link to={`/posts/detail?postId=${post._id}`} className="post-title-link">
              <h3 className="post-title">{post.title}</h3>
            </Link>
            <p className="post-content">
              {post.content} 
            </p>
            <div className="post-meta">
              <span>Likes: {post.total_like_times}</span>
              <span>Replies: {post.reply_times}</span>
              <span>Posted on: {new Date(post.create_time).toLocaleDateString()}</span>
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