import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';

function PostDetail() {
  const [searchParams] = useSearchParams();
  const postId = searchParams.get('postId');
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        // Assuming the direct response is the post object or { post: postObject }
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
    // Use a specific class for styling errors
    return <div className="error-message">Error: {error}</div>;
  }

  if (!post) {
    return <div>Post not found.</div>;
  }

  return (
    <div className="post-detail-container"> 
      <h1 className="post-detail-title">{post.title}</h1>
      {post.image_url && 
        <img src={post.image_url} alt={post.title} className="post-detail-image" />
      }
      <div className="post-detail-content">{post.content}</div>
      <div className="post-detail-meta">
        <span>Likes: {post.total_like_times}</span>
        <span>Replies: {post.reply_times}</span>
        <span>Created: {new Date(post.create_time).toLocaleString()}</span>
        <span>Updated: {new Date(post.update_time).toLocaleString()}</span>
      </div>
      {/* Add comments/replies section here later */}
    </div>
  );
}

export default PostDetail; 