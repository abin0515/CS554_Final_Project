import { Router } from "express";
import multer from 'multer';
import * as postService from "../service/post_service.js";
import * as uploadService from "../service/upload_service.js";

const router = Router();
const MAX_IMAGES = 6;

// Configure Multer to use memory storage (to get buffer and postId before saving)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 1024 * 1024 * 5 } // 5MB limit per file
});

// createPost - Now handles text data AND image files
router.post(
  '/createPost', 
  upload.array('postImages', MAX_IMAGES), // Use multer middleware here
  async (req, res) => {
    try {
      // Extract text data from req.body
      const { title, content, user_id, type } = req.body;
      const files = req.files; // Image files are in req.files

      // TODO: Get actual user_id from session/authentication
      const actualUserId = user_id || '2001'; // Use provided or default

      // Step 1: Create the post document (without images initially)
        const newPost = await postService.createPost(
          title, 
          content, 
          actualUserId, // Pass actual user ID
          type // Assuming type is sent from frontend
      );

      let finalImageUrls = [];
      let postWithImages = newPost; // Start with the initially created post

      // Step 2: If images were uploaded, save them using the new postId
      if (files && files.length > 0) {
        try {
          finalImageUrls = await uploadService.savePostImages(files, newPost._id);
          
          // Step 3: Update the post document with the image URLs
          postWithImages = await postService.addImagesToPost(newPost._id, actualUserId, finalImageUrls);

        } catch (imageError) {
          // Handle image saving/updating error
          // Options: Delete the already created post? Or just return error?
          console.error('Error processing images after post creation:', imageError);
          // For simplicity, return an error but leave the text post created
          return res.status(500).json({ 
            error: `Post text created (ID: ${newPost._id}), but failed to save images: ${imageError.message}`,
            postId: newPost._id
          }); 
        }
      }
        
      // Step 4: Return the final post object (with image URLs if successful)
      res.status(200).json(postWithImages);

    } catch (e) {
        // Handle errors during initial post creation or other issues
        console.error("Error in createPost route:", e);
        // Check for specific error types if needed (e.g., validation)
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

// editPost - Now handles text and files together
router.put(
  '/editPost',
  upload.array('postImages', MAX_IMAGES), // Use multer middleware for new images
  async (req, res) => {
    const postId = req.query.postId; 
    const userId = "2001"; // TODO: Replace with actual authentication
        
    try {
      // Basic validation
      if (!userId) {
            return res.status(401).json({ error: 'You must be logged in to edit a post' });
        }
      if (!postId) {
          return res.status(400).json({ error: 'Post ID is required in query parameters.' });
      }

      // Extract text data and the list of existing URLs to keep
      const { title, content, existingUrls } = req.body;
      const newFiles = req.files; // Newly uploaded files from multer
      
      let parsedExistingUrls = [];
      try {
        // Ensure existingUrls is parsed correctly, default to empty array if missing/invalid
        parsedExistingUrls = existingUrls ? JSON.parse(existingUrls) : [];
        if (!Array.isArray(parsedExistingUrls)) parsedExistingUrls = [];
      } catch (parseError) {
        console.error("Error parsing existingUrls:", parseError);
        return res.status(400).json({ error: 'Invalid format for existingUrls.' });
      }

      // --- Image Handling --- 
      // Step 1: Save the *new* files uploaded in this request.
      // Pass the count of existing URLs as the starting index for naming new files.
      const newlySavedUrls = await uploadService.savePostImages(
          newFiles, 
          postId, 
          parsedExistingUrls.length // Start index for new file names
      );

      // Step 2: Combine the kept existing URLs and the newly saved URLs
      const finalImageUrls = [...parsedExistingUrls, ...newlySavedUrls];

      // Step 3: Synchronize physical files with the final URL list (delete obsolete ones)
      await uploadService.syncPostImages(postId, finalImageUrls);

      // --- Update Post Document --- 
      const updatePayload = {
        title: title,
        content: content,
        image_urls: finalImageUrls
      };

      // Step 4: Call the service layer to update the post data in DB
      const updatedPost = await postService.editPost(postId, userId, updatePayload);
        
        res.status(200).json({
            success: true,
            message: 'Post updated successfully',
            post: updatedPost
        });

    } catch (e) {
        // Catch errors from delete/save images or post update
        console.error("Error in editPost route:", e);
        // Check for specific error types if needed
        if (e.message === 'Post not found' || e.message.includes('find post to update')) {
            return res.status(404).json({ error: e.message });
        } else if (e.message.includes('permission')) {
            return res.status(403).json({ error: e.message });
        }
        // General error
        res.status(500).json({ error: e.message });
    }
});

// removePost
router.delete('/removePost', async (req, res) => {
    const postId = req.query.postId; 
    // TODO: Get actual user_id from session/token
    const userId = "2001"; // Replace with actual authentication
        
    if (!userId) {
            return res.status(401).json({ error: 'You must be logged in to delete a post' });
        }
    if (!postId) {
        return res.status(400).json({ error: 'Post ID is required in query parameters.' });
    }

    try {
        // Step 1: Call the service layer to delete the post from DB
        // This also handles permission checks internally now
        const deleteDbResult = await postService.removePost(userId, postId);
        
        // If DB deletion was successful (removePost doesn't throw error)
        if (deleteDbResult) { // Assuming removePost returns true on success
          // Step 2: Delete associated images from the filesystem
          // We pass an empty array to syncPostImages, telling it to delete all files for this postId
          try {
             await uploadService.syncPostImages(postId, []);
             console.log(`Successfully deleted images for post ${postId}.`);
          } catch (imageDeleteError) {
             // Log the error but maybe don't fail the whole request?
             // The DB entry is already gone.
             console.error(`Error deleting images for post ${postId} after DB removal:`, imageDeleteError);
             // Optionally return a specific message indicating partial success
             return res.status(200).json({ 
                success: true, 
                message: 'Post deleted from database, but encountered error cleaning up images.'
             });
          }
        }
        
        res.status(200).json({ success: true, message: 'Post and associated images deleted successfully' });

    } catch (e) {
        // Handle errors (e.g., post not found, permission denied)
        console.error("Error in removePost route:", e);
        if (e.message === 'Post not found') {
            return res.status(404).json({ error: e.message });
        } else if (e.message.includes('permission')) {
            return res.status(403).json({ error: e.message });
        }
        // General error
        res.status(500).json({ error: e.message });
    }
});

export default router;