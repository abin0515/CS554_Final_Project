import React, { useState } from 'react';
import CheckinCalendar from './CheckinCalendar';
import Leaderboard from './Leaderboard';
import './RightSidebar.css'; // We can create this file for styling if needed

const RightSidebar = () => {
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0);

  console.log('[RightSidebar] Current leaderboardRefreshKey:', leaderboardRefreshKey);

  const handleSuccessfulCheckin = () => {
    console.log('[RightSidebar] handleSuccessfulCheckin called');
    setLeaderboardRefreshKey(prevKey => {
      const newKey = prevKey + 1;
      console.log('[RightSidebar] Updating leaderboardRefreshKey to:', newKey);
      return newKey;
    });
  };

  console.log('[RightSidebar] Rendering children with props:', {
    onCheckinSuccessPassed: typeof handleSuccessfulCheckin,
    leaderboardRefreshKeyPassed: leaderboardRefreshKey
  });

  return (
    <div className="right-sidebar">
      <Leaderboard refreshKey={leaderboardRefreshKey} />
      <CheckinCalendar onCheckinSuccess={handleSuccessfulCheckin} />
      
    </div>
  );
};

export default RightSidebar; 