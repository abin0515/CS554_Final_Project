import { useEffect, useState } from 'react';
import { auth as firebaseAuth } from './firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { POST_API_BASE_URL } from '../config';

export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, async (u) => {
      if (u) await syncUserToBackend(u);
      setUser(u);
      setLoading(false);
    });
  }, []);

  return { user, loading };
}

export function authEmail(email, password) {
  return signInWithEmailAndPassword(firebaseAuth, email, password)
    .then(async (cred) => {
      await syncUserToBackend(cred.user);
      return cred.user;
    });
}

export function authGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(firebaseAuth, provider)
    .then(async (cred) => {
      await syncUserToBackend(cred.user);
      return cred.user;
    });
}

export function unauth() {
  return signOut(firebaseAuth);
}

export async function signUpNewAccount(email, password, displayName) {
  const userCred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  if (displayName) {
    await updateProfile(userCred.user, { displayName });
  }
  await syncUserToBackend(userCred.user);
  return userCred.user;
}

export function sendResetEmail(email) {
  return sendPasswordResetEmail(firebaseAuth, email);
}

const usernameCache = {};

export async function fetchUserDisplayName(uid) {
  if (usernameCache[uid]) {
    return usernameCache[uid];
  }
  try {
    const response = await fetch(`${POST_API_BASE_URL}/users/displayName/${uid}`);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    const data = await response.json();
    usernameCache[uid] = data.displayName;
    return data.displayName;
  } catch (err) {
    console.error("Error fetching display name:", err);
    return "Anonymous";
  }
}

export async function fetchWithAuth(url, options = {}) {
  const user = firebaseAuth.currentUser;
  if (!user) throw new Error("User is not signed in");
  const token = await user.getIdToken();

  const authOptions = {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`
    }
  };
  return fetch(url, authOptions);
}

export async function checkUserEmailExists(email) {
  const res = await fetch(`${POST_API_BASE_URL}/users/check-user-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error('Failed to check email');
  const data = await res.json();
  return data.exists;
}

async function syncUserToBackend(user) {
  if (!user || !user.uid || !user.email) return;
  try {
    const token = await user.getIdToken(); 
    await fetch(`${POST_API_BASE_URL}/users/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`, 
      },
      body: JSON.stringify({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || '',
      }),
    });
  } catch (err) {
    console.error('Failed to sync user to backend:', err);
  }
}
