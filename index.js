const express = require('express');


const app = express();

const port = process.env.PORT || 5000;

app.get('/', (req, res) => {
  res.send('secondhand server running')
})

app.listen(port, () => {
  console.log(`secondhand server running on port ${port}`)
})