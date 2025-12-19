import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./App.css";
import axios from "axios";

// Base URL for API calls (can be overridden with VITE_API_URL)
axios.defaults.baseURL =
  import.meta.env.VITE_API_URL || "http://localhost:4000";
// Send cookies (auth token) with requests to the API
axios.defaults.withCredentials = true;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
