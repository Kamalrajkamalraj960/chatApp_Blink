import axios from "axios";

const api = axios.create({
    baseURL: "https://chatapp-blink.onrender.com",
    withCredentials: true,
});

export default api;
