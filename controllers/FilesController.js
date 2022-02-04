const fs = require('fs');
const { ObjectID } = require('mongodb');
const dbClient = require('../utils/db');
const Redis = require('../utils/redis');

const db = dbClient.db.collection('files');

class FilesController {
  static postUpload(req, res) {
    (async () => {
      let decodedData;
      const header = req.headers['x-token'];
      const token = `auth_${header}`;
      const redi = await Redis.get(token);
      if (redi) {
        const userId = new ObjectID(redi);
        const typeList = ['folder', 'file', 'image'];
        if (!req.body.name) {
          res.status(400).send(JSON.stringify({ error: 'Missing name' }));
        }
        if ((!req.body.type) || (typeList.includes(req.body.type) === false)) {
          res.status(400).send(JSON.stringify({ error: 'Missing type' }));
        }
        if ((!req.body.data) && (req.body.type != 'folder')) {
          res.status(400).send(JSON.stringify({ error: 'Missing data' }));
        } else if ((req.body.data) && ((req.body.type === 'file' || req.body.type === 'image'))) {
            const buff = Buffer.from(req.body.data, 'base64');
            decodedData = buff.toString('utf-8');
        }
        if (req.body.parentID) {
          const file = await db.findOne({ parentID: req.body.parentID });
          if (file) {
            if (file.type != 'folder') {
              res.status(400).send(JSON.stringify({ error: 'Parent is not a folder' }));
            }
          } else {
            res.status(400).send(JSON.stringify({ error: 'Parent not found' }));
          }
        }
        const newFile = {
          userId: userId,
          name: req.body.filename,
          type: req.body.type,
          isPublic: (req.body.isPublic ? req.body.isPublic : false),
          parentId: (req.body.parentID ? req.body.parentID : 0),
        }
        if (req.body.type === 'folder') {
          await db.insertOne(newFile);
          res.status(201).send(JSON.stringify(newFile));
        } else {
          const dir = process.env.FOLDER_PATH || '/tmp/files_manager';
          fs.mkdir(dir, { recursive: true }, () => {
            fs.writeFile(`${dir}/${token.slice(5)}`, decodedData, () => {
              newFile.localPath = dir;
            });
          });
          res.status(201).send(JSON.stringify(newFile));
          await db.insertOne(newFile);
        }
      } else {
        res.status(401).send(JSON.stringify({ error: 'Unauthorized' }));
      }
      res.end();
    })();
  }
}

module.exports = FilesController;
