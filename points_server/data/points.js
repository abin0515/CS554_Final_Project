import { dbConnection } from '../config/mongoConnection.js';

import { ObjectId, Long, Int32 } from 'mongodb';
import * as mongoCollection from '../config/mongoCollections.js';

const pointsCollection = await mongoCollection.points();

export const createPoints = async (userId, type, point, timestamp) => {
    const points = await pointsCollection.insertOne({ userId, type, point, timestamp });
    return points;
}
