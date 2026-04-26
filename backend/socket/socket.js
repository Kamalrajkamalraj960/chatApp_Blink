import { Server } from "socket.io";

let io;
const userSocketMap = {};

export const getReceiverSocketId = (userId) => {
  return userSocketMap[userId];
};

export const getIO = () => io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "https://chat-app-blink.vercel.app/",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    // ❌ Reject invalid connections
    if (!userId) {
      console.log("❌ Socket rejected: no userId");
      socket.disconnect();
      return;
    }

    console.log("🟢 User connected:", userId);

    // 🔥 Store socket safely
    userSocketMap[userId] = socket.id;

    // 📡 Emit online users
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // ✍️ Typing event
    socket.on("typing", ({ receiverId, senderName }) => {
      const receiverSocketId = userSocketMap[receiverId];

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("showTyping", {
          senderName,
          senderId: userId,
        });
      }
    });

    // ⌨️ Stop typing event
    socket.on("stopTyping", ({ receiverId }) => {
      const receiverSocketId = userSocketMap[receiverId];

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("hideTyping", {
          senderId: userId,
        });
      }
    });

    // 🔴 Cleanup on disconnect
    socket.on("disconnect", (reason) => {
      console.log("🔴 Disconnected:", userId, reason);

      if (userSocketMap[userId]) {
        delete userSocketMap[userId];
      }

      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });

};
