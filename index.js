const express = require('express');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.n9sry.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

app.get('/', (req, res) => {
  res.send('secondhand server running')
})

const run = async () => {
  try {
    const bazaarDb = client.db("bazaarDb");
    const usersCollection = bazaarDb.collection("users");

    app.post('/user', async (req, res) => {
      const user = req.body;

      // console.log(user);
      const result = usersCollection.insertOne(user);

      res.send(result);
    })
  }
  finally {

  }
}

run().catch(err => console.error(err))

app.listen(port, () => {
  console.log(`secondhand server running on port ${port}`)
})