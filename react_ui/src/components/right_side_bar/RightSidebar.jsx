import React, { useState } from 'react';
import CheckinCalendar from './CheckinCalendar';
import Leaderboard from './Leaderboard';
import './RightSidebar.css'; // We can create this file for styling if needed

const RightSideBar = () => {
  const [leaderboardRefreshKey, setLeaderboardRefreshKey] = useState(0);

  const handleSuccessfulCheckin = () => {
    setLeaderboardRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <div className="right-sidebar">
      <CheckinCalendar onCheckinSuccess={handleSuccessfulCheckin} />
      <Leaderboard refreshKey={leaderboardRefreshKey} />
    </div>
  );
};

export default RightSideBar; 