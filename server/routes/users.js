//validations added

import { Router } from "express";
import * as userData from "../data/users.js";
import { getUserDisplayName, authenticate } from "../middleware/authenticate.js";
import admin from 'firebase-admin';
import { isValidEmail, isValidUid, isNonEmptyString } from "./validator.js";

const router = Router();

// GET /displayName/:uid — used by frontend to get display name quickly
router.get('/displayName/:uid', async (req, res) => {
  const { uid } = req.params;
  if (!isValidUid(uid)) {
    return res.status(400).json({ success: false, error: 'Invalid user ID format' });
  }

  try {
    const displayName = await getUserDisplayName(uid);
    res.status(200).json({ success: true, displayName });
  } catch (error) {
    console.error(`Error fetching user details for uid ${uid}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /profile/:uid — get public user profile info
router.get('/profile/:uid', async (req, res) => {
  const { uid } = req.params;
  if (!isValidUid(uid)) {
    return res.status(400).json({ success: false, error: 'Invalid user ID format' });
  }

  try {
    const user = await userData.getUserByUid(uid);
    res.status(200).json({
      success: true,
      profile: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Anonymous',
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error(`Error getting profile for uid ${uid}:`, error);
    res.status(404).json({ success: false, error: 'User not found' });
  }
});

// POST /check-user-email — check if email is registered in Firebase
router.post('/check-user-email', async (req, res) => {
  const { email } = req.body;
  if (!isNonEmptyString(email) || !isValidEmail(email)) {
    return res.status(400).json({ exists: false, error: 'Valid email is required.' });
  }

  try {
    await admin.auth().getUserByEmail(email);
    res.json({ exists: true });
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      res.json({ exists: false });
    } else {
      res.status(500).json({ exists: false, error: error.message });
    }
  }
});

// POST /sync — sync Firebase login data into MongoDB users collection
router.post('/sync', authenticate, async (req, res) => {
  try {
    const firebaseUser = req.user;

    if (
      !isValidUid(firebaseUser.uid) ||
      !isValidEmail(firebaseUser.email || '') ||
      !isNonEmptyString(firebaseUser.displayName || firebaseUser.name || '')
    ) {
      return res.status(400).json({ success: false, error: 'Invalid user data from Firebase' });
    }

    const userPayload = {
      uid: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.name || firebaseUser.displayName || '',
    };

    await userData.upsertUser(userPayload);
    res.json({ success: true });
  } catch (error) {
    console.error('Error syncing user:', error);
    res.status(500).json({ success: false, error: 'Failed to sync user' });
  }
});

export default router;
