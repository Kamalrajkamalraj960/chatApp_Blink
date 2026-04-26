import { useState, useEffect, useRef } from "react";
import {
  Trash2,
  Send,
  Image as ImageIcon,
  ArrowLeft
} from "lucide-react";
import { useSelector } from "react-redux";
import { useSocketContext } from "../context/SocketContext";

const ChatArea = ({ selectedUser, setSelectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const { userInfo } = useSelector((state) => state.auth);
  const { socket, onlineUsers } = useSocketContext();

  const isOnline = onlineUsers.includes(selectedUser?._id);

  const API = "https://chatapp-blink.onrender.com";

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
      } catch (error) {
        console.error(error);
      }
    };

    fetchMessages();
  }, [selectedUser]);

  /* SOCKET RECEIVE */
  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message) => {
      const match =
        String(message.senderId) === String(selectedUser?._id) ||
        String(message.receiverId) === String(selectedUser?._id);

      if (match) {
        setMessages((prev) => [...prev, message]);
      }
    };

    socket.on("receive_message", handleMessage);
    socket.on("showTyping", () => setIsTyping(true));
    socket.on("hideTyping", () => setIsTyping(false));

    return () => {
      socket.off("receive_message", handleMessage);
      socket.off("showTyping");
      socket.off("hideTyping");
    };
  }, [socket, selectedUser]);

  /* AUTO SCROLL */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages]);

  /* SEND MESSAGE */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    try {
      setUploading(true);

      const res = await fetch(
        `${API}/api/messages/${selectedUser._id}`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: newMessage })
        }
      );

      const data = await res.json();

      if (res.ok) {
        setMessages((prev) => [...prev, data]);

        socket?.emit("send_message", {
          senderId: userInfo._id,
          receiverId: selectedUser._id,
          text: newMessage
        });

        setNewMessage("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  /* DELETE MESSAGE */
  const handleDeleteMessage = async (id) => {
    try {
      const res = await fetch(`${API}/api/messages/${id}`, {
        method: "DELETE",
        credentials: "include"
      });

      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  /* CLEAR CHAT */
  const handleClearChat = async () => {
    try {
      const res = await fetch(
        `${API}/api/messages/clear/${selectedUser._id}`,
        {
          method: "DELETE",
          credentials: "include"
        }
      );

      if (res.ok) {
        setMessages([]);
        setShowClearModal(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!selectedUser) {
    return (
      <div className="glass-panel h-full flex items-center justify-center">
        <h2 className="text-white text-xl">Select a conversation</h2>
      </div>
    );
  }

  return (
    <div className="glass-panel h-full flex flex-col">

      {/* HEADER */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedUser(null)}>
            <ArrowLeft size={20} />
          </button>

          <div>
            <h3 className="text-white">{selectedUser.username}</h3>
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

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe =
            String(msg.senderId) === String(userInfo._id);

          return (
            <div
              key={msg._id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`relative max-w-xs px-4 py-2 rounded-2xl ${isMe
                    ? "bg-cyan-500 text-white"
                    : "bg-white/10 text-white"
                  }`}
              >
                {/* DELETE */}
                {isMe && (
                  <button
                    onClick={() => handleDeleteMessage(msg._id)}
                    className="absolute top-1 right-1 text-red-300 hover:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                )}

                <p className="mt-2">{msg.text}</p>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t border-white/10 flex gap-2"
      >
        <input
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);

            socket?.emit("typing", {
              receiverId: selectedUser._id
            });

            clearTimeout(typingTimeoutRef.current);

            typingTimeoutRef.current = setTimeout(() => {
              socket?.emit("stopTyping", {
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

      {/* CLEAR MODAL */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="glass-panel p-6 text-center">
            <h2 className="text-white mb-4">Clear chat?</h2>

            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowClearModal(false)}>
                Cancel
              </button>

              <button
                onClick={handleClearChat}
                className="text-red-400"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatArea;
