const rawUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const API_BASE_URL = rawUrl.replace(/\/$/, "");
