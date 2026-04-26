// SocketContext.jsx

import {
  createContext,
  useState,
  useEffect,
  useContext
} from "react";
import { useSelector } from "react-redux";
import io from "socket.io-client";

const SocketContext = createContext();

export const useSocketContext = () =>
  useContext(SocketContext);

export const SocketContextProvider = ({
  children
}) => {
  const { userInfo } = useSelector(
    (state) => state.auth
  );

  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] =
    useState([]);

  useEffect(() => {
    if (!userInfo?._id) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const API_URL =
      import.meta.env.VITE_API_URL ||
      "http://localhost:5000";

    const newSocket = io(API_URL, {
      withCredentials: true,
      query: {
        userId: userInfo._id
      },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    setSocket(newSocket);

    newSocket.on(
      "getOnlineUsers",
      (users) => {
        setOnlineUsers(users);
      }
    );

    newSocket.on("connect", () => {
      console.log(
        "Socket Connected:",
        newSocket.id
      );
    });

    newSocket.on(
      "disconnect",
      (reason) => {
        console.log(
          "Socket Disconnected:",
          reason
        );
      }
    );

    newSocket.on(
      "connect_error",
      (error) => {
        console.log(
          "Socket Error:",
          error.message
        );
      }
    );

    return () => {
      newSocket.off("getOnlineUsers");
      newSocket.off("connect");
      newSocket.off("disconnect");
      newSocket.off("connect_error");
      newSocket.disconnect();
      setSocket(null);
    };
  }, [userInfo?._id]);

  return (
    <SocketContext.Provider
      value={{ socket, onlineUsers }}
    >
      {children}
    </SocketContext.Provider>
  );
};
