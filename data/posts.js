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
 * @param {string} image_url - the image url of the post
 * @param {string} user_id - the user id of the post
 * @param {number} type - the type of the post
 * @returns {Promise<Object>} - the new post
 */
export async function createPostInDB(title, content, image_url, user_id, type) {
    // Create new post object
    const newPost = {
        title: title || "",
        content: content || "",
        image_url: image_url || "",
        user_id: user_id,
        use_id: user_id, // For schema compatibility
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
 * @param {Object} updateData - object containing fields to update
 * @returns {Promise<Object>} - the updated post
 */
export async function updatePostInDB(postId, updateData) {
    // Build update document
    const updateInfo = {
        update_time: new Date()
    };
    
    if (updateData.title) {
        updateInfo.title = updateData.title;
    }
    
    if (updateData.content) {
        updateInfo.content = updateData.content;
    }
    
    // Update the post
    const result = await postsCollection.updateOne(
        { _id: new ObjectId(postId) },
        { $set: updateInfo }
    );
    
    if (result.modifiedCount === 0) {
        throw new Error('Could not update post');
    }
    
    // Return the updated post
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