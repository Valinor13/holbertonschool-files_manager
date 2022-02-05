const fs = require('fs');
const { ObjectID } = require('mongodb');
const dbClient = require('../utils/db');
const Redis = require('../utils/redis');

const files = dbClient.db.collection('files');

class FilesController {
  static postUpload(req, res) {
    (async () => {
      let decodedData;
      let pId;
      const { name, type, data } = req.body;
      const header = req.headers['x-token'];
      const token = `auth_${header}`;
      const redi = await Redis.get(token);
      if (redi) {
        const userId = new ObjectID(redi);
        const typeList = ['folder', 'file', 'image'];
        if (!name) {
          res.status(400).json({ error: 'Missing name' });
          return res.end();
        }
        if ((!type) || (typeList.includes(type) === false)) {
          res.status(400).json({ error: 'Missing type' });
          return res.end();
        }
        if ((!data) && (type !== 'folder')) {
          res.status(400).json({ error: 'Missing data' });
          return res.end();
        }
        if ((data) && ((type === 'file' || type === 'image'))) {
          const buff = Buffer.from(data, 'base64');
          decodedData = buff.toString('utf-8');
        }
        if (req.body.parentId) {
          pId = new ObjectID(req.body.parentId);
          const file = await files.findOne({ _id: pId });
          if ((!file) || (file._id === redi)) {
            res.status(400).json({ error: 'Parent not found' });
            return res.end();
          }
          if (file.type !== 'folder') {
            res.status(400).json({ error: 'Parent is not a folder' });
            return res.end();
          }
        }
        const newFile = {
          userId,
          name,
          type,
          isPublic: (req.body.isPublic ? req.body.isPublic : false),
          parentId: (req.body.parentId ? pId : 0),
        };
        if (type === 'folder') {
          await files.insertOne(newFile);
          res.status(201).json(newFile);
          return res.end();
        }
        const dir = process.env.FOLDER_PATH || '/tmp/files_manager';
        fs.mkdir(dir, { recursive: true }, () => {
          fs.writeFile(`${dir}/${token.slice(5)}`, decodedData, () => {
            newFile.localPath = dir;
          });
        });
        await files.insertOne(newFile);
        res.status(201).json(newFile);
        return res.end();
      }
      res.status(401).json({ error: 'Unauthorized' });
      return res.end();
    })();
  }

  static getShow(req, res) {
    (async () => {
      const header = req.headers['x-token'];
      const token = `auth_${header}`;
      const redi = await Redis.get(token);
      if (redi) {
        const userId = new ObjectID(redi);
        const _id = new ObjectID(req.params.id);
        console.log(userId);
        console.log(_id);
        const file = files.findOne({ _id, userId });
        if (file) {
          res.status(200).json(file);
          return res.end();
        }
        res.status(404).json({ error: 'Not found' });
        return res.end();
      }
      res.status(401).json({ error: 'Unauthorized' });
      return res.end();
    })();
  }
}

module.exports = FilesController;
