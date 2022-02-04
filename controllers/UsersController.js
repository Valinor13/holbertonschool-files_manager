const sha1 = require('sha1');
const { ObjectID } = require('mongodb');
const db = require('../utils/db');
const redis = require('../utils/redis');

const users = db.db.collection('users');

class UsersController {
  static postNew(req, res) {
    if (!req.body.email) {
      res.status(400).json({ error: 'Missing email' });
    }
    if (!req.body.password) {
      res.status(400).json({ error: 'Missing password' });
    }
    (async () => {
      if (await users.findOne({ email: req.body.email })) {
        res.status(400).json({ error: 'Already exist' });
      }
      const user = await users.insertOne({
        email: req.body.email,
        password: sha1(req.body.password),
      });
      res.status(200).json({
        id: user.insertedId,
        email: req.body.email,
      });
    })();
  }

  static getMe(req, res) {
    (async () => {
      const token = req.headers['x-token'];
      const redisId = await redis.get(`auth_${token}`);
      if (redisId) {
        const dbId = new ObjectID(redisId);
        const user = await users.findOne({ _id: dbId });
        console.log(redisId);
        console.log(dbId);
        console.log(user._id);
        res.status(200).json({
          id: user._id,
          email: user.email,
        });
      } else {
        res.status(401).json({ error: 'Unauthorized' });
      }
    })();
  }
}

module.exports = UsersController;
