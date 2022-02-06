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
        const newFile = {
          userId,
          name,
          type,
          isPublic: (req.body.isPublic ? req.body.isPublic : false),
          parentId: (req.body.parentId ? pId : 0),
        };
        if (type === 'folder') {
          await files.insertOne(newFile);
          return res.status(201).json(newFile);
        }
        const dir = process.env.FOLDER_PATH || '/tmp/files_manager';
        fs.mkdir(dir, { recursive: true }, () => {
          fs.writeFile(`${dir}/${token.slice(5)}`, decodedData, () => {
            newFile.localPath = dir;
          });
        });
        await files.insertOne(newFile);
        return res.status(201).json(newFile);
      }
      return res.status(401).json({ error: 'Unauthorized' });
    })();
  }

  static getShow(req, res) {
    (async () => {
      const header = req.headers['x-token'];
      const token = `auth_${header}`;
      const user = await Redis.get(token);
      if (user) {
        const userId = new ObjectID(user);
        const fileId = new ObjectID(req.params.id);
        const file = await files.findOne({ _id: fileId, userId });
        if (!file) {
          return res.status(404).json({ error: 'Not found' });
        }
        return res.status(200).json(file);
      }
      return res.status(401).json({ error: 'Unauthorized' });
    })();
  }

  static getIndex(req, res) {
    (async () => {
      const header = req.headers['x-token'];
      const token = `auth_${header}`;
      const user = await Redis.get(token);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const userId = new ObjectID(user);
      const parentId = (req.query.parentId ? new ObjectID(req.query.parentId) : 0);
      const page = req.query.page ? req.query.page : 0;
      const pageSize = 20;
      const pageNum = (parseInt(page, 10) * pageSize);
      const filesList = await files.find({ userId, parentId })
        .skip(pageNum).limit(pageSize).toArray();
      console.log(filesList);
      // const filesList = await files.aggregate([
      //   { $match: { userId, parentId } },
      //   {
      //     [
      //       { $skip: pageNum * 20 },
      //       { $limit: 20 }
      //     ]
      //   },
      // ]).toArray();
      if (filesList) {
        return res.status(200).json(filesList);
      }
      return res.status(404).json({ error: 'Not found' });
    })();
  }
}

module.exports = FilesController;
