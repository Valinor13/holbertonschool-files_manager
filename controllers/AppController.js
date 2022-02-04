import { v4 as uuid } from 'uuid';

const sha1 = require('sha1');

const redis = require('../utils/redis');
const db = require('../utils/db');

const users = db.db.collection('users');

class AppController {
  static getStatus(req, res) {
    if (db.isAlive() && redis.isAlive()) {
      return res.status(200).json({
        redis: true,
        db: true,
      });
    }
    return res.status(500);
  }

  static getStats(req, res) {
    (async () => {
      const users = await db.nbUsers();
      const files = await db.nbFiles();
      return res.status(200).json({
        users,
        files,
      });
    })();
  }

  static getConnect(req, res) {
    const header = req.headers.authorization.slice(6);
    const [email, password] = atob(header).split(':');
    const user = users.findOne({ email, password: sha1(password) });
    try {
      const token = uuid();
      redis.set(`auth_${token}`, user.id, 86400);
      return res.status(200).json({
        token,
      });
    } catch (e) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  static getDisconnect(req, res) {
    (async () => {
      try {
        const token = req.headers['x-token'];
        await redis.get(`auth_${token}`);
        await redis.del(`auth_${token}`);
        return res.status(204);
      } catch (e) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    })();
  }
}

module.exports = AppController;
