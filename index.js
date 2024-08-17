const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const port = process.env.PORT || 5000;
const app = express();

//middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Prime Electronics server is running");
});

// mongodb credentials

const user = process.env.DB_USER;
const pass = process.env.DB_PASS;

const uri = `mongodb+srv://${user}:${pass}@cluster0.kdwhpbt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // collections
    const productsCollection = client
      .db("prime-electronics")
      .collection("products");

    // get all product
    app.get("/products", async (req, res) => {
      const currentPage = parseInt(req.query.currentPage);
      const itemsPerPage = parseInt(req.query.itemsPerPage);
      const brand = req?.query?.brand;
      const category = req?.query?.category;
      const price = req?.query?.price;
      const sort = req?.query?.sort;
      console.log(sort);
      if (brand || category || price) {
        const query = {};
        if (brand !== "") {
          query.company = brand;
        }
        if (category !== "") {
          query.category = category;
        }
        if (price !== "") {
          const range = {
            $gt: parseInt(price.split("-")[0]),
            $lt: parseInt(price.split("-")[1]),
          };
          query.price = range;
        }
        // console.log(query);

        const products = await productsCollection
          .find(query)
          .skip(currentPage * itemsPerPage)
          .limit(itemsPerPage)
          .toArray();
        // console.log(products);
        return res.send(products);
      }
      const sortQuery = {};
      if (sort === "dateSort") {
        sortQuery.dateAndTime = 1;
      } else if (sort === "lowToHigh") {
        sortQuery.price = 1;
      } else {
        sortQuery.price = -1;
      }

      const products = await productsCollection
        .find()
        .sort(sortQuery)
        .skip(currentPage * itemsPerPage)
        .limit(itemsPerPage)
        .toArray();

      res.send(products);
    });

    app.get("/product-count", async (req, res) => {
      let count = await productsCollection.countDocuments();

      const brand = req?.query?.brand;
      const category = req?.query?.category;
      const price = req?.query?.price;

      if (brand || category || price) {
        const query = {};
        if (brand !== "") {
          query.company = brand;
        }
        if (category !== "") {
          query.category = category;
        }
        if (price !== "") {
          const range = {
            $gt: parseInt(price.split("-")[0]),
            $lt: parseInt(price.split("-")[1]),
          };
          query.price = range;
        }

        const products = await productsCollection.find(query).toArray();
        // console.log(products.length);
        count = products.length;
      }

      res.send({ count });
    });

    // app.get("/specific", async (req, res) => {
    //   const text = "samsung";

    //   const products = await productsCollection
    //     .find({
    //       name: { $regex: "apple", $options: "i" },
    //     })
    //     .toArray();

    //   res.send(products);
    // });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`server is running port on ${port}`);
});
