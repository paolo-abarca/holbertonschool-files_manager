import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const Authorization = req.header('Authorization') || '';

    const credentials = Authorization.split(' ')[1];
    if (!credentials) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const decodecredentials = Buffer.from(credentials, 'base64').toString('utf-8');
    const email = decodecredentials.split(':')[0];
    const pwd = decodecredentials.split(':')[1];
    if (!email || !pwd) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const sha1pwd = sha1(pwd);
    const user = await dbClient.users.findOne({
      email,
      password: sha1pwd,
    });
    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const token = uuidv4();
    const key = `auth_${token}`;
    const expr = 86400; // 24hrs in seconds

    await redisClient.set(key, user._id.toString(), expr);

    return res.status(200).send({ token });
  }

  static async getDisconnect(req, res) {
    async function getIdKey(req) {
      const userInfo = { userId: null, key: null };

      const token = req.header('X-Token');
      if (!token) return userInfo;

      userInfo.key = `auth_${token}`;
      userInfo.userId = await redisClient.get(userInfo.key);

      return userInfo;
    }
    const { userId, key } = await getIdKey(req);

    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    await redisClient.del(key);

    return res.status(204).send();
  }
}

export default AuthController;
