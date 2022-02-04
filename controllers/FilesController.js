class FilesController {
    static postUpload(req, res) {
        (async () => {
            const header = req.headers['x-token'];
            const token = `auth_${header}`;
            const redi = await Redis.get(token);
            if (redi) {
              const userId = new ObjectID(redi);
              const user = await db.findOne({ _id: userId });
            } else {
              res.status(401).send(JSON.stringify({ error: 'Unauthorized' }));
            }
            res.end();
          })();
        }
    }
}