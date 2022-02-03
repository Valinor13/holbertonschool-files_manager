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
}

module.exports = UsersController;
