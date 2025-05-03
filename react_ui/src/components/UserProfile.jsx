import React from 'react';
import { useAuth } from '../lib/Auth';
import './UserProfile.css';

function UserProfile() {
  const { user } = useAuth();

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
      </div>
    </div>
  );
}

export default UserProfile;
