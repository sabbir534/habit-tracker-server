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

    app.get("/my-habits", verifyToken, async (req, res) => {
      try {
        // req.user.email is attached by the verifyToken middleware
        const userEmail = req.user.email;

        const userHabits = await habitCollection
          .find({ creatorEmail: userEmail })
          .sort({ createdAt: -1 }) // Show newest first
          .toArray();

        res.send(userHabits);
      } catch (error) {
        console.error("Error fetching user's habits:", error);
        res.status(500).json({ message: "Error fetching habits" });
      }
    });

    // 2. DELETE a specific habit
    app.delete("/habits/:id", verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const userEmail = req.user.email;

        // Security check: Find the habit AND ensure it belongs to the logged-in user
        const result = await habitCollection.deleteOne({
          _id: new ObjectId(id),
          creatorEmail: userEmail, // <-- This ensures they can only delete their own
        });

        if (result.deletedCount === 0) {
          return res.status(403).send({
            message:
              "Forbidden: You do not own this habit or it does not exist.",
          });
        }

        res.status(200).send(result);
      } catch (error) {
        console.error("Error deleting habit:", error);
        res.status(500).send({ message: "Error deleting habit" });
      }
    });

    // Add this inside your async function run() in index.js

    app.post("/habits/:id/complete", verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const userEmail = req.user.email; // From verifyToken

        // 1. Find the habit first to check duplicates and ownership
        const habit = await habitCollection.findOne({
          _id: new ObjectId(id),
          creatorEmail: userEmail,
        });

        if (!habit) {
          return res.status(403).send({
            message: "Forbidden: Habit not found or you do not own it.",
          });
        }

        // 2. Check for duplicate same-day entry
        const todayStr = new Date().toISOString().split("T")[0];
        const hasCompletedToday = habit.completionHistory.some((date) => {
          return new Date(date).toISOString().split("T")[0] === todayStr;
        });

        if (hasCompletedToday) {
          return res
            .status(400)
            .send({ message: "Habit already completed today" });
        }

        // 3. Update the habit using $push
        const updateResult = await habitCollection.updateOne(
          { _id: new ObjectId(id) }, // Filter
          { $push: { completionHistory: new Date() } } // Update action
        );

        if (updateResult.modifiedCount === 0) {
          throw new Error("Failed to update habit.");
        }

        // 4. Fetch and return the *updated* habit
        // (This is crucial for the client's state update)
        const updatedHabit = await habitCollection.findOne({
          _id: new ObjectId(id),
        });
        res.status(200).send(updatedHabit);
      } catch (error) {
        console.error("Error marking habit complete:", error);
        res
          .status(500)
          .send({ message: error.message || "Error marking habit complete" });
      }
    });

    // In your server's index.js file, inside async function run()

    app.get("/habits/:id", verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const userEmail = req.user.email; // From your verifyToken middleware

        // Find the habit by its ID
        const habit = await habitCollection.findOne({
          _id: new ObjectId(id),
        });

        if (!habit) {
          return res.status(404).send({ message: "Habit not found" });
        }

        // Security Check: Make sure the user owns this habit
        if (habit.creatorEmail !== userEmail) {
          return res
            .status(403)
            .send({ message: "Forbidden: You do not own this habit." });
        }

        // If all checks pass, send the habit data
        res.send(habit);
      } catch (error) {
        console.error("Error fetching single habit:", error);
        res.status(500).send({ message: "Error fetching habit" });
      }
    });

    app.put("/habits/:id", verifyToken, async (req, res) => {
      try {
        const id = req.params.id;
        const userEmail = req.user.email; // From verifyToken
        const updatedData = req.body; // { title, description, category, etc. }

        // Security filter: find by ID AND ensure it belongs to the logged-in user
        const filter = {
          _id: new ObjectId(id),
          creatorEmail: userEmail,
        };

        // Create the update document using $set
        const updateDoc = {
          $set: {
            title: updatedData.title,
            description: updatedData.description,
            category: updatedData.category,
            reminderTime: updatedData.reminderTime,
            imageUrl: updatedData.imageUrl,
            isPublic: updatedData.isPublic,
          },
        };

        const result = await habitCollection.updateOne(filter, updateDoc);

        if (result.matchedCount === 0) {
          // This means no doc was found with that ID *and* owned by that user
          return res
            .status(403)
            .send({
              message:
                "Forbidden: You do not own this habit or it does not exist.",
            });
        }

        res.status(200).send(result);
      } catch (error) {
        console.error("Error updating habit:", error);
        res.status(500).send({ message: "Error updating habit" });
      }
    });
    // Make sure this is *before* your client.db("admin").command...

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
