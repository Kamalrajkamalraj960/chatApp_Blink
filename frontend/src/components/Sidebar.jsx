import { useState, useEffect } from "react";
import { Search, LogOut, Settings } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice";
import { useSocketContext } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";
import SettingsPage from "./Settings";

const Sidebar = ({ selectedUser, setSelectedUser }) => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [openSettings, setOpenSettings] = useState(false);

  const { userInfo } = useSelector((state) => state.auth);
  const { onlineUsers } = useSocketContext();

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const API = "https://chatapp-blink.onrender.com";

  // 🔥 Avatar helper
  const getAvatarUrl = (avatar, refresh = false) => {
    if (!avatar) return "https://i.pravatar.cc/150";

    const url = avatar.startsWith("http")
      ? avatar
      : `${API}${avatar}`;

    return refresh ? `${url}?t=${Date.now()}` : url;
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(
          `${API}/api/users?search=${search}`,
          {
            credentials: "include"
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message);
        }

        setUsers(data.users);
      } catch (error) {
        console.error(error);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleLogout = async () => {
    try {
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });

      dispatch(logout());
      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="sidebar-glass h-full w-full flex flex-col sm:rounded-2xl overflow-hidden">
        {/* HEADER */}
        <div className="p-4 sidebar-header flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={getAvatarUrl(userInfo?.avatar, true)}
              alt="avatar"
              className="w-10 h-10 rounded-full object-cover border border-cyan-500/50"
            />

            <div>
              <h2 className="text-white font-semibold">
                {userInfo?.username}
              </h2>

              <p className="text-xs text-cyan-400">
                Online
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* SETTINGS */}
            <button
              onClick={() => setOpenSettings(true)}
              className="p-2 text-slate-400 hover:text-white transition rounded-full hover:bg-white/10"
            >
              <Settings size={20} />
            </button>

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-white transition rounded-full hover:bg-white/10"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        {/* SEARCH */}
        <div className="p-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />

            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sidebar-search rounded-xl pl-10 pr-4 py-2.5 text-sm text-white outline-none placeholder-slate-500"
            />
          </div>
        </div>

        {/* USER LIST */}
        <div className="flex-1 overflow-y-auto">
          {users?.map((user) => {
            const isOnline = onlineUsers.includes(user._id);
            const isSelected = selectedUser?._id === user._id;

            return (
              <div
                key={user._id}
                onClick={() => setSelectedUser(user)}
                className={`user-item p-4 flex items-center gap-4 cursor-pointer ${isSelected ? "user-selected" : ""
                  }`}
              >
                <div className="relative">
                  <img
                    src={getAvatarUrl(user.avatar)}
                    alt={user.username}
                    className="w-12 h-12 rounded-full object-cover border border-white/10"
                  />

                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#1e293b] rounded-full"></span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">
                    {user.username}
                  </h3>

                  <p className="text-sm text-slate-400 truncate">
                    {user.bio || "Available"}
                  </p>
                </div>
              </div>
            );
          })}

        </div>

      </div>

      {/* SETTINGS POPUP */}
      {openSettings && (
        <SettingsPage setOpenSettings={setOpenSettings} />
      )}
    </>
  );
};

export default Sidebar;
