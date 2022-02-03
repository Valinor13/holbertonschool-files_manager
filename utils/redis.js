const { createClient } = require('redis');
const { promisify } = require('util');

class RedisClient {
  constructor() {
    this.client = createClient({ legacyMode: true });
    this.client.on('error', (err) => console.log(err));
    this.getValue = promisify(this.client.get).bind(this.client);
    this.setExValue = promisify(this.client.setex).bind(this.client);
    this.delKey = promisify(this.client.del).bind(this.client);
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    const value = await this.getValue(key);
    return value;
  }

  async set(key, value, duration) {
    await this.setExValue(key, value, duration);
  }

  async del(key) {
    await this.delKey(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
