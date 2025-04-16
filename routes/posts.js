import { Router } from "express";

import * as postData from "../data/posts.js";

const router = Router();


// createPost
router.post('/createPost', async (req, res) => {
    try {
        const newPost = await postData.createPost(req.body.title, req.body.content, req.body.image_url, req.body.user_id, req.body.type);
        res.status(200).json(newPost);
    } catch (e) {
        res.status(400).json({ error: e });
    }
});

// removePost
router.delete('/removePost/:postId', async (req, res) => {
    try {
        // Get post ID from URL parameter
        const postId = req.params.postId;
        
        // Get user ID from request body, query parameters, or session
        // Depending on your authentication method, you might get user_id differently

        // const user_id = req.body.user_id || req.query.user_id;

        const user_id = "2001";// test fake user_id
        
        if (!user_id) {
            return res.status(401).json({ error: 'You must be logged in to delete a post' });
        }
        
        // Call the removePost function
        const result = await postData.removePost(user_id, postId);
        
        res.status(200).json({ success: true, message: 'Post deleted successfully' });
    } catch (e) {
        // Check for specific error types
        if (e.message === 'Post not found.') {
            return res.status(404).json({ error: e.message });
        } else if (e.message === 'You do not have permission to delete this post.') {
            return res.status(403).json({ error: e.message });
        }
        
        // General error
        res.status(400).json({ error: e.message });
    }
});

// editPost
router.put('/editPost/:postId', async (req, res) => {
    try {
        // Get post ID from URL parameter
        const postId = req.params.postId;
        
        // Get title and content from request body
        const { title, content } = req.body;
        
        // Get user ID from request body, query parameters, or session
        // Depending on your authentication method, you might get user_id differently
        // For now using the same approach as in removePost
        const user_id = "2001"; // For testing, replace with actual authentication
        
        if (!user_id) {
            return res.status(401).json({ error: 'You must be logged in to edit a post' });
        }
        
        // Call the editPost function
        const updatedPost = await postData.editPost(postId, user_id, title, content);
        
        res.status(200).json({
            success: true,
            message: 'Post updated successfully',
            post: updatedPost
        });
    } catch (e) {
        // Check for specific error types
        if (e.message === 'Post not found.') {
            return res.status(404).json({ error: e.message });
        } else if (e.message === 'You do not have permission to edit this post.') {
            return res.status(403).json({ error: e.message });
        } else if (e.message === 'At least one of title or content must be provided') {
            return res.status(400).json({ error: e.message });
        }
        
        // General error
        res.status(500).json({ error: e.message });
    }
});

router.get('/:postId', async (req, res) => {
    try {
        // Get post ID from URL parameter
        const postId = req.params.postId;
        
        // Call the getPostById function
        const post = await postData.getPostById(postId);
        
        res.status(200).json(post);
    } catch (e) {
        // Check for specific error types
        if (e.message === 'Post not found') {
            return res.status(404).json({ error: e.message });
        } else if (e.message === 'Invalid post ID format') {
            return res.status(400).json({ error: e.message });
        } else if (e.message === 'Post ID is required') {
            return res.status(400).json({ error: e.message });
        }
        
        // General error
        res.status(500).json({ error: e.message });
    }
});

// Get posts by page
router.get('/page/:page', async (req, res) => {
    try {
        // Get page number from query parameters
        let page = req.query.page ? parseInt(req.query.page) : 1;
        
        // Validate page
        if (isNaN(page) || page < 1) {
            page = 1;
        }
        
        // Call the getPostsByPage function
        const posts = await postData.getPostsByPage(page);
        
        // Return the posts along with pagination info
        res.status(200).json({
            success: true,
            currentPage: page,
            posts: posts,
            postsPerPage: 10,
            totalPosts: posts.length
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

export default router;