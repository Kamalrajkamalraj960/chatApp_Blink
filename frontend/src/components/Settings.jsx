import { useState, useRef } from "react";
import { Camera, Save, ArrowLeft } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { setCredentials } from "../store/slices/authSlice";

const Settings = ({ setOpenSettings }) => {
    const { userInfo } = useSelector((state) => state.auth);
    const dispatch = useDispatch();

    const API = "https://chatapp-blink.onrender.com";

    const [username, setUsername] = useState(
        userInfo?.username || ""
    );

    const [bio, setBio] = useState(
        userInfo?.bio || ""
    );

    const [avatar, setAvatar] = useState(null);

    const [preview, setPreview] = useState(
        userInfo?.avatar
            ? userInfo.avatar.startsWith("http")
                ? userInfo.avatar
                : `${API}${userInfo.avatar}`
            : ""
    );

    const [loading, setLoading] = useState(false);

    const fileRef = useRef(null);

    const handleImage = (e) => {
        const file = e.target.files[0];

        if (!file) return;

        setAvatar(file);
        setPreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        try {
            setLoading(true);

            const formData = new FormData();
            formData.append("username", username);
            formData.append("bio", bio);

            if (avatar) {
                formData.append("avatar", avatar);
            }

            const res = await fetch(`${API}/api/users/profile`, {
                method: "PUT",
                body: formData,
                credentials: "include"
            });

            const data = await res.json();

            if (res.ok) {
                dispatch(setCredentials(data));

                const imageUrl = data.avatar
                    ? data.avatar.startsWith("http")
                        ? data.avatar
                        : `${API}${data.avatar}`
                    : "";

                setPreview(imageUrl);

                alert("Profile Updated 🔥");

                setOpenSettings(false);
            }
            else {
                alert(data.message);
            }

        } catch (error) {
            console.error(error);
            alert("Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center">

            <div className="w-full max-w-md bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">

                    <button
                        onClick={() => setOpenSettings(false)}
                        className="p-2 rounded-full hover:bg-white/10"
                    >
                        <ArrowLeft size={20} />
                    </button>

                    <h2 className="text-xl font-semibold text-white">
                        Settings
                    </h2>

                    <div></div>
                </div>

                {/* Avatar */}
                <div className="flex flex-col items-center mb-6">

                    <div className="relative">
                        <img
                            src={
                                preview ||
                                "https://i.pravatar.cc/150"
                            }
                            alt=""
                            className="w-28 h-28 rounded-full object-cover border-4 border-cyan-500"
                        />

                        <button
                            type="button"
                            onClick={() =>
                                fileRef.current?.click()
                            }
                            className="absolute bottom-0 right-0 bg-cyan-500 p-2 rounded-full"
                        >
                            <Camera size={16} />
                        </button>

                        <input
                            type="file"
                            hidden
                            ref={fileRef}
                            onChange={handleImage}
                        />
                    </div>
                </div>

                {/* Username */}
                <div className="mb-4">
                    <label className="text-sm text-gray-400 block mb-2">
                        Username
                    </label>

                    <input
                        value={username}
                        onChange={(e) =>
                            setUsername(e.target.value)
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none"
                    />
                </div>

                {/* Bio */}
                <div className="mb-6">
                    <label className="text-sm text-gray-400 block mb-2">
                        Bio
                    </label>

                    <textarea
                        rows="3"
                        value={bio}
                        onChange={(e) =>
                            setBio(e.target.value)
                        }
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white outline-none resize-none"
                    />
                </div>

                {/* Save */}
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full py-3 rounded-2xl bg-cyan-500 text-white font-semibold flex items-center justify-center gap-2 hover:bg-cyan-600 transition"
                >
                    <Save size={18} />

                    {loading
                        ? "Saving..."
                        : "Save Changes"}
                </button>

            </div>
        </div>
    );
};

export default Settings;
