import { ObjectId } from 'mongodb';
export function isValidEmail(email) {
    const regex = /^[a-zA-Z0-9]+([._]?[a-zA-Z0-9]+)*@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
    return typeof email === 'string' && regex.test(email.trim());
  }
  
  export function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }
  
  export function isValidUid(uid) {
    return typeof uid === 'string' && uid.trim().length > 5 && !uid.includes(' ');
  }
  

export function isValidPostTitle(title) {
    return typeof title === 'string' && title.trim().length > 3;
  }
  
  export function isValidPostContent(content) {
    return typeof content === 'string' && content.trim().length > 10;
  }
  
  export function isValidPostType(type) {
    const allowedTypes = [0, 1, 2];
    return allowedTypes.includes(Number(type));
  }
  
  export function isValidPostId(postId) {
    return typeof postId === 'string' && /^[a-f\d]{24}$/i.test(postId.trim());
  }

export function isValidObjectId(id) {
  return typeof id === 'string' && ObjectId.isValid(id) && String(new ObjectId(id)) === id;
}