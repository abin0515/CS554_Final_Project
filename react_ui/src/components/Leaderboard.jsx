import React from 'react';
import './Leaderboard.css'; // We'll create this CSS file next

// Placeholder data - replace with actual data fetching later
const placeholderData = [
  { rank: 1, name: 'Me', points: 1, isCurrentUser: true }, // Example for current user
  { rank: 1, name: 'Jack', points: 1 },
  // Add more placeholder users if you like
];

const Leaderboard = () => {
  return (
    <div className="leaderboard-container">
      <h3 className="leaderboard-title">🏆 Leaderboard</h3>
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {placeholderData.length > 0 ? (
            placeholderData.map((user, index) => (
              <tr key={index} className={user.isCurrentUser ? 'current-user-row' : ''}>
                <td>
                  {user.rank === 1 && index === 1 ? <span title="Rank 1">🏆</span> : user.rank}
                </td>
                <td>{user.name}</td>
                <td>{user.points}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="leaderboard-empty">
                Leaderboard is currently empty.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard; 