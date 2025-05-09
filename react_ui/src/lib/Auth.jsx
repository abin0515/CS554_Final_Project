import { useEffect, useState } from 'react';
import { auth as firebaseAuth } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { POST_API_BASE_URL } from '../config';

export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        return onAuthStateChanged(firebaseAuth, u => {
            setUser(u);
            setLoading(false);
        });
    }, []);

    return { user, loading };
}

export function authEmail(email, password) {
    return signInWithEmailAndPassword(firebaseAuth, email, password)
}

export function authGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(firebaseAuth, provider)

}

export function unauth() {
    signOut(firebaseAuth)
}

export function signUpNewAccount(email, password){
    return createUserWithEmailAndPassword(firebaseAuth, email, password)
}

const usernameCache = {};

export async function fetchUserDisplayName(uid) {
    if (usernameCache[uid]) {
        return usernameCache[uid];
    }
    try {
        const response = await fetch(`${POST_API_BASE_URL}/displayName/${uid}`);
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
        }
        const data = await response.json();

        const displayName = data.displayName;
        usernameCache[uid] = displayName;
        return displayName;
    } catch (error) {
        console.error("Error fetching username:", error);
        return "Error User Name";
    }
}

export async function fetchWithAuth(url, options = {}) {
    const user = firebaseAuth.currentUser;
    if (!user) {
        throw new Error("User is not signed in");
    }
    // Retrieve the ID token
    const token = await user.getIdToken();

    // Append the authorization header
    const authOptions = {
        ...options,
        headers: {
            ...options.headers,
            Authorization: `Bearer ${token}`
        }
    };
    return fetch(url, authOptions);
}
