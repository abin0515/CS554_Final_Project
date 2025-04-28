import { initializeApp } from 'firebase/app';
import { getAuth }      from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyBuvr6Qdi5DrWZtKRQ5T7vv6aLYSc50y-I",
    authDomain: "cs554-final-25f.firebaseapp.com",
    projectId: "cs554-final-25f",
    storageBucket: "cs554-final-25f.firebasestorage.app",
    messagingSenderId: "296943628133",
    appId: "1:296943628133:web:f063ba9bc361cd72c73b8c",
    measurementId: "G-9E18SHJNKQ"
  };

const app  = initializeApp(firebaseConfig);
export const auth = getAuth(app);

