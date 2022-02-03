const { MongoClient } = require('mongodb');

const uri = `mongodb://${
  process.env.DB_HOST ? process.env.DB_HOST : 'localhost'
}:${process.env.DB_PORT ? process.env.DB_PORT : '27017'
}/${process.env.DB_DATABASE ? process.env.DB_DATABASE : 'files_manager'
}`;

class DBClient {
  constructor() {
    this.client = new MongoClient(uri, { useUnifiedTopology: true });
    this.client.connect();
  }

  isAlive() {
    this.client.isConnected();
  }

  async nbUsers() {
    return this.client.listCollections('users');
  }

  async nbFiles() {
    return this.client.listCollections('files');
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
