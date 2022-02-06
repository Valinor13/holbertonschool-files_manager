const fs = require('fs');
const mime = require('mime-types');
const { v4: uuid } = require('uuid');
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
          newFile.userId.toString();
          newFile.parentId.toString();
          newFile.id = newFile._id.toString();
          delete newFile._id;
          return res.status(201).json(newFile);
        }
        const dir = process.env.FOLDER_PATH || '/tmp/files_manager';
        fs.mkdir(dir, { recursive: true }, () => {
          const fileName = `${dir}/${uuid()}`;
          fs.writeFile(fileName, decodedData, () => {
            newFile.localPath = fileName;
          });
        });
        await files.insertOne(newFile);
        newFile.userId.toString();
        newFile.parentId.toString();
        newFile.id = newFile._id.toString();
        delete newFile._id;
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
        file.userId.toString();
        file.parentId.toString();
        file.id = file._id.toString();
        delete file._id;
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
      let query;
      if (parentId === 0) {
        query = { userId };
      } else {
        query = { userId, parentId };
      }
      const filesList = await files.find(query)
        .skip(pageNum).limit(pageSize).toArray();
      if (filesList) {
        for (const doc in filesList) {
          if ({}.hasOwnProperty.call(filesList, doc)) {
            filesList[doc].userId.toString();
            filesList[doc].parentId.toString();
            filesList[doc].id = filesList[doc]._id.toString();
            delete filesList[doc]._id;
          }
        }
        return res.status(200).json(filesList);
      }
      return res.status(404).json({ error: 'Not found' });
    })();
  }

  static putPublish(req, res) {
    (async () => {
      const header = req.headers['x-token'];
      const token = `auth_${header}`;
      const user = await Redis.get(token);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const userId = new ObjectID(user);
      const fileId = new ObjectID(req.params.id);
      const file = await files.findOne({ _id: fileId, userId });
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }
      await files.updateOne({ _id: fileId }, { $set: { isPublic: true } });
      file.id = file._id.toString();
      file.isPublic = true;
      file.userId.toString();
      file.parentId.toString();
      delete file._id;
      return res.status(200).json(file);
    })();
  }

  static putUnpublish(req, res) {
    (async () => {
      const header = req.headers['x-token'];
      const token = `auth_${header}`;
      const user = await Redis.get(token);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const userId = new ObjectID(user);
      const fileId = new ObjectID(req.params.id);
      const file = await files.findOne({ _id: fileId, userId });
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }
      await files.updateOne({ _id: fileId }, { $set: { isPublic: false } });
      file.id = file._id.toString();
      file.isPublic = false;
      file.userId.toString();
      file.parentId.toString();
      delete file._id;
      return res.status(200).json(file);
    })();
  }

  static getFile(req, res) {
    (async () => {
      const header = req.headers['x-token'];
      const token = `auth_${header}`;
      const user = await Redis.get(token);
      const _id = new ObjectID(req.params.id);
      const file = await files.findOne({ _id });
      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }
      if (file.userId.toString() !== user.toString() && file.isPublic === false) {
        return res.status(404).json({ error: 'Not found' });
      }
      if (file.type === 'folder') {
        return res.status(400).json({ error: 'A folder doesn\'t have content' });
      }
      if (!file.localPath) {
        return res.status(404).json({ error: 'Not found' });
      }
      const mimeType = mime.lookup(file.name);
      let ext = mime.extension(mimeType);
      if (!ext) {
        ext = 'txt';
      }
      const dataList = [];
      await fs.readFile(`${file.localPath}`, (e, data) => console.log(e, data));
      console.log(dataList[0]);
      return res.status(200).write(dataList[0]);
    })();
  }
}

module.exports = FilesController;
