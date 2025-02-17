require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const mongoose = require("mongoose");
const { Server } = require("socket.io");
const path = require("path");
const requestIp = require("request-ip");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.set("trust proxy", true); // Trust proxy for IP extraction
app.use(cors());
app.use(express.json());
app.use(requestIp.mw());
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ DB Connection Error:", err));

// Define lamp state schema
const LampSchema = new mongoose.Schema({
    flamesLit: { type: Number, default: 0 },
    usersClicked: { type: [String], default: [] } // Store unique IPs
});

const LampState = mongoose.model("LampState", LampSchema);

// Initialize lamp state in DB
async function initializeLamp() {
    let lamp = await LampState.findOne();
    if (!lamp) {
        lamp = new LampState();
        await lamp.save();
    }
    return lamp;
}

io.on("connection", async (socket) => {
    console.log(`✅ User Connected: ${socket.id}`);
    const lamp = await initializeLamp();
    
    // Extract IP address correctly when behind a proxy
    const ip = socket.handshake.headers['x-forwarded-for'] || socket.handshake.address;
    console.log(`Client IP: ${ip}`);

    // Send current lamp state to new user
    socket.emit("update-lamp", lamp.flamesLit);

    // Handle lamp lighting
    socket.on("light-lamp", async () => {
        let lamp = await LampState.findOne();

        if (lamp.flamesLit < 5 && !lamp.usersClicked.includes(ip)) {
            lamp.flamesLit++;
            lamp.usersClicked.push(ip);
            await lamp.save();

            io.emit("update-lamp", lamp.flamesLit);
            if (lamp.flamesLit === 5) {
                io.emit("lamp-lit");
            }
        } else {
            socket.emit("click-denied", "You have already clicked!");
        }
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
        console.log(`❌ User Disconnected: ${socket.id}`);
    });
});

// Reset lamp state
app.post("/reset-lamp", async (req, res) => {
    try {
        await LampState.updateOne({}, { flamesLit: 0, usersClicked: [] });
        io.emit("reset-lamp");
        res.json({ success: true, message: "Lamp has been reset!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error resetting lamp", error });
    }
});

// Fetch current lamp state
app.get("/lamp-status", async (req, res) => {
    try {
        const ip = req.clientIp;
        const lamp = await LampState.findOne();
        
        res.json({
            flamesLit: lamp.flamesLit,
            userClicked: lamp.usersClicked.includes(ip),
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching lamp status", error });
    }
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));