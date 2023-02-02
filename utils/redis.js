import { createClient } from 'redis';

const { promisify } = require('util');

class RedisClient {
  constructor() {
    this.client = createClient();
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.alive = true;
    this.client.on('error', (error) => {
      console.log(error);
    });
  }

  isAlive() {
    this.client.on('connect', () => {
      this.alive = true;
    });

    this.client.on('error', () => {
      this.alive = false;
    });
    return this.alive;
  }

  async get(key) {
    return this.getAsync(key);
  }

  async set(key, value, duration) {
    this.client.set(key, value, 'EX', duration);
  }

  async del(key) {
    this.client.del(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
