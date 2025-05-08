import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import './Layout.css';
import HeaderBar from './HeaderBar';
import Leaderboard from './Leaderboard';

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine if the current page is the profile page
  // Assuming the profile page route is '/profile' or starts with '/profile/'
  const isProfilePage = location.pathname.startsWith('/profile');

  const handleCreateClick = () => {
    navigate('/posts/create');
  };

  return (
    <>
      <div id="app-background" />
      <div className="app-container">
        <HeaderBar />
        <div className={`app-body ${isProfilePage ? 'profile-view' : ''}`}>
          {!isProfilePage && <div className="app-sidebar">Sidebar Area</div>}
          <div className={`app-main ${isProfilePage ? 'full-width' : ''}`}>
            {location.pathname === '/' && !isProfilePage && (
              <div className="app-tabs">
                <button className="create-post-button" onClick={handleCreateClick}>
                  Create Post
                </button>
              </div>
            )}
            <div className="app-content">
              <Outlet />
            </div>
          </div>
          {!isProfilePage && 
            <div className="app-right">
              <Leaderboard />
            </div>
          }
        </div>
      </div>
    </>
  );
}

export default Layout;
