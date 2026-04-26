import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatArea from "../components/ChatArea";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import api from "../axios";


const ChatPage = () => {
  const { userInfo } = useSelector((state) => state.auth);

  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/api/users?search=");
        console.log("Users:", res.data);
      } catch (err) {
        console.log("User fetch error:", err.message);
      }
    };

    fetchUsers();
  }, []);

  if (!userInfo) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen w-full flex overflow-hidden bg-primary relative">
      <div className="flex w-full h-full max-w-[1600px] mx-auto">

        <div className={`${selectedUser ? "hidden sm:block" : "block"} w-full sm:w-80`}>
          <Sidebar
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
          />
        </div>

        <div className={`${!selectedUser ? "hidden sm:flex" : "flex"} flex-1`}>
          <ChatArea
            selectedUser={selectedUser}
            setSelectedUser={setSelectedUser}
          />
        </div>

      </div>
    </div>
  );
};

export default ChatPage;
