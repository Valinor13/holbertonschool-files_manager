const { v4: uuid } = require('uuid');
const sha1 = require('sha1');
const redis = require('../utils/redis');
const db = require('../utils/db');

const users = db.db.collection('users');

class AuthController {
  static getConnect(req, res) {
    (async () => {
      try {
        const header = req.headers.authorization;
        const [email, password] = Buffer.from(header.slice(6), 'base64').toString().split(':');
        const user = await users.findOne({ email, password: sha1(password) });
        const token = uuid();
        redis.set(`auth_${token}`, user._id, 86400);
        return res.status(200).json({
          token,
        });
      } catch (e) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    })();
  }

  static getDisconnect(req, res) {
    (async () => {
      const header = req.headers['x-token'];
      const token = `auth_${header}`;
      if (await redis.get(token)) {
        try {
          await redis.del(token);
          res.sendStatus(204);
        } catch (e) {
          console.error(e);
        }
      } else {
        res.status(401).send(JSON.stringify({ error: 'Unauthorized' }));
      }
      res.end();
    })();
  }
}

module.exports = AuthController;
