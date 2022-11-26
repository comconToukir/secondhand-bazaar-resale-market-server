const express = require('express');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
    const bookingsCollection = bazaarDb.collection('bookings');
    const paymentsCollection = bazaarDb.collection("payments");

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

      const options = {
        sort: { _id: -1 }
      }

      const categories = await categoriesCollection.find(query, options).toArray();

      res.send(categories);
    })

    // get three categories for home page
    app.get('/get-three-categories', async (req, res) => {
      const query = {};

      const options = {
        sort: { _id: -1 }
      }

      const categories = await categoriesCollection.find(query, options).limit(3).toArray();

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

      productData.categoryId = ObjectId(productData.categoryId);

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

    // book a product
    app.put('/book-product', async (req, res) => {
      const booking = req.body;

      // console.log(booking);

      const booker = {
        bookerName: booking.fullName,
        bookerEmail: booking.email,
        bookerLocation: booking.location,
        bookerNumber: booking.phoneNumber
      }

      const bookingData = {
        productId: ObjectId(booking.productId),
        image: booking.image,
        price: booking.price,
        productName: booking.productName,
        sellerContact: booking.sellerContact,
        sellerEmail: booking.sellerEmail,
        sellerLocation: booking.sellerLocation,
        bookers: [booker]

      }

      const filter = { productId: ObjectId(booking.productId) };

      const updateDoc = {
        $push: {
          bookers: booker
        }
      }

      const options = { upsert: true }

      const result = await bookingsCollection.findOne(filter);

      if (result) {
        const updateResult = await bookingsCollection.updateOne(filter, updateDoc, options);

        res.send(updateResult);
      }

      else {
        const insertResult = await bookingsCollection.insertOne(bookingData);

        res.send(insertResult);
      }

      // gives error but updates as wanted
      // const indexCreate = await bookingsCollection.createIndex({ "productId": 1 }, { "unique": true })

      // console.log(indexCreate)

      // const result = await bookingsCollection.bulkWrite([
      //   {
      //     "updateOne": {
      //       'filter': { 'productId': booking.productId },
      //       'update': {
      //         "$push": {
      //           "bookers": {
      //             "bookerName": booking.fullName,
      //             'bookerEmail': booking.email,
      //             'bookerLocation': booking.location,
      //             "bookerNumber": booking.phoneNumber
      //           }
      //         }
      //       }
      //     }
      //   },
      //   {
      //     'insertOne': {
      //       'document': {
      //         'productId': booking.productId,
      //         "image": booking.image,
      //         "productName": booking.productName,
      //         "sellerContact": booking.sellerContact,
      //         "sellerEmail": booking.sellerEmail,
      //         "sellerLocation": booking.sellerLocation,
      //         "bookers": [{
      //           "bookerName": booking.fullName,
      //           "bookerEmail": booking.email,
      //           'bookerLocation': booking.location,
      //           'bookerNumber': booking.phoneNumber
      //         }]

      //       }
      //     }
      //   }
      // ],
      // { "ordered": false }
      // )

      // console.log(result);

      // res.send(result);
    })

    // get bookings of a single buyer
    app.get('/book-product', async (req, res) => {
      const email = req.query.email;

      // console.log(email);

      // const query = {
      //   bookers: {
      //     $elemMatch: { bookerEmail: email }
      //   }
      // };

      // const options = {
      //   sort: { _id: -1 }
      // }

      //TODO: aggregate filter by isPaid and boughtBy
      // to get only users own data in bookers
      const pipeline = [
        {
          "$match": {
            "bookers": {
              "$elemMatch": {
                "$and": [
                  { "bookerEmail": email }
                ]
              }
            }
          }
        },
        {
          "$project": {
            "productId": 1,
            "image": 1,
            "productName": 1,
            "price": 1,
            "sellerEmail": 1,
            "sellerContact": 1,
            "sellerName": 1,
            "isPaid": 1,
            "boughtBy": 1,
            "bookers": {
              "$filter": {
                "input": "$bookers",
                "as": "bookers",
                "cond": {
                  "$and": [
                    { "$eq": ["$$bookers.bookerEmail", email] }
                  ]
                }
              }
            }
          }
        }
      ]

      // const products = await bookingsCollection.find(query, options).toArray();
      const products = await bookingsCollection.aggregate(pipeline).sort({ _id: -1 }).toArray()

      // console.log(products);

      res.send(products);
    })

    // get booking for payment
    app.get('/payment-booking/:id', async (req, res) => {
      const id = req.params.id;

      const query = { _id: ObjectId(id) };

      const booking = await bookingsCollection.findOne(query);

      res.send(booking);
    })

    // delete a single booking
    app.delete('/book-product', async (req, res) => {
      const email = req.query.email;
      const id = req.query.id;

      const filter = { productId: ObjectId(id) };

      // removing data of user from booker array
      const updateDoc = {
        $pull: {
          bookers: {
            bookerEmail: email
          }
        }
      }

      const result = await bookingsCollection.updateOne(filter, updateDoc);

      res.send(result)
    })


    //TODO: aggregate to get payment info and remove unnecessary data
    // get all sold products for seller
    app.get('/sold-products', async (req, res) => {
      const email = req.query.email;

      const query = { sellerEmail: email, isPaid: true };

      const products = await bookingsCollection.find(query).sort({ _id: -1 }).toArray();

      res.send(products);
    })

    // create payment intent
    app.post('/create-payment-intent', async (req, res) => {
      const data = req.body;
      const amount = data.price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: 'usd',
        payment_method_types: ['card'],
      })

      res.send({clientSecret: paymentIntent.client_secret})
    })

    //TODO: aggregate to remove bookers data in bookingsCollection other than buyer
    // post payments to database
    app.post('/save-payment-info', async (req, res) => {
      const payment = req.body;
      const email = payment.email;
      const productId = payment.productId;
      const bookingId = payment.bookingId;

      const deleteFilter = { _id: ObjectId(productId) };

      const updateFilter = { _id: ObjectId(bookingId) };

      const updateDoc = {
        $set: {
          isPaid: true,
          boughtBy: email
        }
      }

      const options = { upsert: true };



      const deleteResult = await productsCollection.deleteOne(deleteFilter);
      const updateResult = await bookingsCollection.updateOne(updateFilter, updateDoc, options);
      const insertResult = await paymentsCollection.insertOne(payment);

      res.send(insertResult);
    })

  }
  finally {

  }
}

run().catch(err => console.error(err))

app.listen(port, () => {
  console.log(`secondhand server running on port ${port}`)
})