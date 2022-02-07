const fs = require('fs');
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
    const [filename, ext] = job.data.name.split('.');
    const thumb500 = await imageThumbnail(job.data.name, { width: 500, height: 500 });
    const thumb250 = await imageThumbnail(job.data.name, { width: 250, height: 250 });
    const thumb100 = await imageThumbnail(job.data.name, { width: 100, height: 100 });
    fs.mkdirSync('./resources/images/', { recursive: true });
    fs.writeFile(`./resources/images/${filename}.${ext}_500`, thumb500, (err) => {
      if (err) console.log(err);
    });
    fs.writeFile(`./resources/images/${filename}.${ext}_250`, thumb250, (err) => {
      if (err) console.log(err);
    });
    fs.writeFile(`./resources/images/${filename}.${ext}_100`, thumb100, (err) => {
      if (err) console.log(err);
    });
    // await imageThumbnail(`resources/images/${job.data.name}_250`, { width: 250 });
    // await imageThumbnail(`resources/images/${job.data.name}_100`, { width: 100 });
    done();
  });
}

export {
  addFile,
  processFile,
};
