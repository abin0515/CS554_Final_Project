import { Router } from "express";
import bcrypt from 'bcryptjs'
import * as userData from "../data/users.js";
import { getUserDisplayName } from "../middleware/authenticate.js";
import admin from 'firebase-admin';

const router = Router();

router.get('/displayName/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
      res.status(200).json({ success: true, displayName: await getUserDisplayName(uid) });
  } catch (error) {
      console.error(`Error fetching user details for uid ${uid}:`, error);
      res.status(500).json({ success: false, error: error.message });
  }
});

// POST /check-user-email
router.post('/check-user-email', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ exists: false, error: 'Email is required.' });
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

export default router;
