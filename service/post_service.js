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
 * Create a new post
 * @param {string} title - the title of the post
 * @param {string} content - the content of the post
 * @param {string} image_url - the image URL
 * @param {string} user_id - the ID of the user creating the post
 * @param {number} type - the type of post
 * @returns {Promise<Object>} - the newly created post
 */
export async function createPost(title, content, image_url, user_id, type) {
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
    
    // Call data layer to persist the post
    return await postData.createPostInDB(title, content, image_url, user_id, type);
}

/**
 * Edit an existing post
 * @param {string} postId - the ID of the post to edit
 * @param {string} user_id - the ID of the user making the edit
 * @param {string} title - the new title
 * @param {string} content - the new content
 * @returns {Promise<Object>} - the updated post
 */
export async function editPost(postId, user_id, title, content) {
    // Validation logic
    if (!postId || !user_id) {
        throw new Error('Post ID and user ID are required');
    }
    
    if (!title && !content) {
        throw new Error('At least one of title or content must be provided');
    }
    
    // Check if post exists and if user has permission
    const post = await postData.getPostByIdFromDB(postId);
    
    if (post.user_id.toString() !== user_id) {
        throw new Error('You do not have permission to edit this post');
    }
    
    // Call data layer to update the post
    return await postData.updatePostInDB(postId, { title, content });
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