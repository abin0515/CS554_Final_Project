import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleSignIn from './auth/AuthGoogleButton';
import EmailSignIn from './auth/AuthEmailButton';
import SignOut from './auth/SignOutButton';
import EmailSignUp from './auth/SignUpButton';
import { useAuth } from '../lib/Auth';
import AccountCircleIcon from '@mui/icons-material/AccountCircle'; // MUI profile icon
import "./HeaderBar.css";

function HeaderBar() {
  const { user } = useAuth();
  const authState = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const dropdownRef = useRef();

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalOpen) return;
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [modalOpen]);

  return (
    <div className="app-header">
      <div className="site-title" onClick={() => navigate('/')}>
        <span className="site-title-highlight">Mother</span>Ducker
      </div>

      <div className="auth-info">
        {authState.user ? (
          <>
            <span className="user-greeting">
              Hello {authState.user.displayName || authState.user.email}
            </span>
            <span className="authControls">
              <SignOut />
            </span>
            <button className="profile-button" onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
  <img
    src={user.photoURL || '/default-avatar.png'}
    alt="Profile"
    className="nav-profile-picture"
  />
</button>
          </>
        ) : (
          <>
            <div className="authControls" ref={dropdownRef}>
              <span className="signin-text" onClick={toggleDropdown}>
                Sign In
              </span>
              {dropdownOpen && (
                <div className="auth-dropdown">
                  <GoogleSignIn />
                  <EmailSignIn setModalOpen={setModalOpen} />
                </div>
              )}
            </div>
            <span className="authControls">
              <EmailSignUp />
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export default HeaderBar;
