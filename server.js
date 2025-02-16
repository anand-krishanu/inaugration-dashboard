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

app.use(cors());
app.use(express.json());
app.use(requestIp.mw());

app.use(express.static(path.join(__dirname, "public")));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("❌ DB Connection Error:", err));

const LampSchema = new mongoose.Schema({
    flamesLit: { type: Number, default: 0 },
    usersClicked: { type: [String], default: [] }
});

const LampState = mongoose.model("LampState", LampSchema);

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
    const ip = socket.handshake.address;

    socket.emit("update-lamp", lamp.flamesLit);

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
        }
    });

    socket.on("disconnect", () => {
        console.log(`❌ User Disconnected: ${socket.id}`);
    });
});

app.post("/reset-lamp", async (req, res) => {
    try {
        await LampState.updateOne({}, { flamesLit: 0, usersClicked: [] });
        io.emit("update-lamp", 0);
        res.json({ success: true, message: "Lamp has been reset!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error resetting lamp", error });
    }
});



const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));