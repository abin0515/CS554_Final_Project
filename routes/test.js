import { Router } from "express";

import * as postData from "../data/posts.js";

const router = Router();


// test
router.post('/createPost', async (req, res) => {
    try {
        const newPost = await postData.createPost(req.body.title, req.body.content, req.body.image_url, req.body.user_id, req.body.type);
        res.status(200).json(newPost);
    } catch (e) {
        res.status(400).json({ error: e });
    }
});



export default router;