import axios from "axios";

const TOKEN_KEY = "ahc_token";

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

// Always use "/" so both the local Vite dev proxy and the production
// Netlify proxy redirect handle /api/* without CORS restrictions.
const api = axios.create({ baseURL: "/" });

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Surface a clean, user-friendly error message from FastAPI responses.
export function extractError(error, fallback = "Something went wrong. Please try again.") {
  const detail = error?.response?.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((d) => d.msg).join(", ");
  }
  return error?.message || fallback;
}

export default api;
