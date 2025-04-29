import { useEffect, useState } from 'react';
import { auth as firebaseAuth } from './firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword } from 'firebase/auth';

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


