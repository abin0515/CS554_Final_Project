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

// Add other data functions as needed (e.g., getRepliesByPostIdFromDB, deleteReplyFromDB)
