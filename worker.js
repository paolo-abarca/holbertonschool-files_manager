import Queue from 'bull';
import { ObjectId } from 'mongodb';
import { writeFileSync } from 'fs';
import dbClient from './utils/db';

const imageThumbnail = require('image-thumbnail');

const fileQ = new Queue('fileQ');
const userQ = new Queue('userQ');

const createThumb = async (path, options) => {
  try {
    const thumbnail = await imageThumbnail(path, options);
    const thumbPath = `${path}_${options.width}`;
    writeFileSync(thumbPath, thumbnail);
  } catch (err) {
    console.log(err);
  }
};

fileQ.process(async (job) => {
  const { fileId, userId } = job.data;
  if (!fileId) throw Error('Missing fileId');
  if (!userId) throw Error('Missing userId');

  const file = dbClient.files.findOne({ _id: ObjectId(fileId), userId: ObjectId(userId) });
  if (!file) throw Error('File not found');

  createThumb(file.localPath, { width: 500 });
  createThumb(file.localPath, { width: 250 });
  createThumb(file.localPath, { width: 100 });
});

userQ.process(async (job) => {
  const { userId } = job.data;
  if (!userId) throw Error('Missing userId');

  const user = dbClient.users.findOne({ _id: ObjectId(userId) });
  if (!user) throw Error('User not found');

  console.log(`Welcome ${user.email}`);
});
