const { createClient } = require('redis').createClient;

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

module.exports.redisClient = RedisClient;
