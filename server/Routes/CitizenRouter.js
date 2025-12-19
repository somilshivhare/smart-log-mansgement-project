import { Router } from "express";
import {
  getCitizen,
  getCitizenProfile,
  updateCitizenProfile,
  downloadAccountData,
  clearAccountData,
  deleteAccount,
  changeUserPassword,
} from "../Controllers/CitizenHome.js";
import {
  getUserActivityHistory,
  getUserSessions,
  logoutSession,
} from "../Controllers/ActivityHistoryController.js";

const router = Router();

router.get("/home", getCitizen);
router.get("/profile", getCitizenProfile);
router.put("/profile", updateCitizenProfile);
router.put("/account/password", changeUserPassword);
router.get("/account/data", downloadAccountData);
router.post("/account/clear", clearAccountData);
router.post("/account/delete", deleteAccount);
router.get("/activity/history", getUserActivityHistory);
router.get("/sessions", getUserSessions);
router.post("/sessions/:sessionId/logout", logoutSession);
export default router;
