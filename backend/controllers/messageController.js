import Message from "../models/Message.js";
import {
  getReceiverSocketId,
  getIO
} from "../socket/socket.js";

// GET messages
export const getMessages = async (req, res) => {
  try {
    const myId = req.user._id;
    const userToChatId = req.params.id;

    const messages = await Message.find({
      $or: [
        {
          senderId: myId,
          receiverId: userToChatId
        },
        {
          senderId: userToChatId,
          receiverId: myId
        }
      ]
    })
      .populate("replyTo")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// SEND MESSAGE
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.user._id;
    const receiverId = req.params.id;

    const text = req.body.text || "";
    const replyTo = req.body.replyTo || null;

    let mediaUrl = "";
    let mediaType = "";

    if (req.file) {
      mediaUrl = `/uploads/${req.file.filename}`;

      if (req.file.mimetype.startsWith("image")) {
        mediaType = "image";
      } else if (
        req.file.mimetype.startsWith("audio")
      ) {
        mediaType = "audio";
      } else if (
        req.file.mimetype.startsWith("video")
      ) {
        mediaType = "video";
      } else {
        mediaType = "file";
      }
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      mediaUrl,
      mediaType,
      replyTo
    });

    const fullMessage =
      await Message.findById(
        newMessage._id
      ).populate("replyTo");

    const io = getIO();

    const receiverSocketId =
      getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit(
        "newMessage",
        fullMessage
      );
    }

    res.status(201).json(fullMessage);
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// DELETE MESSAGE
export const deleteMessage = async (req, res) => {
  try {
    const message =
      await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({
        message: "Message not found"
      });
    }

    if (
      message.senderId.toString() !==
      req.user._id.toString()
    ) {
      return res.status(401).json({
        message: "Not allowed"
      });
    }

    message.text = "";
    message.mediaUrl = "";
    message.mediaType = "";
    message.isDeleted = true;

    await message.save();

    res.status(200).json({
      message: "Deleted successfully",
      deletedId: message._id
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// CLEAR CHAT
export const clearChat = async (req, res) => {
  try {
    const myId = req.user._id;
    const userId = req.params.id;

    await Message.deleteMany({
      $or: [
        {
          senderId: myId,
          receiverId: userId
        },
        {
          senderId: userId,
          receiverId: myId
        }
      ]
    });

    res.status(200).json({
      message: "Chat cleared successfully"
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};

// SEEN MESSAGE
export const markMessagesSeen = async (
  req,
  res
) => {
  try {
    const myId = req.user._id;
    const senderId = req.params.id;

    await Message.updateMany(
      {
        senderId,
        receiverId: myId,
        seen: false
      },
      {
        $set: { seen: true }
      }
    );

    const io = getIO();

    const senderSocketId =
      getReceiverSocketId(senderId);

    if (senderSocketId) {
      io.to(senderSocketId).emit(
        "messagesSeen"
      );
    }

    res.status(200).json({
      success: true
    });
  } catch (error) {
    res.status(500).json({
      message: error.message
    });
  }
};
