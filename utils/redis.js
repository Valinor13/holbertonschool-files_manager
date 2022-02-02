const { createClient } = require('redis');

class RedisClient {
  constructor() {
    (async () => {
      this.client = createClient();
      this.client.on('error', (err) => console.log(err));
    })
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    const value = await this.client.get(key);
    return value;
  }

  async set(key, duration) {
    await this.client.set(key, 'value', { EX: duration });
  }

  async del(key) {
    await this.client.del(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
