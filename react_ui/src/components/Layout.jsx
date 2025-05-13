import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import './Layout.css';
import HeaderBar from './HeaderBar';
import RightSideBar from './right_side_bar/RightSideBar';
import Reccomendations from './reccomendations/Reccomendations';

function Layout() {
  const location = useLocation();

  // Determine if the current page is the profile page
  // Assuming the profile page route is '/profile' or starts with '/profile/'
  const isProfilePage = location.pathname.startsWith('/profile');

  return (
    <>
      <div id="app-background" />
      <div className="app-container">
        <HeaderBar />
        <div className={`app-body ${isProfilePage ? 'profile-view' : ''}`}>
          {!isProfilePage && <div className="app-sidebar"><Reccomendations/></div>}
          <div className={`app-main ${isProfilePage ? 'full-width' : ''}`}>
            {location.pathname === '/' && !isProfilePage && (
              <div className="app-tabs">
                {/* Create Post button removed, now in PostList */}
              </div>
            )}
            <div className="app-content">
              <Outlet />
            </div>
          </div>
          {!isProfilePage && 
            <div className="app-right">
              <RightSideBar />
            </div>
          }
        </div>
      </div>
    </>
  );
}

export default Layout;
