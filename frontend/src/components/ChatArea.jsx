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

  /* SOCKET */
  useEffect(() => {
    if (!socket) return;

    socket.on("newMessage", (message) => {
      const senderMatch =
        String(message.senderId) ===
        String(selectedUser?._id);

      const receiverMatch =
        String(message.receiverId) ===
        String(selectedUser?._id);

      if (senderMatch || receiverMatch) {
        setMessages((prev) => [...prev, message]);
      }
    });

    socket.on("messagesSeen", () => {
      setMessages((prev) =>
        prev.map((msg) =>
          String(msg.senderId) ===
            String(userInfo._id)
            ? { ...msg, seen: true }
            : msg
        )
      );
    });

    socket.on("showTyping", () =>
      setIsTyping(true)
    );

    socket.on("hideTyping", () =>
      setIsTyping(false)
    );

    return () => {
      socket.off("newMessage");
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

  /* SEND TEXT / IMAGE */
  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!selectedUser) return;

    if (
      !newMessage.trim() &&
      !mediaFile
    )
      return;

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("text", newMessage);
      formData.append(
        "replyTo",
        replyMessage?._id || ""
      );

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

  /* DELETE */
  const handleDeleteMessage = async (id) => {
    try {
      const res = await fetch(
        `${API}/api/messages/${id}`,
        {
          method: "DELETE",
          credentials: "include"
        }
      );

      if (res.ok) {
        setMessages((prev) =>
          prev.filter(
            (msg) => msg._id !== id
          )
        );
      }
    } catch (error) {
      console.error(error);
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
    } catch (error) {
      console.error(error);
    }
  };

  /* RECORD START */
  const startRecording = async () => {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true
          }
        );

      const recorder =
        new MediaRecorder(stream);

      mediaRecorderRef.current =
        recorder;

      audioChunksRef.current = [];

      recorder.ondataavailable = (
        e
      ) => {
        audioChunksRef.current.push(
          e.data
        );
      };

      recorder.onstop = () => {
        const blob = new Blob(
          audioChunksRef.current,
          {
            type: "audio/webm"
          }
        );

        setAudioBlob(blob);

        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );
      };

      recorder.start();
      setIsRecording(true);
    } catch (error) {
      alert(
        "Microphone permission denied"
      );
    }
  };

  /* RECORD STOP */
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  /* SEND VOICE */
  const sendVoiceMessage =
    async () => {
      if (
        !audioBlob ||
        !selectedUser
      )
        return;

      try {
        const formData =
          new FormData();

        formData.append(
          "file",
          audioBlob,
          "voice.webm"
        );

        formData.append("text", "");

        const res = await fetch(
          `${API}/api/messages/${selectedUser._id}`,
          {
            method: "POST",
            credentials:
              "include",
            body: formData
          }
        );

        const data =
          await res.json();

        if (res.ok) {
          setMessages((prev) => [
            ...prev,
            data
          ]);

          setAudioBlob(null);
        }
      } catch (error) {
        console.error(error);
      }
    };

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
          <button
            onClick={() =>
              setSelectedUser(null)
            }
          >
            <ArrowLeft size={20} />
          </button>

          <img
            src={getAvatarUrl(
              selectedUser.avatar
            )}
            alt=""
            className="w-10 h-10 rounded-full object-cover"
          />

          <div>
            <h3 className="text-white">
              {
                selectedUser.username
              }
            </h3>

            <p className="text-xs text-cyan-400">
              {isTyping
                ? "Typing..."
                : isOnline
                  ? "Online"
                  : "Offline"}
            </p>
          </div>
        </div>

        <button
          onClick={() =>
            setShowClearModal(true)
          }
          className="text-xs px-3 py-1 rounded-lg bg-red-500/10 text-red-400"
        >
          Clear Chat
        </button>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {messages.map((msg) => {
          const isMe =
            String(
              msg.senderId
            ) ===
            String(
              userInfo._id
            );

          return (
            <div
              key={msg._id}
              className={`flex ${isMe
                ? "justify-end"
                : "justify-start"
                }`}
            >
              <div
                className={`max-w-xs rounded-2xl px-4 py-2 relative ${isMe
                  ? "bg-cyan-500 text-white"
                  : "bg-white/10 text-white"
                  }`}
              >
                {/* Reply */}
                <button
                  onClick={() =>
                    setReplyMessage(
                      msg
                    )
                  }
                  className="absolute top-1 left-1 text-xs"
                >
                  <Reply size={12} />
                </button>

                {/* Delete */}
                {isMe && (
                  <button
                    onClick={() =>
                      handleDeleteMessage(
                        msg._id
                      )
                    }
                    className="absolute top-1 right-1"
                  >
                    <Trash2
                      size={12}
                    />
                  </button>
                )}

                {/* Reply Preview */}
                {msg.replyTo && (
                  <div className="text-xs bg-black/20 rounded-lg px-2 py-1 mb-2">
                    {msg.replyTo
                      .text ||
                      "Media"}
                  </div>
                )}

                {/* Text */}
                {msg.text && (
                  <p className="mt-3">
                    {msg.text}
                  </p>
                )}

                {/* Image */}
                {msg.mediaType ===
                  "image" && (
                    <img
                      src={`${API}${msg.mediaUrl}`}
                      alt=""
                      className="rounded-xl mt-2 max-w-xs"
                    />
                  )}

                {/* Audio */}
                {msg.mediaType ===
                  "audio" && (
                    <div className="mt-2 bg-black/20 rounded-2xl p-3">
                      <p className="text-xs mb-2">
                        🎤 Voice Message
                      </p>

                      <audio
                        controls
                        className="w-full h-10"
                      >
                        <source
                          src={`${API}${msg.mediaUrl}`}
                          type="audio/webm"
                        />
                      </audio>
                    </div>
                  )}

                <span className="text-[10px] opacity-70 block mt-2">
                  {new Date(
                    msg.createdAt
                  ).toLocaleTimeString(
                    [],
                    {
                      hour:
                        "2-digit",
                      minute:
                        "2-digit"
                    }
                  )}
                </span>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* REPLY BAR */}
      {replyMessage && (
        <div className="px-4 py-2 bg-white/10 flex justify-between items-center">
          <p className="text-sm text-white truncate">
            Replying:{" "}
            {replyMessage.text ||
              "Media"}
          </p>

          <button
            onClick={() =>
              setReplyMessage(null)
            }
          >
            <X
              size={18}
              className="text-red-400"
            />
          </button>
        </div>
      )}

      {/* IMAGE PREVIEW */}
      {preview && (
        <div className="px-4 py-2">
          <img
            src={preview}
            alt=""
            className="w-24 h-24 rounded-xl object-cover"
          />
        </div>
      )}

      {/* VOICE READY */}
      {audioBlob && (
        <div className="px-4 py-2 flex gap-2 items-center">
          <audio
            controls
            src={URL.createObjectURL(
              audioBlob
            )}
          />

          <button
            onClick={
              sendVoiceMessage
            }
            className="bg-green-500 px-3 py-2 rounded-xl text-white"
          >
            Send Voice
          </button>
        </div>
      )}

      {/* INPUT */}
      <div className="p-3 border-t border-white/10">
        <form
          onSubmit={
            handleSendMessage
          }
          className="flex gap-2"
        >
          <input
            type="file"
            hidden
            ref={fileInputRef}
            onChange={(e) => {
              const file =
                e.target
                  .files[0];

              if (!file)
                return;

              setMediaFile(
                file
              );

              setPreview(
                URL.createObjectURL(
                  file
                )
              );
            }}
          />

          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            className="p-3 text-gray-400"
          >
            <ImageIcon
              size={20}
            />
          </button>

          <input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(
                e.target.value
              );

              socket.emit(
                "typing",
                {
                  receiverId:
                    selectedUser._id
                }
              );

              clearTimeout(
                typingTimeoutRef.current
              );

              typingTimeoutRef.current =
                setTimeout(
                  () => {
                    socket.emit(
                      "stopTyping",
                      {
                        receiverId:
                          selectedUser._id
                      }
                    );
                  },
                  1000
                );
            }}
            placeholder="Type message..."
            className="flex-1 px-4 py-3 bg-white/10 rounded-xl text-white outline-none"
          />

          {!isRecording ? (
            <button
              type="button"
              onClick={
                startRecording
              }
              className="p-3 text-gray-400"
            >
              <Mic
                size={20}
              />
            </button>
          ) : (
            <button
              type="button"
              onClick={
                stopRecording
              }
              className="p-3 text-red-500"
            >
              <Square
                size={20}
              />
            </button>
          )}

          <button
            disabled={
              uploading
            }
            className="p-3 bg-cyan-500 text-white rounded-xl"
          >
            <Send
              size={18}
            />
          </button>
        </form>
      </div>

      {/* CLEAR MODAL */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="glass-panel p-6 text-center">
            <h2 className="text-white mb-3">
              Clear chat?
            </h2>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() =>
                  setShowClearModal(
                    false
                  )
                }
              >
                Cancel
              </button>

              <button
                onClick={
                  handleClearChat
                }
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
