import sha1 from 'sha1';
import Queue from 'bull';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

const userQ = new Queue('userQ');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) return res.status(400).send({ error: 'Missing email' });
    if (!password) return res.status(400).send({ error: 'Missing password' });
    const emailExists = await dbClient.users.findOne({ email });
    if (emailExists) return res.status(400).send({ error: 'Already exist' });

    const pwd = sha1(password);

    const insertStat = await dbClient.users.insertOne({
      email,
      password: pwd,
    });

    const createdUser = {
      id: insertStat.insertedId,
      email,
    };

    await userQ.add({
      userId: insertStat.insertedId.toString(),
    });

    return res.status(201).send(createdUser);
  }

  static async getMe(req, res) {
    async function getIdKey(req) {
      const userInfo = { userId: null, key: null };

      const token = req.header('X-Token');
      if (!token) return userInfo;

      userInfo.key = `auth_${token}`;
      userInfo.userId = await redisClient.get(userInfo.key);

      return userInfo;
    }
    const { userId } = await getIdKey(req);

    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const userInfo = { id: user._id, ...user };
    delete userInfo._id;
    delete userInfo.password;

    return res.status(200).send(userInfo);
  }
}

export default UsersController;
