const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
var admin = require("firebase-admin");
var serviceAccount = require("./serviceAccountKey.json");
require("dotenv").config();
const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.kqlaxvo.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const verifyToken = async (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization) {
    return res.status(401).send({
      message: "unauthorized access. Token not found!",
    });
  }

  const token = authorization.split(" ")[1];
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;

    next();
  } catch (error) {
    res.status(401).send({
      message: "unauthorized access.",
    });
  }
};

async function run() {
  try {
    await client.connect();

    const db = client.db("habit_tracker_db");
    const habitCollection = db.collection("habits");

    app.get("/habits/featured", async (req, res) => {
      try {
        const featuredHabits = await habitCollection
          .find({ isPublic: true })
          .sort({ createdAt: -1 })
          .limit(6)
          .toArray();
        res.send(featuredHabits);
      } catch (error) {
        console.error("Error fetching featured habits:", error);
        res.status(500).json({ message: "Error fetching featured habits" });
      }
    });

    app.get("/habits/public", async (req, res) => {
      try {
        const featuredHabits = await habitCollection
          .find({ isPublic: true })
          .sort({ createdAt: -1 })
          .toArray();
        res.send(featuredHabits);
      } catch (error) {
        console.error("Error fetching public habits:", error);
        res.status(500).json({ message: "Error fetching public habits" });
      }
    });

    app.post("/habits", verifyToken, async (req, res) => {
      try {
        const habitData = req.body;

        const userEmailFromToken = req.user.email;

        const newHabitDocument = {
          ...habitData,
          creatorEmail: userEmailFromToken,
          createdAt: new Date(),
          completionHistory: [],
          isPublic: habitData.isPublic || false,
        };
        const result = await habitCollection.insertOne(newHabitDocument);

        res.status(201).send(result);
      } catch (error) {
        console.error("Error saving new habit:", error);
        res.status(500).send({ message: "Error saving habit" });
      }
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running fine!");
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
