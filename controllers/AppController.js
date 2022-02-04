const redis = require('../utils/redis');
const db = require('../utils/db');

class AppController {
  static getStatus(req, res) {
    if (db.isAlive() && redis.isAlive()) {
      return res.status(200).json({
        redis: true,
        db: true,
      });
    }
    return res.status(500);
  }

  static getStats(req, res) {
    (async () => {
      const users = await db.nbUsers();
      const files = await db.nbFiles();
      return res.status(200).json({
        users,
        files,
      });
    })();
  }
}

module.exports = AppController;
