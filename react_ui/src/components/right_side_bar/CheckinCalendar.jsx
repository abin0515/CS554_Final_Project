// react_ui/src/components/CheckinCalendar.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; // Use useAuth hook
import { fetchWithAuth } from '../../lib/Auth';
import { POINTS_API_BASE_URL } from '../../config';
import './CheckinCalendar.css';

const CheckinCalendar = ({ onCheckinSuccess }) => {
  const { currentUser } = useAuth(); // Get user from context
  const [checkinData, setCheckinData] = useState([]); // Array like [0, 1, 0...]
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [loading, setLoading] = useState(false); // Loading for initial fetch
  const [error, setError] = useState(null);

  // Function to fetch data, reusable
  const fetchCheckinData = async () => {
    if (!currentUser) {
      setCheckinData([]);
      return false; // Indicate fetch was not performed
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`${POINTS_API_BASE_URL}/checkin`);
      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
            const errData = await response.json();
            errorMsg = errData.error || errorMsg;
        } catch { /* Ignore parsing error */ }
        throw new Error(errorMsg);
      }
      const data = await response.json();
      setCheckinData(Array.isArray(data) ? data : []);
      return true; // Indicate fetch was successful
    } catch (e) {
      console.error("Error fetching check-in data:", e);
      setError(e.message);
      setCheckinData([]);
      return false; // Indicate fetch failed
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCheckinData();
  }, [currentUser]);

  // --- Check-in Handler ---
  const handleCheckin = async () => {
    if (!currentUser || isCheckingIn) {
      return; // Prevent check-in if not logged in or already processing
    }
    setIsCheckingIn(true);
    setError(null); // Clear previous errors
    try {
      const response = await fetchWithAuth(`${POINTS_API_BASE_URL}/checkin`, {
        method: 'POST',
      });
      const result = await response.json(); // Read body even for errors

      if (!response.ok) {
         // Use error from response body if available
        throw new Error(result.error || `Check-in failed: ${response.status}`);
      }
      
      console.log("Check-in successful:", result);
      // Refresh check-in data to show the update
      const fetched = await fetchCheckinData(); 
      // Optionally display success message or points awarded (result.reward_points)
      alert(`Checked in successfully! Consecutive days: ${result.consecutiveDays}. Points awarded: ${result.reward_points}`);
      
      console.log('[CheckinCalendar] Fetched calendar data after check-in:', fetched);
      if (fetched && onCheckinSuccess) { 
        console.log('[CheckinCalendar] Calling onCheckinSuccess');
        onCheckinSuccess();
      } else if (!fetched) {
        console.log('[CheckinCalendar] Not calling onCheckinSuccess because fetched is false.');
      } else if (!onCheckinSuccess) {
        console.log('[CheckinCalendar] Not calling onCheckinSuccess because prop is missing.');
      }
      // TODO: Trigger leaderboard refresh if needed

    } catch (e) {
      console.error("Error performing check-in:", e);
      setError(e.message || "Failed to check in.");
       // Show specific error from backend if available
       alert(`Check-in failed: ${e.message}`); 
    } finally {
      setIsCheckingIn(false);
    }
  };

  // --- Calendar Logic ---
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); 
  const currentDay = today.getDate();

  // Check if today is already checked in
  const todayIndex = currentDay - 1;
  const isTodayCheckedIn = checkinData && checkinData[todayIndex] === 1;

  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday, 1 = Monday, ...

  const days = [];
  // Add days from previous month
  const lastDayOfPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    days.push({ day: lastDayOfPrevMonth - i, isCurrentMonth: false });
  }

  // Add days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    // checkinData index is 0-based (day - 1)
    const isCheckedIn = checkinData && checkinData[day - 1] === 1;
    const isToday = (day === currentDay);
    days.push({ day, isCurrentMonth: true, isCheckedIn, isToday });
  }

  // Add days from next month to fill the grid
  const remainingCells = 42 - days.length; // 6 weeks * 7 days
  for (let i = 1; i <= remainingCells; i++) {
    days.push({ day: i, isCurrentMonth: false });
  }

  const weeks = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const monthNames = ["January", "February", "March", "April", "May", "June",
                      "July", "August", "September", "October", "November", "December"];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];


  return (
    <div className="checkin-calendar-container">
      <h3 className="checkin-calendar-title">{monthNames[currentMonth]} {currentYear}</h3>
      {loading && <div className="checkin-loading">Loading check-in status...</div>}
      {error && !isCheckingIn && <div className="checkin-error error-message">Error: {error}</div>} {/* Show fetch error only if not checkin error */}
      {!loading && (
        <table className="checkin-calendar-table">
          <thead>
            <tr>
              {dayNames.map(dayName => <th key={dayName}>{dayName}</th>)}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week, weekIndex) => (
              <tr key={weekIndex}>
                {week.map((dayInfo, dayIndex) => {
                  // Determine if the cell represents today and if it's available for check-in
                  const isClickableToday = dayInfo.isToday && !isTodayCheckedIn && !isCheckingIn;
                  const cellClass = `
                    ${!dayInfo.isCurrentMonth ? 'other-month' : ''}
                    ${dayInfo.isToday ? 'today' : ''}
                    ${dayInfo.isCheckedIn ? 'checked-in' : ''}
                    ${isClickableToday ? 'clickable' : ''}
                    ${dayInfo.isToday && isCheckingIn ? 'checking-in' : ''}
                  `;

                  return (
                    <td 
                      key={`${weekIndex}-${dayIndex}`} 
                      className={cellClass.trim()} // Apply combined classes
                      onClick={isClickableToday ? handleCheckin : undefined} 
                      title={isClickableToday ? 'Click to Check-in' : (dayInfo.isCheckedIn ? 'Checked-in' : '')} 
                    >
                      {/* Content based on state */} 
                      {dayInfo.isCurrentMonth ? (
                         dayInfo.isToday && isCheckingIn ? (
                           <span className="checking-in-spinner">...</span> // Show spinner when checking in
                         ) : dayInfo.isCheckedIn ? (
                           <span className="day-number checked-in-mark">✓</span> // Show check mark for checked-in
                         ) : isClickableToday ? (
                           <span className="checkin-text">Check In</span> // Show "Check In" text
                         ) : (
                           <span className="day-number">{dayInfo.day}</span> // Show day number normally
                         )
                      ) : (
                        <span className="day-number">{dayInfo.day}</span> // Days from other months
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CheckinCalendar; 