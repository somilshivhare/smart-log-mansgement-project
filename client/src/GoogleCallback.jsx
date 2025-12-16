import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function GoogleCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const errorParam = params.get("error");

      if (errorParam) {
        setError(errorParam);
        return;
      }

      if (!code) {
        setError("No authorization code found in the URL.");
        return;
      }

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_PATH}/citizen/auth/google`,
          {
            code,
            redirectUri:
              import.meta.env.VITE_GOOGLE_REDIRECT_URI ||
              `${window.location.origin}/auth/google/callback`,
          },
          { withCredentials: true }
        );

        if (response.data?.success) {
          navigate("/citizen");
        } else {
          setError(
            response.data?.message || "Failed to authenticate with Google."
          );
        }
      } catch (err) {
        console.error("Google callback error:", err);
        setError(
          err?.response?.data?.message ||
            "Network error while completing Google login."
        );
      }
    };

    handleCallback();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 font-medium">
          Google login error: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-lg">Signing you in with Google...</p>
    </div>
  );
}


