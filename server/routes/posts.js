import { Router } from "express";
import * as postService from "../service/post_service.js";

const router = Router();

// createPost
router.post('/createPost', async (req, res) => {
    try {
        const newPost = await postService.createPost(
            req.body.title, 
            req.body.content, 
            req.body.image_url, 
            req.body.user_id, 
            req.body.type
        );
        res.status(200).json(newPost);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

// Get posts by page
router.get('/page', async (req, res) => {
    try {
        // Get page number from query parameters
        let page = req.query.page ? parseInt(req.query.page) : 1;
        // console.log(page);
        // Call the service layer
        const posts = await postService.getPostsByPage(page);
        
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

// Get post by ID 
router.get('/detail', async (req, res) => {
    try {
        // Get post ID from query parameter
        const postId = req.query.postId; 
        
        // Call the service layer
        const post = await postService.getPostById(postId);
        
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

// editPost 
router.put('/editPost', async (req, res) => {
    try {
        // Get post ID from query parameter
        const postId = req.query.postId; 
        
        // Get title and content from request body
        const { title, content } = req.body;
        
        // Get user ID (for testing purposes)
        const user_id = "2001"; // Replace with actual authentication
        
        if (!user_id) {
            return res.status(401).json({ error: 'You must be logged in to edit a post' });
        }
        
        // Call the service layer
        const updatedPost = await postService.editPost(postId, user_id, title, content);
        
        res.status(200).json({
            success: true,
            message: 'Post updated successfully',
            post: updatedPost
        });
    } catch (e) {
        // Check for specific error types
        if (e.message === 'Post not found') {
            return res.status(404).json({ error: e.message });
        } else if (e.message === 'You do not have permission to edit this post') {
            return res.status(403).json({ error: e.message });
        } else if (e.message.includes('title or content')) {
            return res.status(400).json({ error: e.message });
        }
        
        // General error
        res.status(500).json({ error: e.message });
    }
});

// removePost 
router.delete('/removePost', async (req, res) => {
    try {
        // Get post ID from query parameter
        const postId = req.query.postId; 
        
        // Get user ID (for testing purposes)
        const user_id = "2001"; // Replace with actual authentication
        
        if (!user_id) {
            return res.status(401).json({ error: 'You must be logged in to delete a post' });
        }
        
        // Call the service layer
        const result = await postService.removePost(user_id, postId);
        
        res.status(200).json({ success: result, message: 'Post deleted successfully' });
    } catch (e) {
        // Check for specific error types
        if (e.message === 'Post not found') {
            return res.status(404).json({ error: e.message });
        } else if (e.message === 'You do not have permission to delete this post') {
            return res.status(403).json({ error: e.message });
        }
        
        // General error
        res.status(400).json({ error: e.message });
    }
});

export default router;