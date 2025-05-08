import React, { createContext, useState, useEffect, useContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase'; // Import your Firebase auth instance

// 1. Create Context
export const AuthContext = createContext();

// Custom hook for using the context (optional but convenient)
export const useAuth = () => {
  return useContext(AuthContext);
};

// 2. Create AuthProvider Component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Store the Firebase user object or null
  const [loading, setLoading] = useState(true); // Loading state for initial auth check

  useEffect(() => {
    console.log("AuthProvider mounted. Setting up onAuthStateChanged listener.");
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Auth State Changed in AuthProvider:", user ? `User logged in: ${user.uid}` : "User logged out");
      setCurrentUser(user); // Set user object or null
      setLoading(false); // Auth check complete
    });

    // Cleanup subscription on unmount
    return () => {
      console.log("AuthProvider unmounting. Unsubscribing from onAuthStateChanged.");
      unsubscribe();
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  // Values to provide via context
  const value = {
    currentUser, // The Firebase user object (or null)
    // You could add login/logout functions here if you want them accessible via context
  };

  // Render children only after initial auth check is complete to avoid flashes
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 