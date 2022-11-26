const express = require("express");
const cors = require("cors");
const app = express();
const { MongoClient } = require("mongodb");
require("dotenv").config();
const port = process.env.PORT || 5000;
const jwt = require("jsonwebtoken");

// midleware
app.use(cors());
app.use(express.json());
const verifyJwt = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(403).send({ access: "Unauthorize Access" });
  }
  jwt.verify(token, process.env.AUTOMOLI_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ access: "Unauthorize Access" });
    }
    req.decoded = decoded;
  });
  next();
};

// conndect to mongodb
const uri = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@cluster0.sqgzvsr.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// collections
const userCollection = client.db("automoli").collection("users");
const carCollection = client.db("automoli").collection("carAds");

// verify admin
const verifyAdmin = async (req, res, next) => {
  const email = req.decoded?.email;
  if (email) {
    const filter = { email: email };
    const admin = await userCollection.findOne(filter);
    if (admin?.role !== "admin") {
      res.status(403).send({ message: "forbidden access" });
    }
    next();
  }
};
// verify seller
const verifySeller = async (req, res, next) => {
  const email = req.decoded?.email;
  if (email) {
    const filter = { email: email };
    const admin = await userCollection.findOne(filter);
    if (admin?.role !== "seller") {
      res.status(403).send({ message: "forbidden access" });
    }
    next();
  }
};

async function run() {
  try {
    // add user in mongodb
    app.post("/adduser", async (req, res) => {
      const user = req.body;
      const email = user.email;
      const query = { email: email };
      const alreadyExist = await userCollection.findOne(query);
      if (alreadyExist) {
        return res.send({ user: "Already Exist" });
      }
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
    app.get("/myads", verifyJwt, verifySeller, async (req, res) => {
      const decodedEmail = req.decoded?.email;
      const email = req.query.email;
      if (decodedEmail !== email) {
        return res.status(403).send([]);
      }
      const buyerEmail = req.query.email;
      const query = { email: buyerEmail };
      const result = await carCollection.find(query).toArray();
      res.send(result);
    });
    // get all seller
    app.get("/allseller", verifyJwt, verifyAdmin, async (req, res) => {
      const decodedEmail = req.decoded?.email;
      const email = req.query.email;
      if (decodedEmail !== email) {
        return res.status(403).send([]);
      }
      const query = { role: "seller" };
      const result = await userCollection.find(query).toArray();

      res.send(result);
    });
    // get all buyer
    app.get("/allbuyer", verifyJwt, verifyAdmin, async (req, res) => {
      const decodedEmail = req.decoded?.email;
      console.log(decodedEmail);
      const email = req.query.email;
      if (decodedEmail !== email) {
        return res.status(403).send([]);
      }
      const query = { role: "user" };
      const result = await userCollection.find(query).toArray();
      res.send(result);
    });
    // verify user
    app.put("/verify", async (req, res) => {
      const email = req.query.email;
      const filter = { email: email };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          verified: true,
        },
      };
      const result = await userCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });
    // jwt token
    app.get("/jwt", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      if (user) {
        const token = jwt.sign({ email }, process.env.AUTOMOLI_TOKEN, {
          expiresIn: "7d",
        });
        return res.send({ automoliToken: token });
      }
      res.status(403).send({ accessToken: "" });
    });
    // checked user is admin or not
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      res.send({ isAdmin: user?.role === "admin" });
    });
    // checked user is seller or not
    app.get("/users/seller/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      res.send({ isSeller: user?.role == "seller" });
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
