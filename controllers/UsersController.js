const sha1 = require('sha1');
const { ObjectID } = require('mongodb');
const dbClient = require('../utils/db');
const Redis = require('../utils/redis');

const users = dbClient.db.collection('users');

class UsersController {
  static postNew(req, res) {
    (async () => {
      const { email, password } = req.body;
      if (!email) {
        res.status(400).json({ error: 'Missing email' });
        return res.end();
      }
      if (!password) {
        res.status(400).json({ error: 'Missing password' });
        return res.end();
      }
      if (await users.findOne({ email })) {
        res.status(400).json({ error: 'Already exist' });
        return res.end();
      }
      const hashPw = sha1(password);
      const doc = { email, password: hashPw };
      const result = await users.insertOne(doc);
      res.status(201).json({ id: result.insertedId, email });
      return res.end();
    })();
  }

  static getMe(req, res) {
    (async () => {
      const header = req.headers['x-token'];
      const token = `auth_${header}`;
      const redi = await Redis.get(token);
      if (redi) {
        const userId = new ObjectID(redi);
        const user = await users.findOne({ _id: userId });
        res.json({ id: redi, email: user.email });
        return res.end();
      }
      res.status(401).json({ error: 'Unauthorized' });
      return res.end();
    })();
  }
}

module.exports = UsersController;
