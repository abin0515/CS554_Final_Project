import { users } from '../config/mongoCollections.js';
import * as validation from './validation.js';

export async function upsertUser({ uid, email, displayName }) {
  if (!validation.isValidUid(uid)) throw new Error('Invalid UID');
  if (!validation.isValidEmail(email)) throw new Error('Invalid email');
  if (!validation.isNonEmptyString(displayName)) throw new Error('Invalid display name');

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
  if (!validation.isValidUid(uid)) throw new Error('Invalid UID');
  const usersCol = await users();
  const user = await usersCol.findOne({ uid });
  if (!user) throw new Error('User not found');
  return user;
}

export async function getUserDisplayName(uid) {
  if (!validation.isValidUid(uid)) throw new Error('Invalid UID');
  const user = await getUserByUid(uid);
  return user.displayName || 'Anonymous';
}

export async function getAllUsers() {
  const usersCol = await users();
  const allUsers = await usersCol.find({}).toArray();
  return allUsers.map(u => ({ ...u, _id: u._id?.toString?.() }));
}

export async function doesUserExist(uid) {
  if (!validation.isValidUid(uid)) throw new Error('Invalid UID');
  const usersCol = await users();
  const user = await usersCol.findOne({ uid });
  return !!user;
}

export async function deleteUserByUid(uid) {
  if (!validation.isValidUid(uid)) throw new Error('Invalid UID');
  const usersCol = await users();
  const result = await usersCol.deleteOne({ uid });
  return result.deletedCount > 0;
}

export async function updateDisplayName(uid, newName) {
  if (!validation.isValidUid(uid)) throw new Error('Invalid UID');
  if (!validation.isNonEmptyString(newName)) throw new Error('Invalid display name');

  const usersCol = await users();
  const result = await usersCol.updateOne(
    { uid },
    { $set: { displayName: newName, updatedAt: new Date() } }
  );
  if (result.matchedCount === 0) throw new Error('User not found');
  return true;
}
