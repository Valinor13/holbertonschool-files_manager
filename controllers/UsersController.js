const sha1 = require('sha1');
const { ObjectID } = require('mongodb');
const db = require('../utils/db');
const redis = require('../utils/redis');

const users = db.db.collection('users');

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
      try {
        const token = req.headers['x-token'];
        const redisId = await redis.get(`auth_${token}`);
        const dbId = new ObjectID(redisId);
        const user = await users.findOne({ _id: dbId });
        res.status(200).json({
          id: user._id,
          email: user.email,
        });
      } catch (e) {
        res.status(401).json({ error: 'Unauthorized' });
      }
    })();
  }
}

module.exports = UsersController;
