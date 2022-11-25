const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;

// midleware
app.use(cors());
app.use(express.json());

// conndect to mongodb
const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.sqgzvsr.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// collections
const userCollection = client.db("automoli").collection("users");
const carCollection = client.db("automoli").collection("carAds");

async function run() {
  try {
    // add user in mongodb
    app.post("/adduser", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      res.send(result);
    });
    // add Product api
    app.post("/add-car-ad", async (req, res) => {
      const product = req.body;
      const result = await carCollection.insertOne(product);
      res.send(result);
    });
    // get seller ads api
    app.get("/myads", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await carCollection.find(query).toArray();
      res.send(result);
    });
  } finally {
  }
}

run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("automoli server is running");
});

app.listen(port, () => {
  console.log("server running on port", port);
});
