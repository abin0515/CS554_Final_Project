import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import './Layout.css';
import HeaderBar from './HeaderBar';

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleCreateClick = () => {
    navigate('/posts/create');
  };

  return (
    <>
      <div id="app-background" />
      <div className="app-container">
        <HeaderBar />
        <div className="app-body">
          <div className="app-sidebar">Sidebar Area</div>
          <div className="app-main">
            {location.pathname === '/' && (
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
          <div className="app-right">Right Side Area (e.g., Trending or Recommended)</div>
        </div>
      </div>
    </>
  );
}

export default Layout;
