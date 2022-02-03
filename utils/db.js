const { MongoClient } = require('mongodb');

const host = process.env.DB_HOST ? process.env.DB_HOST : 'localhost';
const port = process.env.DB_PORT ? process.env.DB_PORT : '27017';
const db = process.env.DB_DATABASE ? process.env.DB_DATABASE : 'files_manager';

const uri = `mongodb://${host}:${port}/${db}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(uri, { useUnifiedTopology: true });
    this.client.connect();
    this.db = this.client.db();
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    const collection = this.db.collection('users');
    return collection.countDocuments();
  }

  async nbFiles() {
    const collection = this.db.collection('files');
    return collection.countDocuments();
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
