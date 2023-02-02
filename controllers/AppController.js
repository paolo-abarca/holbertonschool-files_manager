import redisClient from '../utils/redis';
import dbClient from '../utils/db';

exports.getStatus = (req, res) => {
  const redis = redisClient.isAlive();
  const db = dbClient.isAlive();
  res.status(200).json({ redis, db });
};

exports.getStats = async (req, res) => {
  const nbUsers = await dbClient.nbUsers();
  const nbFiles = await dbClient.nbFiles();
  res.status(200).json({ users: nbUsers, files: nbFiles });
};
