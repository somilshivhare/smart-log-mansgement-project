const PRODUCTION_REDIRECT_URI = "https://docverify-two.vercel.app/auth/google/callback";
const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";

// Helper to sanitize a configured redirect URI. If its hostname does not match the production hostname, ignore it.
const sanitizeRedirectUri = (uri) => {
  if (!uri) return null;
  try {
    const uriHost = new URL(uri).hostname;
    const productionHost = new URL(PRODUCTION_REDIRECT_URI).hostname;
    if (uriHost !== productionHost) {
      // configured redirect doesn't match production host — ignore it and use production
      return null;
    }
    return uri;
  } catch (e) {
    // invalid URL — ignore
    return null;
  }
};

// Build Google OAuth URL using environment configuration. When VITE_GOOGLE_REDIRECT_URI is
// not provided or its hostname differs from production, default to the production redirect URI.
export const getGoogleAuthUrl = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const configured = sanitizeRedirectUri(import.meta.env.VITE_GOOGLE_REDIRECT_URI);
  const redirectUri = configured || PRODUCTION_REDIRECT_URI;

  if (!clientId) {
    throw new Error("VITE_GOOGLE_CLIENT_ID is not configured.");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: ["openid", "email", "profile"].join(" "),
    access_type: "offline",
    include_granted_scopes: "true",
    prompt: "consent",
  });

  return `${GOOGLE_AUTH_ENDPOINT}?${params.toString()}`;
};

// Returns the redirect URI used for completing OAuth flows. Defaults to production if not configured or invalid.
export const getGoogleRedirectUri = () => {
  return sanitizeRedirectUri(import.meta.env.VITE_GOOGLE_REDIRECT_URI) || PRODUCTION_REDIRECT_URI;
};

