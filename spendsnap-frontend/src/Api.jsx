// src/api.jsx
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env?.VITE_API_URL ?? "http://localhost:8080",
  timeout: 15000,
});

// Attach JWT from sessionStorage on every request
api.interceptors.request.use(
  (config) => {
    let token = sessionStorage.getItem("token");
    // normalize in case backend returned "Bearer <jwt>"
    if (token?.startsWith("Bearer ")) token = token.slice(7);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Prevent endless redirect loops on 401
let handling401 = false;
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401 && location.pathname !== "/login" && !handling401) {
      handling401 = true;
      // debounce repeated 401s
      const now = Date.now();
      const last = Number(sessionStorage.getItem("__last401")) || 0;
      if (now - last > 2000) {
        sessionStorage.setItem("__last401", String(now));
        sessionStorage.clear();
        location.replace("/login"); // use replace so back button doesn't loop
      }
      setTimeout(() => (handling401 = false), 2000);
    }
    return Promise.reject(err);
  }
);

export default api;
export const API_BASE_URL = api.defaults.baseURL;
