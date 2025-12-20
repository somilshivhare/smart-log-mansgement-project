export const sendSuccess = (res, statusCode, message, data = null) => {
  const response = { success: true, message };
  if (data) {
    if (typeof data === "object" && !Array.isArray(data)) {
      Object.assign(response, data);
    } else {
      response.data = data;
    }
  }
  return res.status(statusCode).json(response);
};

export const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({ success: false, message });
};

