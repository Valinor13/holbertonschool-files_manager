const express = require('express');
const index = require('./routes/index');

const app = express();
const port = process.env.PORT || 5000;

app.use(index);

app.listen(port, () => {
  console.log(`server is running at ${port}`);
});
