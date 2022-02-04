const sha1 = require('sha1');
const dbClient = require('../utils/db');

const db = dbClient.db.collection('users');

class UsersController {
  static postNew(req, res) {
    (async () => {
      if (!req.body.email) {
        res.status(400).send(JSON.stringify({ error: 'Missing email' }));
      }
      if (!req.body.password) {
        res.status(400).send(JSON.stringify({ error: 'Missing password' }));
      }
      if (await db.findOne({ email: req.body.email })) {
        res.status(400).send(JSON.stringify({ error: 'Already exist' }));
      } else {
        const hashPw = sha1(req.body.password);
        const doc = { email: req.body.email, password: hashPw };
        const result = await db.insertOne(doc);
        res.status(201).send(JSON.stringify({ id: result.insertedId, email: req.body.email }));
      }
      res.end();
    })();
  }

  static getMe(req, res) {
    (async () => {
      const header = req.headers['x-token'];
      const buff = Buffer.from(header.slice(9), 'base64');
      const decodedHeader = buff.toString('utf-8');
      const token = `auth_${decodedHeader}`;
      const redi = await Redis.get(token);
      if (redi) {
        const user = await db.findOne({ id: redi });
        res.send(JSON.stringify({ id: redi, email: user.email }));
      } else {
        res.status(401).send(JSON.stringify({ error: 'Unauthorized' }));
      }
      res.end();
    })();
  }
}

module.exports = UsersController;
