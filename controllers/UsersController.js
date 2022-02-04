const sha1 = require('sha1');
const { ObjectID } = require('mongodb');
const dbClient = require('../utils/db');
const Redis = require('../utils/redis');

const db = dbClient.db.collection('users');

class UsersController {
  static postNew(req, res) {
    if (!req.body.email) {
      res.status(400).json({ error: 'Missing email' });
    }
    if (!req.body.password) {
      res.status(400).json({ error: 'Missing password' });
    }
    (async () => {
      if (await db.findOne({ email: req.body.email })) {
        res.status(400).json({ error: 'Already exist' });
      }
      const user = await db.insertOne({
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
      const header = req.headers['x-token'];
      const token = `auth_${header}`;
      const redi = await Redis.get(token);
      if (redi) {
        const userId = new ObjectID(redi);
        const user = await db.findOne({ _id: userId });
        res.send(JSON.stringify({ id: redi, email: user.email }));
      } else {
        res.status(401).send(JSON.stringify({ error: 'Unauthorized' }));
      }
      res.end();
    })();
  }
}

module.exports = UsersController;
