import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom'; // Import Outlet, useLocation, and useNavigate
import './Layout.css'; // Import the dedicated Layout CSS file

function Layout() {
  // Get the current location object
  const location = useLocation();
  const navigate = useNavigate(); // Get the navigate function

  const handleCreateClick = () => {
    navigate('/posts/create'); // Navigate to the create post route
  };

  return (
    <div className="app-container">
      {/* Header Area */}
      <div className="app-header">
        Header Area
      </div>

      <div className="app-body">
        {/* Sidebar */}
        <div className="app-sidebar">
          Sidebar Area
        </div>

        {/* Main Content */}
        <div className="app-main">
          {/* Show button only on the main PostList page ('/') */}
          {location.pathname === '/' && (
            <div className="app-tabs">
              {/* Add onClick handler */}
              <button 
                className="create-post-button"
                onClick={handleCreateClick} 
              >
                create post
              </button>
            </div>
          )}
          <div className="app-content">
            {/* Child route content will be rendered here */}
            <Outlet />
          </div>
        </div>

        {/* Right Panel */}
        <div className="app-right">
          Right Side Area (e.g., Trending or Recommended)
        </div>
      </div>
    </div>
  );
}

export default Layout; 