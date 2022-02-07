const Bull = require('bull');
const imageThumbnail = require('image-thumbnail');
const dbClient = require('./utils/db');

const fileQueue = new Bull('image transcoding', 'redis://127.0.0.1:6379');
const files = dbClient.db.collection('files');

async function addFile(data) {
  fileQueue.add(data);
}

async function processFile(userId, fileId) {
  if (!fileId) {
    throw new Error('Missing fileId');
  }
  if (!userId) {
    throw new Error('Missing userId');
  }
  const file = await files.findOne({ userId, _id: fileId });
  if (!file) {
    throw new Error('File not found');
  }
  fileQueue.process(async (job, done) => {
    await imageThumbnail(`resources/images/${job.data.name}_500`, { width: 500 });
    await imageThumbnail(`resources/images/${job.data.name}_250`, { width: 250 });
    await imageThumbnail(`resources/images/${job.data.name}_100`, { width: 100 });
    done();
  });
}

export {
  addFile,
  processFile,
};
