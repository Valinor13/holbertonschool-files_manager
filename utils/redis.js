const { createClient } = require('redis');
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    setTimeout(() => {}, 100);
    this.client.on('error', (err) => console.log(err));
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    const getValue = promisify(this.client.get).bind(this.client);
    const value = await getValue(key);
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
