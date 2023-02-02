const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const url = `mongodb://${host}:${port}`;
    MongoClient.connect(url, { useUnifiedTopology: true }, (error, client) => {
      if (!error) {
        this.db = client.db(database);
        this.user = this.db.collection('users');
        this.file = this.db.collection('files');
      } else {
        console.log(error.message);
        this.db = false;
      }
    });
  }

  isAlive() {
    if (this.db) return true;
    return false;
  }

  async nbUsers() {
    return this.user.countDocuments();
  }

  async nbFiles() {
    return this.file.countDocuments();
  }
}

const dbClient = new DBClient();
export default dbClient;
