import { ObjectId } from 'mongodb';

const emailRegex = /^[a-zA-Z0-9]+([._]?[a-zA-Z0-9]+)*@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;

export function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  return emailRegex.test(email.trim());
}

export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isValidUid(uid) {
  return typeof uid === 'string' && uid.trim().length > 5 && !uid.includes(' ');
}

export function checkId(id, variableName = 'ID') {
  if (!id || typeof id !== 'string') {
    throw new Error(`${variableName} must be a non-empty string`);
  }

  id = id.trim();
  if (id.length === 0) {
    throw new Error(`${variableName} cannot be an empty string`);
  }

  if (!ObjectId.isValid(id)) {
    throw new Error(`${variableName} is not a valid ObjectId`);
  }

  return id;
}

export function checkString(input, variableName = 'Input') {
  if (typeof input !== 'string') {
    throw new Error(`${variableName} must be a string`);
  }
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    throw new Error(`${variableName} cannot be an empty string`);
  }
  return trimmed;
}

export function checkStringArray(arr, variableName = 'Array') {
  if (!Array.isArray(arr)) {
    throw new Error(`${variableName} must be an array`);
  }

  const validated = arr.map((item, index) => {
    if (typeof item !== 'string') {
      throw new Error(`${variableName}[${index}] must be a string`);
    }
    const trimmed = item.trim();
    if (trimmed.length === 0) {
      throw new Error(`${variableName}[${index}] cannot be empty`);
    }
    return trimmed;
  });

  return validated;
}

export function checkPostType(type) {
  if (typeof type !== 'number' || !Number.isInteger(type) || type < 0) {
    throw new Error('Post type must be a non-negative integer');
  }
  return type;
}
