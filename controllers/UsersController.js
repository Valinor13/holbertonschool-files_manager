const sha1 = require('sha1');
const dbClient = require('../utils/db');

const db = dbClient.db.collection('users');

class UsersController {
  static postNew(req, res) {
    (async () => {
      if (!req.params.email) {
        res.status(400).send('Missing email');
      }
      if (!req.params.password) {
        res.status(400).send('Missing password');
      }
      if (await db.findOne({ email: req.params.email })) {
        res.status(400).send('Already exist');
      } else {
        const hashPw = sha1(req.params.password);
        const doc = { email: req.params.email, password: hashPw };
        const result = await db.insertOne(doc);
        res.status(201).send(JSON.stringify({ id: result.insertedId, email: req.params.email }));
      }
      res.end();
    })();
  }
}

module.exports = UsersController;
