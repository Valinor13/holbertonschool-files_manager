const { createClient } = require('redis');

class RedisClient {
  constructor() {
    this.client = createClient();
  }

  isAlive() {
    let returnBool;
    this.client.on('error', (err) => {
      returnBool = false;
      console.log(err);
    });
    this.client.on('connect', () => { returnBool = true; });
    return returnBool;
  }

  async get(key) {
    return this.client.get(key);
  }

  async set(key, duration) {
    await this.client.set(key, 'value', { EX: duration });
  }

  async del(key) {
    await this.del(key);
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
