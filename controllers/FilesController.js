const fs = require('fs');
const path = require('path');
const { ObjectID } = require('mongodb');
const dbClient = require('../utils/db');
const Redis = require('../utils/redis');

const db = dbClient.db.collection('files');

class FilesController {
  static postUpload(req, res) {
    (async () => {
      let data;
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
          data = Buffer.from(req.body.data).toString('base64');
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
          name: req.body.filename,
          type: req.body.type,
          parentId: (req.body.parentID ? req.body.parentID : 0),
          isPublic: (req.body.isPublic ? req.body.isPublic : false),
          data: data,
          owner: userId
        }
        if (req.body.type === 'folder') {
          await db.insertOne(newFile);
          res.status(201).send(JSON.stringify(newFile));
        } else {
          const dir = process.env.FOLDER_PATH || '/tmp/files_manager';
          const staticPath = path.join(__dirname, dir);
          fs.mkdir(staticPath, { recursive: true }, () => {
            fs.writeFile(staticPath + token, data, () => {
              newFile.localPath = staticPath;
              await db.insertOne(newFile);
              res.status(201).send(JSON.stringify(newFile));
            });
          });
        }
      } else {
        res.status(401).send(JSON.stringify({ error: 'Unauthorized' }));
      }
      res.end();
    })();
  }
}

module.exports = FilesController;
