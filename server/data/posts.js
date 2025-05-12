import { ObjectId } from 'mongodb';
import * as mongoCollection from '../config/mongoCollections.js';
import * as validation from './validation.js';
import admin from 'firebase-admin';

const postsCollection = await mongoCollection.posts();

/**
 * Get a post by ID directly from the database
 */
export async function getPostByIdFromDB(postId) {
    const validPostId = validation.checkId(postId, 'Post ID');
    const post = await postsCollection.findOne({ _id: new ObjectId(validPostId) });

    if (!post) {
        throw new Error('Post not found');
    }

    post._id = post._id.toString();
    return post;
}

/**
 * Create a new post in the database
 */
export async function createPostInDB(title, content, image_urls, user_id, type) {
    const validTitle = validation.checkString(title, 'Post title');
    const validContent = validation.checkString(content, 'Post content');
    const validImageUrls = validation.checkStringArray(image_urls, 'Image URLs');
    const validUserId = validation.checkString(user_id, 'User ID');
    const userRecord = await admin.auth().getUser(validUserId);
    const userDisplayName = userRecord.displayName || '';

    const newPost = {
        title: validTitle,
        content: validContent,
        image_urls: validImageUrls,
        user_id: validUserId,
        user_display_name: userDisplayName,
        latest_reply_id: 0,
        type: type,
        total_like_times: 0,
        reply_times: 0,
        create_time: new Date(),
        update_time: new Date()
    };

    const insertInfo = await postsCollection.insertOne(newPost);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
        throw new Error('Could not create post');
    }

    newPost._id = insertInfo.insertedId.toString();
    return newPost;
}

/**
 * Update a post in the database
 */
export async function updatePostInDB(postId, updateData) {
    const validPostId = validation.checkId(postId, 'Post ID');
    const updateFields = {};

    if (updateData.title !== undefined) {
        updateFields.title = updateData.title;
    }
    if (updateData.content !== undefined) {
        updateFields.content = updateData.content;
    }
    if (updateData.image_urls !== undefined) {
        updateFields.image_urls = Array.isArray(updateData.image_urls) ? updateData.image_urls : [];
    }

    if (Object.keys(updateFields).length === 0) {
        return await getPostByIdFromDB(validPostId);
    }

    updateFields.update_time = new Date();

    const result = await postsCollection.updateOne(
        { _id: new ObjectId(validPostId) },
        { $set: updateFields }
    );

    if (result.matchedCount === 0) {
        throw new Error('Could not find post to update');
    }

    return await getPostByIdFromDB(validPostId);
}

/**
 * Delete a post from the database
 */
export async function deletePostFromDB(postId) {
    const validPostId = validation.checkId(postId, 'Post ID');
    const deleteInfo = await postsCollection.deleteOne({ _id: new ObjectId(validPostId) });

    if (deleteInfo.deletedCount === 0) {
        throw new Error('Could not delete post');
    }

    return true;
}

/**
 * Get posts by page, sorted by newest first
 */
export async function getPostsByPageFromDB(page) {
    const skip = (page - 1) * 10;
    const limit = 10;

    const posts = await postsCollection
        .find({})
        .sort({ create_time: -1 }) // 👈 Newest first
        .skip(skip)
        .limit(limit)
        .toArray();

    if (!posts || posts.length === 0) return [];

    return posts.map((p) => ({
        ...p,
        _id: p._id.toString(),
    }));
}

/**
 * Get total posts from the database
 */
export async function getTotalPostsFromDB() {
    return await postsCollection.countDocuments();
}

/**
 * Increment the reply count for a post
 */
export async function incrementPostReplyCountInDB(postId) {
    const validPostId = validation.checkId(postId, 'Post ID');
    const updateResult = await postsCollection.updateOne(
        { _id: new ObjectId(validPostId) },
        { $inc: { reply_times: 1 }, $set: { update_time: new Date() } }
    );

    if (updateResult.matchedCount === 0) {
        console.warn(`Attempted to increment reply count for non-existent post ID: ${postId}`);
        return false;
    }

    return updateResult.acknowledged;
}

/**
 * Increment likes
 */
export const incrementPostTotalLikeNumInDB = async (postId) => {
    const validPostId = validation.checkId(postId, 'Post ID');
    const updateResult = await postsCollection.updateOne(
        { _id: new ObjectId(validPostId) },
        { $inc: { total_like_times: 1 }, $set: { update_time: new Date() } }
    );
    return updateResult.acknowledged;
};

/**
 * Decrement likes
 */
export const decrementPostTotalLikeNumInDB = async (postId) => {
    const validPostId = validation.checkId(postId, 'Post ID');
    const updateResult = await postsCollection.findOneAndUpdate(
        { _id: new ObjectId(validPostId), total_like_times: { $gt: 0 } },
        { $inc: { total_like_times: -1 }, $set: { update_time: new Date() } },
        { returnDocument: 'after' }
    );
    return !!updateResult;
};

/**
 * Get posts by user ID, sorted by newest first
 */
export async function getPostsByUserId(userId) {
    const posts = await postsCollection
        .find({ user_id: userId })
        .sort({ create_time: -1 }) // 👈 Newest first
        .toArray();

    return posts.map((p) => ({
        ...p,
        _id: p._id.toString()
    }));
}
