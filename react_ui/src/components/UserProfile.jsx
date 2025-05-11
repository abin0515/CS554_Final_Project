import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/Auth';
import { POST_API_BASE_URL } from '../config';
import './UserProfile.css';

function UserProfile() {
  const { user } = useAuth();
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!user) return;
      setLoadingPosts(true);
      try {
        const token = await user.getIdToken();
        const response = await fetch(`${POST_API_BASE_URL}/posts/user/${user.uid}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch posts: ${response.status}`);
        }
        const data = await response.json();
        setUserPosts(data.posts || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchUserPosts();
  }, [user]);

  if (!user) {
    return <p className="user-profile-message">You must be signed in to view your profile.</p>;
  }

  return (
    <div className="user-profile-wrapper">
      <div className="cover-image"></div>
      <div className="user-profile-content">
        <div className="profile-info">
          <img
            src={user.photoURL || '/default-avatar.png'}
            alt="Profile"
            className="profile-picture"
          />
          <div className="profile-details">
            <h2>{user.displayName || 'Anonymous'}</h2>
            <p className="profile-email">{user.email}</p>
            <p className="profile-role">Community Member at MotherDuckers</p>
          </div>
        </div>

        <div className="user-stats-section">
          <div className="stat-box chat">
            <p className="stat-label">Chat</p>
            <button className="chat-button">Open Chat</button>
          </div>
          <div className="stat-box score">
            <p className="stat-label">Reputation</p>
            <p className="stat-value">4.5 ★</p>
          </div>
        </div>

        <div className="user-posts-section">
          <h3>Your Posts</h3>
          {loadingPosts ? (
            <p>Loading posts...</p>
          ) : error ? (
            <p className="error-message">Error: {error}</p>
          ) : userPosts.length === 0 ? (
            <p>You haven't posted anything yet.</p>
          ) : (
            <ul className="user-post-list">
              {userPosts.map((post) => (
                <li key={post._id} className="user-post-item">
                  <Link to={`/posts/detail?postId=${post._id}`} className="post-title-link">
                    <strong>{post.title}</strong>
                  </Link>
                  <p>{post.content}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
