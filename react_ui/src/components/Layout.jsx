import React from 'react';
import { Outlet, useLocation } from 'react-router-dom'; // Import Outlet and useLocation
import '../App.css'; // Assuming App.css contains layout styles

function Layout() {
  // Get the current location object
  const location = useLocation();

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
          {/* Conditionally render tabs based on pathname */}
          {location.pathname !== '/posts/detail' && (
            <div className="app-tabs">
              Tabs Area
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