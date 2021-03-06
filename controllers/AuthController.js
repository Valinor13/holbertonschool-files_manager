const sha1 = require('sha1');
const { v4: uuid } = require('uuid');
const Redis = require('../utils/redis');
const dbClient = require('../utils/db');

const users = dbClient.db.collection('users');

class AuthController {
  static getConnect(req, res) {
    (async () => {
      const header = req.headers.authorization;
      const buff = Buffer.from(header.slice(6), 'base64');
      const decodedHeader = buff.toString('utf-8');
      const [email, password] = decodedHeader.split(':');
      if (!password) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const user = await users.findOne({ email, password: sha1(password) });
      if (user) {
        const newId = uuid();
        const key = `auth_${newId}`;
        await Redis.set(key, user._id.toString(), 86400);
        return res.status(200).json({ token: newId });
      }
      return res.status(401).json({ error: 'Unauthorized' });
    })();
  }

  static getDisconnect(req, res) {
    (async () => {
      const header = req.headers['x-token'];
      const token = `auth_${header}`;
      if (await Redis.get(token)) {
        await Redis.del(token);
        return res.sendStatus(204);
      }
      return res.status(401).json({ error: 'Unauthorized' });
    })();
  }
}

module.exports = AuthController;
