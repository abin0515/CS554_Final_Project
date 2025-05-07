import { ObjectId } from 'mongodb';
import * as mongoCollection from '../config/mongoCollections.js';


const repliesCollection = await mongoCollection.replies();

/**
 * Inserts a new reply document into the database.
 * @param {object} newReplyData - The reply object to insert (should not include _id).
 * @returns {Promise<object>} The newly created reply object with a string _id.
 */
export const createReplyInDB = async (newReplyData) => {
    // Add necessary validation for newReplyData fields if needed here
    // Ensure required fields are present, etc.

    const insertInfo = await repliesCollection.insertOne(newReplyData);
    if (!insertInfo.acknowledged || !insertInfo.insertedId) {
        throw new Error('Could not add reply to database.');
    }

    return await getReplyByIdFromDB(insertInfo.insertedId.toString());
};

/**
 * Finds a reply by its ID.
 * @param {string} replyId - The ID of the reply to find.
 * @returns {Promise<object|null>} The reply object or null if not found.
 */
export const getReplyByIdFromDB = async (replyId) => {
    
    const reply = await repliesCollection.findOne({ _id: new ObjectId(replyId) });
    if (!reply) {
        return null; // Return null instead of throwing, service layer can handle 'not found'
    }
    reply._id = reply._id.toString(); // Convert ObjectId to string
    // Convert other ObjectIds if necessary (post_id, user_id, etc.) before returning
    if(reply.post_id) reply.post_id = reply.post_id.toString();
    if(reply.user_id) reply.user_id = reply.user_id.toString();
    if(reply.parent_reply_id) reply.parent_reply_id = reply.parent_reply_id.toString();
    if(reply.target_user_id) reply.target_user_id = reply.target_user_id.toString();

    return reply;
};


/**
 * Increments the reply_times count for a specific reply.
 * @param {string} replyId - The ID of the reply to update.
 * @returns {Promise<boolean>} True if the update was acknowledged.
 */
export const incrementReplyCountInDB = async (replyId) => {
    
    const updateResult = await repliesCollection.updateOne(
        { _id: new ObjectId(replyId) },
        { $inc: { reply_times: 1 }, $set: { update_time: new Date() } }
    );

    if (updateResult.matchedCount === 0) {
         // Optionally throw an error or just return false if the reply wasn't found
         console.warn(`Attempted to increment reply count for non-existent reply ID: ${replyId}`);
         return false;
    }
    return updateResult.acknowledged;
};


/**
 * Retrieves all replies for a given post ID, sorted by creation time (newest first).
 * @param {string} postId - The ID of the post.
 * @returns {Promise<Array<object>>} An array of reply objects.
 */
export const getRepliesByPostIdFromDB = async (postId) => {
    // Basic validation for ObjectId format at data layer is good practice
    if (!ObjectId.isValid(postId)) {
        throw new Error(`Invalid Post ID format: ${postId}`);
    }

    const replies = await repliesCollection
        .find({ post_id: postId })
        .sort({ create_time: -1 }) // Sort by newest first
        .toArray();

    // Convert ObjectIds to strings for each reply
    return replies.map(reply => {
        reply._id = reply._id.toString();
        if(reply.post_id) reply.post_id = reply.post_id.toString();
        if(reply.user_id) reply.user_id = reply.user_id.toString();
        if(reply.parent_reply_id) reply.parent_reply_id = reply.parent_reply_id.toString();
        if(reply.target_user_id) reply.target_user_id = reply.target_user_id.toString();
        return reply;
    });
};

/**
 * Retrieves sub-replies for a given top-level answer ID within a post, sorted by creation time (oldest first).
 * @param {string} postId - The ID of the post.
 * @param {string} answerId - The ID of the top-level answer reply.
 * @returns {Promise<Array<object>>} An array of sub-reply objects.
 */
export const getSubRepliesByAnswerIdFromDB = async (postId, answerId) => {
    // Validate IDs
    // if (!ObjectId.isValid(postId)) {
    //     throw new Error(`Invalid Post ID format: ${postId}`);
    // }
    // if (!ObjectId.isValid(answerId)) {
    //     throw new Error(`Invalid Answer ID format: ${answerId}`);
    // }

    const subReplies = await repliesCollection
        .find({
            post_id: postId,
            answer_id: answerId,
            // Exclude the answer itself
        })
        .sort({ create_time: 1 }) // Sort by oldest first for conversation flow
        .toArray();

    // Convert ObjectIds to strings
    return subReplies.map(reply => {
        reply._id = reply._id.toString();
        if(reply.post_id) reply.post_id = reply.post_id.toString();
        if(reply.user_id) reply.user_id = reply.user_id.toString();
        if(reply.answer_id) reply.answer_id = reply.answer_id.toString();
        if(reply.parent_reply_id) reply.parent_reply_id = reply.parent_reply_id.toString();
        if(reply.target_user_id) reply.target_user_id = reply.target_user_id.toString();
        return reply;
    });
};
export const incrementReplyLikeTimes = async (bizId) => {
    console.log('incrementReplyLikeTimes', bizId);
    
    const updateResult = await repliesCollection.updateOne(
        { _id: new ObjectId(bizId) },
        { $inc: { liked_times: 1 }, $set: { update_time: new Date() } }
    );
    return updateResult.acknowledged;
}

export const decrementReplyLikeTimes = async (bizId) => {
    console.log('decrementReplyLikeTimes', bizId);
    const updatedReply = await repliesCollection.findOneAndUpdate(
        { _id: new ObjectId(bizId), liked_times: { $gt: 0 } }, 
        { $inc: { liked_times: -1 }, $set: { update_time: new Date() } },
        { returnDocument: 'after' } 
    );
    
    return !!updatedReply; 
}
export const incrementReplyTimesInDB = async (answerId) => {
    const updateResult = await repliesCollection.updateOne(
        { _id: new ObjectId(answerId) },
        { $inc: { reply_times: 1 }, $set: { update_time: new Date() } }
    );
    return updateResult.acknowledged;
}
// Add other data functions as needed (e.g., deleteReplyFromDB)
