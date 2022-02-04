const sha1 = require('sha1');
const dbInstance = require('../utils/db');

const db = dbInstance.db.collection('users');

class UsersController {
  static postNew(req, res) {
    if (!req.body.email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!req.body.password) {
      return res.status(400).json({ error: 'Missing password' });
    }
    (async () => {
      if (await db.findOne({ email: req.body.email })) {
        return res.status(400).json({ error: 'Already exist' });
      }
      const user = await db.insertOne({
        email: req.body.email,
        password: sha1(req.body.password),
      });
      return res.status(200).json({
        id: user.insertedId,
        email: req.body.email,
      });
    })();
    return null;
  }
}

module.exports = UsersController;
