import * as postData from '../data/posts.js';
import { ObjectId } from 'mongodb';

/**
 * Get a post by its ID
 * @param {string} postId - the ID of the post to retrieve
 * @returns {Promise<Object>} - the post object
 */
export async function getPostById(postId) {
    // Validation logic
    if (!postId) {
        throw new Error('Post ID is required');
    }
    
    // Check if the postId is a valid ObjectId
    if (!ObjectId.isValid(postId)) {
        throw new Error('Invalid post ID format');
    }
    
    // Retrieve post from data layer
    const post = await postData.getPostByIdFromDB(postId);
    
    // Business logic can be added here, for example:
    // - Process or transform the data
    // - Check permissions
    // - Add additional information from other sources
    // - Cache frequently accessed posts
    
    return post;
}

/**
 * Create a new post (without images initially)
 * @param {string} title - the title of the post
 * @param {string} content - the content of the post
 * @param {string} user_id - the ID of the user creating the post
 * @param {number} type - the type of post
 * @returns {Promise<Object>} - the newly created post object (including _id)
 */
export async function createPost(title, content, user_id, type) {
    // Validation and business logic
    if (!title || !content) {
        throw new Error('Title and content are required');
    }
    if (!user_id) {
        throw new Error('User ID is required');
    }
    if (title.length < 3) {
        throw new Error('Title must be at least 3 characters long');
    }

    // Initial image_urls will be empty
    const initialImageUrls = [];
    
    // Call data layer to persist the post
    // This now returns the full post object including the generated _id
    const newPost = await postData.createPostInDB(title, content, initialImageUrls, user_id, type);
    return newPost;
}

/**
 * Adds image URLs to an existing post.
 * @param {string} postId - The ID of the post to update.
 * @param {string} userId - The ID of the user performing the action (for permission check).
 * @param {string[]} imageUrls - Array of image URLs to add.
 * @returns {Promise<Object>} - The updated post object.
 */
export async function addImagesToPost(postId, userId, imageUrls) {
    if (!postId || !userId) {
        throw new Error('Post ID and User ID are required to add images.');
    }
    if (!Array.isArray(imageUrls)) {
        throw new Error('imageUrls must be an array.');
    }

    // Optional but recommended: Check permissions again
    const post = await postData.getPostByIdFromDB(postId); 
    if (post.user_id.toString() !== userId) {
        throw new Error('You do not have permission to add images to this post');
    }

    // Call data layer to update the post with image URLs
    return await postData.updatePostInDB(postId, { image_urls: imageUrls });
}

/**
 * Edit an existing post
 * @param {string} postId - the ID of the post to edit
 * @param {string} user_id - the ID of the user making the edit (for permission check)
 * @param {Object} updatePayload - Object containing fields to update (title, content, image_urls)
 * @returns {Promise<Object>} - the updated post
 */
export async function editPost(postId, user_id, updatePayload) {
    // Validation logic
    if (!postId || !user_id) {
        throw new Error('Post ID and user ID are required for editing');
    }

    // Check if at least one field to update is provided
    const { title, content, image_urls } = updatePayload;
    if (title === undefined && content === undefined && image_urls === undefined) {
        throw new Error('No fields provided for update (title, content, or image_urls)');
    }

    // Validate title length if provided
    if (title !== undefined && title.length < 3) {
         throw new Error('Title must be at least 3 characters long');
    }
    
    // Check if post exists and if user has permission
    const post = await postData.getPostByIdFromDB(postId);
    if (post.user_id.toString() !== user_id) { // Assuming user_id is stored as string
        throw new Error('You do not have permission to edit this post');
    }
    
    // Prepare the update object for the data layer
    const fieldsToUpdate = {};
    if (title !== undefined) fieldsToUpdate.title = title;
    if (content !== undefined) fieldsToUpdate.content = content;
    if (image_urls !== undefined) {
         // Ensure it's an array before passing to data layer
         fieldsToUpdate.image_urls = Array.isArray(image_urls) ? image_urls : [];
    }
    
    // Call data layer to update the post
    return await postData.updatePostInDB(postId, fieldsToUpdate);
}

/**
 * Delete a post
 * @param {string} user_id - the ID of the user making the request
 * @param {string} postId - the ID of the post to delete
 * @returns {Promise<boolean>} - true if successful
 */
export async function removePost(user_id, postId) {
    // Validation logic
    if (!postId || !user_id) {
        throw new Error('Post ID and user ID are required');
    }
    
    // Check if post exists and if user has permission
    const post = await postData.getPostByIdFromDB(postId);
    
    if (post.user_id.toString() !== user_id) {
        throw new Error('You do not have permission to delete this post');
    }
    
    // Call data layer to delete the post
    return await postData.deletePostFromDB(postId);
}

/**
 * Get posts by page number
 * @param {number} page - the page number (1-based)
 * @returns {Promise<Array>} - array of post objects for the requested page
 */
export async function getPostsByPage(page = 1) {
    // Validate page number
    if (typeof page !== 'number' || page < 1 || !Number.isInteger(page)) {
        throw new Error('Invalid page number');
    }
    
    // Call data layer to fetch paginated posts
    return await postData.getPostsByPageFromDB(page);
} 