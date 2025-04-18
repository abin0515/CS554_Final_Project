import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import './PostDetail.css'; // Import CSS file

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

  // Construct full image URLs if paths are relative
  const getImageFullUrl = (relativePath) => {
    // Check if it's already an absolute URL (http/https)
    if (relativePath.startsWith('http')) {
      return relativePath;
    } 
    // Otherwise, prepend the API base URL (ensure no double slashes)
    return `${API_BASE_URL.replace(/\/$/, '')}/${relativePath.replace(/^\//, '')}`;
  };

  return (
    <div className="post-detail-container"> 
      <h1 className="post-detail-title">{post.title}</h1>
      
      {/* Render image gallery if image_urls exist and is an array */}
      {Array.isArray(post.image_urls) && post.image_urls.length > 0 && (
        <div className="post-detail-image-gallery">
          {post.image_urls.map((url, index) => (
            <img 
              key={index} 
              // Assuming the stored URL is relative like '/uploads/posts/...'
              // If already absolute, this function handles it.
              src={getImageFullUrl(url)} 
              alt={`${post.title} - Image ${index + 1}`} 
              className="post-detail-image" 
            />
          ))}
        </div>
      )}

      {/* Render single image if only image_url exists (for backward compatibility?) */}
      {/* You might remove this block if all posts will have image_urls */}
      {/* {!Array.isArray(post.image_urls) && post.image_url && (
        <img 
          src={getImageFullUrl(post.image_url)} 
          alt={post.title} 
          className="post-detail-image" 
        />
      )} */}

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