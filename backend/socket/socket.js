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
      origin: process.env.FRONTEND_URL || "https://chat-app-blink.vercel.app",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;

    if (!userId) {
      console.log("❌ Socket rejected: no userId");
      socket.disconnect();
      return;
    }

    console.log("🟢 User connected:", userId);

    userSocketMap[userId] = socket.id;

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    // 💬 MESSAGE SENDING (THIS WAS MISSING)
    socket.on("send_message", (messageData) => {
      const receiverSocketId = userSocketMap[messageData.receiverId];

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receive_message", messageData);
      }
    });

    // ✍️ Typing
    socket.on("typing", ({ receiverId, senderName }) => {
      const receiverSocketId = userSocketMap[receiverId];

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("showTyping", {
          senderName,
          senderId: userId,
        });
      }
    });

    socket.on("stopTyping", ({ receiverId }) => {
      const receiverSocketId = userSocketMap[receiverId];

      if (receiverSocketId) {
        io.to(receiverSocketId).emit("hideTyping", {
          senderId: userId,
        });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("🔴 Disconnected:", userId, reason);

      delete userSocketMap[userId];

      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });
};
