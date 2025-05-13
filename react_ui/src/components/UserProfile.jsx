import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../lib/Auth';
import { POST_API_BASE_URL } from '../config';
import './UserProfile.css';

function UserProfile() {
  const { user } = useAuth();
  const { userId: routeUserId } = useParams();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isSelfProfile = !routeUserId || (user && routeUserId === user.uid);
  const targetUserId = isSelfProfile ? user?.uid : routeUserId;

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!targetUserId || (!isSelfProfile && !user)) return;

      setLoading(true);
      try {
        const displayRes = await fetch(`${POST_API_BASE_URL}/users/displayName/${targetUserId}`);
        const displayData = await displayRes.json();

        setUserProfile({
          uid: targetUserId,
          displayName: displayData.displayName || 'Anonymous',
          email: isSelfProfile ? user.email : null,
          photoURL: isSelfProfile ? user.photoURL : null
        });
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, routeUserId]);

  if (!user && isSelfProfile) {
    return <p className="user-profile-message">You must be signed in to view your profile.</p>;
  }

  if (loading) return <p className="user-profile-message">Loading profile...</p>;
  if (error) return <p className="error-message">Error: {error}</p>;

  return (
    <div className="user-profile-wrapper">
      <div className="cover-image"></div>
      <div className="user-profile-content">
        <div className="profile-info">
          <img
            src={userProfile.photoURL || '/default-avatar.png'}
            alt="Profile"
            className="profile-picture"
          />
          <div className="profile-details">
            <h2>{userProfile.displayName}</h2>
            {isSelfProfile && <p className="profile-email">{userProfile.email}</p>}
            <p className="profile-role">Community Member at MotherDuckers</p>

            {!isSelfProfile && (
              <Link to={`/chat/${userProfile.uid}`}>
                <button className="chat-button">Chat</button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserProfile;
