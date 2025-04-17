import { createClient } from 'redis';
import { redisConfig } from './settings.js';

let _connection = undefined;

export const getRedisConnection = async () => {
  if (!_connection) {
    _connection = createClient({
      url: redisConfig.url
    });
    
    await _connection.connect();
  }
  
  return _connection;
};

export const closeRedisConnection = async () => {
  if (_connection) {
    await _connection.disconnect();
    _connection = undefined;
  }
}; 