import { Router } from "express";
import bcrypt from 'bcryptjs'
import * as userData from "../data/users.js";
import { getUserDisplayName } from "../middleware/authenticate.js";


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

export default router;
