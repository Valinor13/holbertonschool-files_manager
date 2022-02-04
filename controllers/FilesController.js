const fs = require('fs');
const { ObjectID } = require('mongodb');
const redis = require('../utils/redis');
const db = require('../utils/db');

const files = db.db.collection('files');

class FilesController {
  static postUpload(req, res) {
    const { name, type, data } = req.body;
    if (!name) res.status(400).json({ error: 'Missing name' });
    if ((!type) || (type !== 'folder' && type !== 'file' && type !== 'image')) {
      res.status(400).json({ error: 'Missing type' });
    }
    if ((!data) && type !== 'folder') res.status(400).json({ error: 'Missing data' });
    const parentId = req.body.parentId ? req.body.parentId : 0;
    const isPublic = req.body.isPublic ? req.body.isPublic : false;
    (async () => {
      try {
        const token = req.headers['x-token'];
        const redisId = await redis.get(`auth_${token}`);
        const dbId = new ObjectID(redisId);
        const file = await files.findOne({ _id: dbId });
        if (file) {
          if (parentId !== file._id) res.status(400).json({ error: 'Parent not found' });
          if (parentId === file._id && file.type !== 'folder') res.status(400).json({ error: 'Parent is not a folder' });
          await files.insertOne({
            name,
            type,
            owner: token,
          });
          res.status(201);
        }
        const relPath = process.env.FOLDER_PATH ? process.env.FOLDER_PATH : '/tmp/files_manager';
        const absPath = relPath;
        const newFile = {
          userId: dbId,
          name,
          type,
          parentId,
          isPublic,
        };
        fs.mkdir(absPath, { recursive: true }, () => {
          console.log('Created folder');
          fs.writeFile(absPath + token, data, () => {
            console.log('Created file');
            newFile.localPath = absPath;
          });
        });
        await files.insertOne(newFile);
        res.status(201).send(newFile);
      } catch (e) {
        res.status(401).json({ error: 'Unauthorized' });
      }
      res.end();
    })();
  }
}

module.exports = FilesController;
