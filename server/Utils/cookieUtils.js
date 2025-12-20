export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: false,
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

