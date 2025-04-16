import { ObjectId, Long, Int32 } from 'mongodb';
import * as mongoCollection from '../config/mongoCollections.js';


const postsCollection = await mongoCollection.posts();

/**?
 * create a new post
 * @param {string} title - the title of the post
 * @param {string} content - the content of the post
 * @param {string} image_url - the image url of the post
 * @param {string} user_id - the user id of the post
 * @param {number} type - the type of the post
 * @returns {Promise<Object>} - the new post
 */
export async function createPost( title, content, image_url, user_id, type) {
    // Todo: validation
    
    // create new post
    const newPost = {
        title: title || "",
        content: content || "",
        image_url: image_url || "",
        user_id: user_id,
        latest_reply_id: 0,
        type: type,
        total_like_times: 0,
        reply_times: 0,
        create_time: new Date().toISOString(),
        update_time: new Date().toISOString()
    };
    //insert new post to db
    const insertInfo = await postsCollection.insertOne(newPost);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
        throw new Error('Could not create post.');
    }
    //return new post
    newPost._id = insertInfo.insertedId.toString();
    return newPost;
}

export async function removePost(user_id, postId) {
    // Todo: validation
    

    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (!post) {
        throw new Error('Post not found.');
    }
    
    // check if authenticated
    if (post.user_id.toString() !== user_id) {
        throw new Error('You do not have permission to delete this post.');
    }

    const deleteInfo = await postsCollection.deleteOne({ _id: new ObjectId(postId) });
    if (deleteInfo.deletedCount === 0) {
        throw new Error('Could not delete post.');
    }
    return true;
}

export async function editPost(postId, user_id, title, content) {
    // Validate inputs
    
    // Find the post first to check ownership
    const post = await postsCollection.findOne({ _id: new ObjectId(postId) });
    if (!post) {
        throw new Error('Post not found.');
    }
    
    // Check if the user is the owner of the post
    if (post.user_id.toString() !== user_id) {
        throw new Error('You do not have permission to edit this post.');
    }
    
    // Build update document
    const updateInfo = {
        update_time: new Date().toISOString()
    };
    
    if (title) {
        updateInfo.title = title;
    }
    
    if (content) {
        updateInfo.content = content;
    }
    
    // Update the post
    const result = await postsCollection.updateOne(
        { _id: new ObjectId(postId) },
        { $set: updateInfo }
    );
    
    if (result.modifiedCount === 0) {
        throw new Error('Could not update post.');
    }
    
    // Return the updated post
    const updatedPost = await postsCollection.findOne({ _id: new ObjectId(postId) });
    return updatedPost;
}

export async function getPostById(postId) {
    // Validate input
    if (!postId) {
        throw new Error('Post ID is required');
    }
    
    // Check if the postId is a valid ObjectId
    if (!ObjectId.isValid(postId)) {
        throw new Error('Invalid post ID format');
    }
    
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

export async function getPostsByPage(page = 1) {
    if (typeof page !== 'number' || page < 1 || !Number.isInteger(page)) {
        throw new Error('Invalid page number.');
    }

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