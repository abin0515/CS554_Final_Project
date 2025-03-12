import { Router } from "express";
import bcrypt from 'bcryptjs'
import * as userData from "../data/users.js";


const router = Router();


// test
router.post('/login', async (req, res) => {
  try {
    res.status(200).json({ message: 'Login Successful!'});
  } catch (e) {
    res.status(400).json({ error: e });
  }
});



export default router;