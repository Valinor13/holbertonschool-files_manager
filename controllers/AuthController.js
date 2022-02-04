const sha1 = require('sha1');
const { v4 } = require('uuid');
const Redis = require('../utils/redis');
const dbClient = require('../utils/db');

const db = dbClient.db.collection('users');

class AuthController {
  static getConnect(req, res) {
    (async () => {
      const header = req.headers.authorization;
      const buff = Buffer.from(header.slice(6), 'base64');
      const decodedHeader = buff.toString('utf-8');
      const epArray = decodedHeader.split(':');
      const user = await db.findOne({ email: epArray[0], password: sha1(epArray[1]) });
      if (user) {
        const newId = v4();
        try {
          const key = `auth_${newId}`;
          console.log(key);
          console.log(user.id);
          await Redis.set(key, user.id, 86400000);
        } catch (e) {
          console.error(e);
        }
        res.status(200).send(JSON.stringify({ token: newId }));
      } else {
        res.status(401).send(JSON.stringify({ error: 'Unauthorized' }));
      }
      res.end();
    })();
  }

  static getDisconnect(req, res) {
    (async () => {
      const header = req.headers['X-Token'];
      const buff = Buffer.from(header.slice(9), 'base64');
      const decodedHeader = buff.toString('utf-8');
      const token = `auth_${decodedHeader}`;
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
