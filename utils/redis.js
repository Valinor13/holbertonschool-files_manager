const { createClient } = require('redis');
import e from 'express';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient({ legacyMode: true });
    this.client.connect();
    this.client.on('error', (err) => console.log(err));
    this.getValue = promisify(this.client.get).bind(this.client);
  }

  isAlive() {
    if (this.client.ping() === 'pong')
    {
      return true;
    }
    return false;
  }

  async get(key) {
    const value = await this.getValue(key);
    return value;
  }

  async set(key, value, duration) {
    await this.client.set(key, value);
    await this.client.expire(key, duration);
  }

  async del(key) {
    await this.client.del(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
