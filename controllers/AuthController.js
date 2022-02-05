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
        res.status(401).json({ error: 'Unauthorized' });
      } else {
        const user = await users.findOne({ email, password: sha1(password) });
        if (user) {
          const newId = uuid();
          try {
            const key = `auth_${newId}`;
            await Redis.set(key, user._id.toString(), 86400);
          } catch (e) {
            console.error(e);
          }
          res.status(200).json({ token: newId });
        } else {
          res.status(401).json({ error: 'Unauthorized' });
        }
      }
      res.end();
    })();
  }

  static getDisconnect(req, res) {
    (async () => {
      const header = req.headers['x-token'];
      const token = `auth_${header}`;
      if (await Redis.get(token)) {
        try {
          await Redis.del(token);
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
