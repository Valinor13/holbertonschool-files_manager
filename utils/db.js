const { MongoClient } = require('mongodb');

const host = process.env.DB_HOST ? process.env.DB_HOST : 'localhost';
const port = process.env.DB_PORT ? process.env.DB_PORT : '27017';
const db = process.env.DB_DATABASE ? process.env.DB_DATABASE : 'files_manager';
const uri = `mongodb://${host}:${port}/${db}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(uri, { useUnifiedTopology: true });
    this.client.connect();
  }

  isAlive() {
    this.client.isConnected();
  }

  async nbUsers() {
    const usersDb = this.client.db(db);
    const users = usersDb.collection('users');
    return users.countDocuments();
  }

  async nbFiles() {
    const filesDb = this.client.db(db);
    const files = filesDb.collection('files');
    return files.countDocuments();
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
