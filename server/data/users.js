import { users } from '../config/mongoCollections.js';
import { ObjectId } from 'mongodb';
import * as validation from './validation.js';

export async function upsertUser({ uid, email, displayName }) {
  const usersCol = await users();
  await usersCol.updateOne(
    { uid },
    {
      $set: {
        email,
        displayName,
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
}

export async function getUserByUid(uid) {
  const usersCol = await users();
  const user = await usersCol.findOne({ uid });
  if (!user) throw new Error('User not found');
  return user;
}

export async function getUserDisplayName(uid) {
  const user = await getUserByUid(uid);
  return user.displayName || 'Anonymous';
}

export async function getAllUsers() {
  const usersCol = await users();
  const allUsers = await usersCol.find({}).toArray();
  return allUsers.map(u => ({ ...u, _id: u._id?.toString?.() }));
}

export async function doesUserExist(uid) {
  const usersCol = await users();
  const user = await usersCol.findOne({ uid });
  return !!user;
}

export async function deleteUserByUid(uid) {
  const usersCol = await users();
  const result = await usersCol.deleteOne({ uid });
  return result.deletedCount > 0;
}

export async function updateDisplayName(uid, newName) {
  const usersCol = await users();
  const result = await usersCol.updateOne(
    { uid },
    { $set: { displayName: newName, updatedAt: new Date() } }
  );
  if (result.matchedCount === 0) throw new Error('User not found');
  return true;
}
