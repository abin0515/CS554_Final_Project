import * as mongoCollection from '../config/mongoCollections.js';


export async function createMessage(roomId, msg) {
    console.log('message create')
    const messagesCollection = await mongoCollection.messages();
  await messagesCollection.insertOne({ roomId, ...msg });
}

export async function getMessagesForChat(roomId) {
    const messagesCollection = await mongoCollection.messages();
  return messagesCollection.find({ roomId }).sort({ timestamp: 1 }).toArray();
}
