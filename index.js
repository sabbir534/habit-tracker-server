const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = 3000;
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.kqlaxvo.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

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
