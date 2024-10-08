const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();
const server = createServer(app);
app.use(cors());

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const PORT = process.env.PORT || 3000;
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

const userIdToSocketIdMap = new Map();
const socketIdToUserIdMap = new Map();

app.get("/", (req, res) => {
  res.send("Server is running");
});

io.on("connection", (socket) => {
  console.log(`Socket Connected`, socket.id);

  socket.on("room:join", (data) => {
    const { userId, room } = data;
    userIdToSocketIdMap.set(userId, socket.id);
    socketIdToUserIdMap.set(socket.id, userId);
    io.to(room).emit("user:joined", { userId, id: socket.id });
    socket.join(room);
    io.to(socket.id).emit("room:join", data);
  });

  socket.on("user:call", ({ to, offer }) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  });

  socket.on("call:accepted", ({ to, ans }) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  });

  socket.on("peer:nego:needed", ({ to, offer }) => {
    console.log("peer:nego:needed", offer);
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  });

  socket.on("peer:nego:done", ({ to, ans }) => {
    console.log("peer:nego:done", ans);
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  });

  socket.on("message:send", ({ to, message, userId }) => {
    io.to(to).emit("message:receive", { from: socket.id, message, userId });
  });

  socket.on("call:end", ({ to }) => {
    io.to(to).emit("call:end");
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on :${PORT}`);
});
