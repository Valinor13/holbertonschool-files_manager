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
          return res.status(400).json({ error: 'Missing name' });
        }
        if ((!type) || (typeList.includes(type) === false)) {
          return res.status(400).json({ error: 'Missing type' });
        }
        if ((!data) && (type !== 'folder')) {
          return res.status(400).json({ error: 'Missing data' });
        }
        if ((data) && ((type === 'file' || type === 'image'))) {
          const buff = Buffer.from(data, 'base64');
          decodedData = buff.toString('utf-8');
        }
        if (req.body.parentId) {
          pId = new ObjectID(req.body.parentId);
          const file = await files.findOne({ _id: pId });
          if ((!file) || (file._id === redi)) {
            return res.status(400).json({ error: 'Parent not found' });
          }
          if (file.type !== 'folder') {
            return res.status(400).json({ error: 'Parent is not a folder' });
          }
        }
        console.log('passed error checks');
        const newFile = {
          userId,
          name,
          type,
          isPublic: (req.body.isPublic ? req.body.isPublic : false),
          parentId: (req.body.parentId ? pId : new ObjectID(0)),
        };
        if (type === 'folder') {
          res.status(201).json(newFile);
          await files.insertOne(newFile);
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
        return res.status(401).json({ error: 'Unauthorized' });
      }
      return res.end();
    })();
  }
}

module.exports = FilesController;
