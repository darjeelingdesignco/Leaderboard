const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Initialize Firebase Admin SDK
const serviceAccount = require("./firebase-key.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://unity-ddc-default-rtdb.firebaseio.com",
});

const db = admin.database();
const leaderboardRef = db.ref("leaderboard");

// 🏆 GET Top 10 Scores
app.get("/getLeaderboard", async (req, res) => {
    try {
        const snapshot = await leaderboardRef.orderByChild("score").limitToLast(10).once("value");
        let leaderboard = [];

        snapshot.forEach((child) => {
            leaderboard.push(child.val());
        });

        leaderboard.sort((a, b) => b.score - a.score); // Sort highest first
        res.json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 📝 POST New Score (Only adds if it's in the top 10)
app.post("/updateLeaderboard", async (req, res) => {
    try {
        const { player, score } = req.body;

        const snapshot = await leaderboardRef.orderByChild("score").once("value");
        let leaderboard = [];

        snapshot.forEach((child) => {
            leaderboard.push({ id: child.key, ...child.val() });
        });

        leaderboard.sort((a, b) => b.score - a.score);

        if (leaderboard.length < 10 || score > leaderboard[leaderboard.length - 1].score) {
            if (leaderboard.length >= 10) {
                await leaderboardRef.child(leaderboard[leaderboard.length - 1].id).remove();
            }

            await leaderboardRef.push({ player, score });
            res.json({ message: "Leaderboard updated!" });
        } else {
            res.json({ message: "Score not high enough to be added." });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});