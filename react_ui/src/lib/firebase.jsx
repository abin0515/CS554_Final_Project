import { initializeApp } from 'firebase/app';
import { getAuth }      from 'firebase/auth';

// This is the test Firebase config hosted by Han Zheng.
// If you want to use your own Firebase project, please
// remember to set FIREBASE_ADMIN_CERT_JSON_PATH in
// backend server too!
const firebaseConfig = {
    apiKey: "AIzaSyBB3I9c1nANybm2C70IXua8NWfHBjujSZk",
    authDomain: "cs554-final-9810c.firebaseapp.com",
    projectId: "cs554-final-9810c",
    storageBucket: "cs554-final-9810c.firebasestorage.app",
    messagingSenderId: "635894362025",
    appId: "1:635894362025:web:03d54f6cdac3a4deaadeb8",
    measurementId: "G-6NMM2GFF69"
};

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);

