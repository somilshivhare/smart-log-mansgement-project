import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_PATH;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const authAPI = {
  citizen: {
    signup: (data) => apiClient.post("/citizen/auth/signup", data),
    login: (data) => apiClient.post("/citizen/auth/login", data),
    logout: () => apiClient.post("/citizen/auth/logout"),
    googleLogin: (data) => apiClient.post("/citizen/auth/google", data),
    changePassword: (data) => apiClient.post("/citizen/auth/change-password", data),
    logoutAll: () => apiClient.post("/citizen/auth/logout-all"),
  },
  admin: {
    signup: (data) => apiClient.post("/admin/auth/signup", data),
    login: (data) => apiClient.post("/admin/auth/login", data),
    logout: () => apiClient.post("/admin/auth/logout"),
  },
};

export const citizenAPI = {
  getHome: () => apiClient.get("/user/home"),
  getProfile: () => apiClient.get("/user/profile"),
  downloadAccountData: () => apiClient.get("/user/account/data", { responseType: "blob" }),
  getActiveSessions: () => apiClient.get("/user/account/sessions"),
  clearAccountData: () => apiClient.post("/user/account/clear"),
  deleteAccount: () => apiClient.post("/user/account/delete"),
};

export const adminAPI = {
  getHome: () => apiClient.get("/admin/home"),
};

export default apiClient;

