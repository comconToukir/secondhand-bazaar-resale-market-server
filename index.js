const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    const productsCollection = bazaarDb.collection("products");
    const categoriesCollection = bazaarDb.collection("categories");

    // if new user add if logged in with google
    app.put('/user', async (req, res) => {
      const user = req.body;

      const filter = { email: user.email };

      const options = { upsert: true };

      const updateDoc = {
        $set: {
          name: user.name,
          email: user.email,
          role: user.role
        }
      }

      // console.log(user);
      const result = await usersCollection.updateOne(filter, updateDoc, options);

      res.send(result);
    })

    // get categories
    app.get('/get-categories', async (req, res) => {
      const query = {};

      const categories = await categoriesCollection.find(query).toArray();

      res.send(categories);
    })

    // get three categories for home page
    app.get('/get-three-categories', async (req, res) => {
      const query = {};

      const categories = await categoriesCollection.find(query).limit(3).toArray();

      res.send(categories);
    })

    // get individual category
    app.get('/category/:id', async (req, res) => {
      const id = req.params.id;

      const query = { categoryId: ObjectId(id) }

      const products = await productsCollection.find(query).toArray();

      res.send(products);
    })

    // get advertised products
    app.get('/advertisements', async (req, res) => {
      const query = { isAdvertised: true };

      const options = {
        sort: { _id: -1 }
      }

      const products = await productsCollection.find(query, options).toArray();

      res.send(products);
    })

    // check the user's role
    app.get('/users/role/:email', async (req, res) => {
      const email = req.params.email;
      const query = { email }

      const user = await usersCollection.findOne(query);

      res.send(user);
    })

    // create a new product
    app.post('/add-product', async (req, res) => {
      const productData = req.body;

      const result = await productsCollection.insertOne(productData);

      res.send(result);
    })

    // get all products for seller
    app.get('/all-products/:email', async (req, res) => {
      const email = req.params.email;

      const query = { sellerEmail: email };

      const products = await productsCollection.find(query).toArray();

      res.send(products);
    })

    // update a product as advertised
    app.put('/advertise/:id', async (req, res) => {
      const id = req.params.id;

      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          isAdvertised: true,
        }
      }

      const result = await productsCollection.updateOne(filter, updateDoc, options);

      res.send(result);
    })

    // delete a product from seller
    app.delete('/delete-product/:id', async (req, res) => {
      const id = req.params.id;

      const filter = { _id: ObjectId(id) };

      const result = await productsCollection.deleteOne(filter);

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