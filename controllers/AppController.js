const Redis = require('../utils/redis');
const Db = require('../utils/db');

class AppController {
  static getStatus(req, res) {
    if ((Redis.isAlive() === true) && (Db.isAlive() === true)) {
      res.status(200).send(JSON.stringify({ redis: true, db: true }));
    } else {
      res.status(400).send('Redis and MongoDB not connected');
    }
    res.end();
  }

  static getStats(req, res) {
    (async () => {
      const users = await Db.nbUsers();
      const files = await Db.nbFiles();
      res.status(200).send(JSON.stringify({ users, files }));
      res.end();
    })();
  }
}

module.exports = AppController;
