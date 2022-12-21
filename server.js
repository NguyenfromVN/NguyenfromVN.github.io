const express = require('express');

const app = express();

app.use('', (req, _, next) => {
  console.log(`${new Date().getTime()}: ${req.url}`);
  next();
});

app.use(express.static(`${__dirname}/`));

const port = 8000;
app.listen(port, () => console.log(`Local server is running on port ${port}`));
