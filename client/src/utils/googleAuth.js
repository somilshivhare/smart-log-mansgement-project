const GOOGLE_AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";

export const getGoogleAuthUrl = () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;

  if (!clientId) {
    throw new Error("VITE_GOOGLE_CLIENT_ID is not configured.");
  }
  if (!redirectUri) {
    throw new Error("VITE_GOOGLE_REDIRECT_URI is not configured. Set it in your environment variables.");
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

export const getGoogleRedirectUri = () => {
  const redirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
  if (!redirectUri) {
    throw new Error("VITE_GOOGLE_REDIRECT_URI is not configured. Set it in your environment variables.");
  }
  return redirectUri;
};

