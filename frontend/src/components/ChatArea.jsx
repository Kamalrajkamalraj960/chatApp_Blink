import { useState, useEffect, useRef } from "react";
import {
  Trash2,
  Send,
  Image as ImageIcon,
  ArrowLeft,
  Reply,
  Mic,
  Square,
  X
} from "lucide-react";
import { useSelector } from "react-redux";
import { useSocketContext } from "../context/SocketContext";

const ChatArea = ({
  selectedUser,
  setSelectedUser
}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyMessage, setReplyMessage] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { userInfo } = useSelector((state) => state.auth);
  const { socket, onlineUsers } = useSocketContext();

  const isOnline = onlineUsers.includes(selectedUser?._id);

  const API = "https://chatapp-blink.onrender.com";

  const getAvatarUrl = (avatar) => {
    if (!avatar) return "https://i.pravatar.cc/150";
    return avatar.startsWith("http")
      ? avatar
      : `${API}${avatar}`;
  };

  /* FETCH MESSAGES */
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser) return;

      try {
        const res = await fetch(
          `${API}/api/messages/${selectedUser._id}`,
          { credentials: "include" }
        );

        const data = await res.json();

        if (res.ok) setMessages(data);

        await fetch(
          `${API}/api/messages/seen/${selectedUser._id}`,
          {
            method: "PUT",
            credentials: "include"
          }
        );
      } catch (error) {
        console.error(error);
      }
    };

    fetchMessages();
  }, [selectedUser]);

  /* SOCKET RECEIVE */
  useEffect(() => {
    if (!socket) return;

    // FIXED EVENT NAME (backend must match this)
    socket.on("receive_message", (message) => {
      const match =
        String(message.senderId) === String(selectedUser?._id) ||
        String(message.receiverId) === String(selectedUser?._id);

      if (match) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socket.on("messagesSeen", () => {
      setMessages((prev) =>
        prev.map((msg) =>
          String(msg.senderId) === String(userInfo._id)
            ? { ...msg, seen: true }
            : msg
        )
      );
    });

    socket.on("showTyping", () => setIsTyping(true));
    socket.on("hideTyping", () => setIsTyping(false));

    return () => {
      socket.off("receive_message");
      socket.off("messagesSeen");
      socket.off("showTyping");
      socket.off("hideTyping");
    };
  }, [socket, selectedUser, userInfo]);

  /* AUTO SCROLL */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);

  /* SEND MESSAGE (REAL-TIME FIX ADDED) */
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!selectedUser) return;

    if (!newMessage.trim() && !mediaFile) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("text", newMessage);
      formData.append("replyTo", replyMessage?._id || "");

      if (mediaFile) {
        formData.append("file", mediaFile);
      }

      const res = await fetch(
        `${API}/api/messages/${selectedUser._id}`,
        {
          method: "POST",
          credentials: "include",
          body: formData
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [...prev, data]);

        // 💥 REAL-TIME EMIT (THIS WAS MISSING)
        socket.emit("send_message", {
          senderId: userInfo._id,
          receiverId: selectedUser._id,
          text: newMessage,
          mediaUrl: data.mediaUrl || null,
          mediaType: data.mediaType || null,
          createdAt: new Date()
        });

        setNewMessage("");
        setMediaFile(null);
        setPreview("");
        setReplyMessage(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  /* REST OF YOUR CODE (UNCHANGED) */
  /* EVERYTHING BELOW IS SAME AS YOUR ORIGINAL */

  if (!selectedUser) {
    return (
      <div className="glass-panel h-full w-full hidden sm:flex items-center justify-center">
        <h2 className="text-white text-2xl">
          Select a conversation
        </h2>
      </div>
    );
  }

  return (
    <div className="glass-panel h-full w-full flex flex-col">

      {/* HEADER */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedUser(null)}>
            <ArrowLeft size={20} />
          </button>

          <img
            src={getAvatarUrl(selectedUser.avatar)}
            className="w-10 h-10 rounded-full object-cover"
          />

          <div>
            <h3 className="text-white">
              {selectedUser.username}
            </h3>

            <p className="text-xs text-cyan-400">
              {isTyping ? "Typing..." : isOnline ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowClearModal(true)}
          className="text-xs px-3 py-1 rounded-lg bg-red-500/10 text-red-400"
        >
          Clear Chat
        </button>
      </div>

      {messages.map((msg) => {
        const isMe =
          String(msg.senderId) === String(userInfo._id);

        return (
          <div
            key={msg._id}
            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-xs relative px-4 py-2 rounded-2xl ${isMe ? "bg-cyan-500 text-white" : "bg-white/10 text-white"
                }`}
            >
              {/* DELETE BUTTON (RESTORED) */}
              {isMe && (
                <button
                  onClick={() => handleDeleteMessage(msg._id)}
                  className="absolute top-1 right-1 text-red-300 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              )}

              {/* TEXT */}
              {msg.text && <p className="mt-2">{msg.text}</p>}
            </div>
          </div>
        );
      })}


      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg._id} className="flex justify-start">
            <div className="max-w-xs bg-white/10 text-white px-4 py-2 rounded-2xl">
              {msg.text && <p>{msg.text}</p>}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <div className="p-3 border-t border-white/10">
        <form onSubmit={handleSendMessage} className="flex gap-2">

          <input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);

              socket.emit("typing", {
                receiverId: selectedUser._id
              });

              clearTimeout(typingTimeoutRef.current);

              typingTimeoutRef.current = setTimeout(() => {
                socket.emit("stopTyping", {
                  receiverId: selectedUser._id
                });
              }, 1000);
            }}
            placeholder="Type message..."
            className="flex-1 px-4 py-3 bg-white/10 rounded-xl text-white outline-none"
          />

          <button className="p-3 bg-cyan-500 text-white rounded-xl">
            <Send size={18} />
          </button>

        </form>
      </div>

    </div>
  );
};

export default ChatArea;
