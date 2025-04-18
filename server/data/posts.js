import { ObjectId, Long, Int32 } from 'mongodb';
import * as mongoCollection from '../config/mongoCollections.js';

const postsCollection = await mongoCollection.posts();

/**
 * Get a post by ID directly from the database
 * @param {string} postId - the ID of the post to retrieve
 * @returns {Promise<Object>} - the post object
 */
export async function getPostByIdFromDB(postId) {
    // Find the post
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    
    // If no post is found, throw an error
    if (!post) {
        throw new Error('Post not found');
    }
    
    // Convert ObjectId to string for the _id field
    post._id = post._id.toString();
    
    return post;
}

/**
 * Create a new post in the database
 * @param {string} title - the title of the post
 * @param {string} content - the content of the post
 * @param {string[]} image_urls - Array of image url strings
 * @param {string} user_id - the user id of the post
 * @param {number} type - the type of the post
 * @returns {Promise<Object>} - the new post
 */
export async function createPostInDB(title, content, image_urls, user_id, type) {
    // Create new post object
    const newPost = {
        title: title || "",
        content: content || "",
        image_urls: Array.isArray(image_urls) ? image_urls : [], // Store array of URLs
        user_id: user_id,
        latest_reply_id: 0,
        type: type,
        total_like_times: 0,
        reply_times: 0,
        create_time: new Date(),
        update_time: new Date()
    };
    
    // Insert post to database
    const insertInfo = await postsCollection.insertOne(newPost);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
        throw new Error('Could not create post');
    }
    
    // Return the new post with string ID
    newPost._id = insertInfo.insertedId.toString();
    return newPost;
}

/**
 * Update a post in the database
 * @param {string} postId - the ID of the post to update
 * @param {Object} updateData - object containing fields to update (e.g., title, content, image_urls)
 * @returns {Promise<Object>} - the updated post
 */
export async function updatePostInDB(postId, updateData) {
    // Build update document dynamically based on provided fields
    const updateFields = {};
    if (updateData.title !== undefined) {
        updateFields.title = updateData.title;
    }
    if (updateData.content !== undefined) {
        updateFields.content = updateData.content;
    }
    if (updateData.image_urls !== undefined) {
        // Ensure it's an array before saving
        updateFields.image_urls = Array.isArray(updateData.image_urls) ? updateData.image_urls : [];
    }

    // Only proceed if there are fields to update
    if (Object.keys(updateFields).length === 0) {
        // Maybe return the existing post or throw an error?
        // Returning existing post seems reasonable if nothing changed.
        return await getPostByIdFromDB(postId); 
        // Or: throw new Error('No fields provided for update');
    }

    // Add update_time
    updateFields.update_time = new Date();
    
    // Update the post
    const result = await postsCollection.updateOne(
        { _id: new ObjectId(postId) },
        { $set: updateFields } // Use the dynamically built update object
    );
    
    // Check if *anything* was modified or if the document matched
    // If the data sent is identical to existing data, modifiedCount will be 0 
    // but matchedCount will be 1. This isn't necessarily an error.
    if (result.matchedCount === 0) {
        throw new Error('Could not find post to update');
    }
    
    // Return the potentially updated post
    return await getPostByIdFromDB(postId);
}

/**
 * Delete a post from the database
 * @param {string} postId - the ID of the post to delete
 * @returns {Promise<boolean>} - true if successful
 */
export async function deletePostFromDB(postId) {
    const deleteInfo = await postsCollection.deleteOne({ _id: new ObjectId(postId) });
    
    if (deleteInfo.deletedCount === 0) {
        throw new Error('Could not delete post');
    }
    
    return true;
}

/**
 * Get posts by page from the database
 * @param {number} page - the page number (1-based)
 * @returns {Promise<Array>} - array of post objects
 */
export async function getPostsByPageFromDB(page) {
    const skip = (page - 1) * 10;
    const limit = 10;

    const posts = await postsCollection
        .find({})
        .skip(skip)
        .limit(limit)
        .toArray();

    if (!posts || posts.length === 0) {
        return [];
    }

    return posts.map((p) => ({
        ...p,
        _id: p._id.toString(),
    }));
}

/**
 * Increments the reply_times count for a specific post.
 * @param {string} postId - The ID of the post to update.
 * @returns {Promise<boolean>} True if the update was acknowledged.
 */
export async function incrementPostReplyCountInDB(postId) {
    // Consider adding validation for postId if not done elsewhere
    // postId = validation.checkId(postId, 'Post ID for increment');
    const updateResult = await postsCollection.updateOne(
        { _id: new ObjectId(postId) },
        { $inc: { reply_times: 1 }, $set: { update_time: new Date() } }
    );

    if (updateResult.matchedCount === 0) {
         // Optionally throw an error or just return false if the post wasn't found
         console.warn(`Attempted to increment reply count for non-existent post ID: ${postId}`);
         return false;
    }
    return updateResult.acknowledged;
}