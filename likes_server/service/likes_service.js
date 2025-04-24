import { getRedisConnection, closeRedisConnection } from '../config/redisConnection.js';

const LIKE_BIZ_KEY_PREFIX = 'likes:set:biz:';
const LIKE_COUNT_KEY_PREFIX = "likes:times:type:";
const redisClient = await getRedisConnection();




export const getLikesStatusByBizIds = async (bizType, bizIds) => {
    const userId = '2001';// user hardcoded for now
    const result = [];
    for (const bizId of bizIds) {
        const key = `${LIKE_BIZ_KEY_PREFIX}${bizId}`;
        const isLiked = await redisClient.sIsMember(key, userId);
        if(isLiked){
            result.push(bizId);
        }
        
    }
    return result;
};

export const addLikeRecord = async (bizId, bizType, liked) => {
    const userId = '2001';// user hardcoded for now

    const flag = liked ? await doLiked(bizId, userId) : await doUnliked(bizId, userId);

    // calculate liked times based on redis
    const key = `${LIKE_BIZ_KEY_PREFIX}${bizId}`;
    const likedTimes = await redisClient.sCard(key);
    const bizTypeTotalLikeKey = `${LIKE_COUNT_KEY_PREFIX}${bizType}`;
    await redisClient.hSet(bizTypeTotalLikeKey, bizId, likedTimes);
};

const doLiked = async (bizId, userId) => {
    
    const key = `${LIKE_BIZ_KEY_PREFIX}${bizId}`;
    const result = await redisClient.sIsMember(key, userId);
    
    const addResult = await redisClient.sAdd(key, userId);
    console.log(`Adding like for user ${userId} to biz ${bizId}. Result: ${addResult}`);
    return addResult > 0;
};

const doUnliked = async (bizId, userId) => {
    
    const key = `${LIKE_BIZ_KEY_PREFIX}${bizId}`;
    const result = await redisClient.sRem(key, userId);
    console.log(`Removing like for user ${userId} from biz ${bizId}. Result: ${result}`);
    return result > 0;
};





