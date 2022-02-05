const fs = require('fs');
const { ObjectID } = require('mongodb');
const dbClient = require('../utils/db');
const Redis = require('../utils/redis');

const files = dbClient.db.collection('files');

class FilesController {
  static postUpload(req, res) {
    (async () => {
      let decodedData;
      const { name, type, data } = req.body;
      const header = req.headers['x-token'];
      const token = `auth_${header}`;
      const redi = await Redis.get(token);
      if (redi) {
        const userId = new ObjectID(redi);
        const typeList = ['folder', 'file', 'image'];
        if (!name) {
          res.status(400).json({ error: 'Missing name' });
        }
        if ((!type) || (typeList.includes(type) === false)) {
          res.status(400).json({ error: 'Missing type' });
        }
        if ((!data) && (type !== 'folder')) {
          res.status(400).json({ error: 'Missing data' });
        } else if ((data) && ((type === 'file' || type === 'image'))) {
          const buff = Buffer.from(data, 'base64');
          decodedData = buff.toString('utf-8');
        }
        if (req.body.parentId) {
          const file = await files.findOne({ _id: req.body.parentId });
          try {
            if (req.body.parentId === redi) {
              res.status(400).json({ error: 'Parent not found' });
            }
          } catch (e) {
            res.status(400).json({ error: 'Parent not found' });
          }
          if (file._id === req.body.parentId) {
            if (file.type !== 'folder') {
              res.status(400).json({ error: 'Parent is not a folder' });
            }
          }
        }
        const newFile = {
          userId,
          name,
          type,
          isPublic: (req.body.isPublic ? req.body.isPublic : false),
          parentId: (req.body.parentId ? req.body.parentId : 0),
        };
        if (type === 'folder') {
          await files.insertOne(newFile);
          res.status(201).json(newFile);
        } else {
          const dir = process.env.FOLDER_PATH || '/tmp/files_manager';
          fs.mkdir(dir, { recursive: true }, () => {
            fs.writeFile(`${dir}/${token.slice(5)}`, decodedData, () => {
              newFile.localPath = dir;
            });
          });
          res.status(201).json(newFile);
          await files.insertOne(newFile);
        }
      } else {
        res.status(401).json({ error: 'Unauthorized' });
      }
      res.end();
    })();
  }
}

module.exports = FilesController;
