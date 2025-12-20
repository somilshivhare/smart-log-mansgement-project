const isProd = process.env.NODE_ENV === "production";

export const cookieOptions = {
  httpOnly: true,
  secure: !!isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
};

export const setAuthCookie = (res, token) => {
  res.cookie("token", token, cookieOptions);
};

export const setSessionCookie = (res, sessionId) => {
  res.cookie("sessionId", sessionId, cookieOptions);
};

export const clearAuthCookie = (res) => {
  res.clearCookie("token", cookieOptions);
  res.clearCookie("sessionId", cookieOptions);
};

