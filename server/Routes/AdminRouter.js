import { Router } from "express";
import {
  getAdmin,
  getDashboardMetrics,
  getAdminProfile,
  updateAdminProfile,
  changeAdminPassword,
  getAdminConfig,
} from "../Controllers/AdminHome.js";
import {
  approveDocument,
  fetchAllDocuments,
  fetchDocumentById,
  rejectDocument,
} from "../Controllers/AdminDocumentController.js";
import { getLogs } from "../Controllers/LogsController.js";
import { getActivityHistoryForUser } from "../Controllers/ActivityHistoryController.js";
import {
  getUsers,
  updateUserStatus,
} from "../Controllers/AdminUserController.js";
const router = Router();
router.get("/home", getAdmin);
router.get("/documents", fetchAllDocuments);
router.get("/documents/:id", fetchDocumentById);
router.get("/metrics", getDashboardMetrics);
router.get("/logs", getLogs);
// Admin profile and settings
router.get("/profile", getAdminProfile);
router.put("/profile", updateAdminProfile);
router.put("/profile/password", changeAdminPassword);
router.get("/config", getAdminConfig);

router.get("/users", getUsers);
router.get("/users/:id/history", getActivityHistoryForUser);
router.post("/users/:id/status", updateUserStatus);
router.post("/documents/:id/approve", approveDocument);
router.post("/documents/:id/reject", rejectDocument);
export default router;
