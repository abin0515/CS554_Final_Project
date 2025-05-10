import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { fetchWithAuth } from '../../lib/Auth'; // Assuming fetchWithAuth is available
import { POINTS_API_BASE_URL } from '../../config'; // Assuming you have this in config
import DisplayName from '../auth/UserDisplayName';
import './Leaderboard.css';

const Leaderboard = ({ refreshKey }) => {
  const { currentUser } = useContext(AuthContext); // Get user from context
  const [currentUserData, setCurrentUserData] = useState(null);
  const [leaderboardEntries, setLeaderboardEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setLoading(true);
      setError(null);
      const isLoggedIn = !!currentUser;
      const currentUserId = currentUser ? currentUser.uid : null;

      const endpoint = isLoggedIn ? `${POINTS_API_BASE_URL}/board` : `${POINTS_API_BASE_URL}/board/noAuth`;

      try {
        const fetchFn = isLoggedIn ? fetchWithAuth : fetch;

        const response = await fetchFn(endpoint);

        if (!response.ok) {
          let errorMsg = `HTTP error! status: ${response.status}`;
          try {
              const errData = await response.json();
              errorMsg = errData.error || errorMsg;
          } catch {
            // Ignore parsing error if response body isn't JSON or is empty
          }
          throw new Error(errorMsg);
        }
        const data = await response.json();

        setCurrentUserData({
            rank: data.rank,
            points: data.points,
            name: isLoggedIn ? "Me" : "",
            userId: currentUserId
        });

        setLeaderboardEntries(data.board || []);

      } catch (e) {
        console.error("Error fetching leaderboard data:", e);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [currentUser, refreshKey]);

  return (
    <div className="leaderboard-container">
      <h3 className="leaderboard-title">🏆 Leaderboard</h3>
      {loading && <div className="leaderboard-loading">Loading...</div>}
      {error && <div className="leaderboard-error error-message">Error: {error}</div>}
      {!loading && !error && (
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Name</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {/* Display Current User's Row First - only if logged in and ranked */}
            {currentUserData && currentUserData.rank !== null && currentUserData.userId ? (
              <tr className='current-user-row'>
                <td>{currentUserData.rank}</td>
                <td>{currentUserData.name}</td>
                <td>{currentUserData.points}</td>
              </tr>
            ) : (
                // Show message only if not loading and user is logged in but not ranked
                !loading && currentUserData && currentUserData.rank === null && currentUserData.userId && (
                    <tr>
                        <td colSpan="3" className="leaderboard-user-not-ranked">You are not yet ranked.</td>
                    </tr>
               )
            )}

            {/* Display Other Leaderboard Entries */}
            {leaderboardEntries.length > 0 ? (
              leaderboardEntries.map((user) => {
                console.log(user);
                return (
                  <tr key={user.name}>
                     <td>
                      {user.rank === 1 ? <span title="Rank 1">🏆</span> : user.rank}
                    </td>
                    <td>
                      <DisplayName userId={user.name} anonymity={false} />
                    </td>
                    <td>{user.points}</td>
                  </tr>
                );
              })
            ) : (
               // Show board empty message only if not loading and user isn't ranked (or not logged in)
               !loading && (!currentUserData || currentUserData.rank === null) && (
                 <tr>
                    <td colSpan="3" className="leaderboard-empty">Leaderboard is empty.</td>
                 </tr>
              )
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Leaderboard;
