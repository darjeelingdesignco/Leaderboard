const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.DATABASE_URL
});

const db = admin.database();

// Get Top 10 Scores
app.get("/getLeaderboard", async (req, res) => {
  const ref = db.ref("leaderboard").orderByChild("score").limitToLast(10);
  ref.once("value", (snapshot) => {
    res.json(snapshot.val() || {});
  });
});

// Submit Score
app.post("/updateLeaderboard", async (req, res) => {
  const { name, score } = req.body;
  if (!name || score === undefined) return res.status(400).send("Invalid data");

  const ref = db.ref("leaderboard");
  const newEntry = ref.push();
  await newEntry.set({ name, score });

  res.send("Leaderboard updated!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));