import { Router } from "express";
import {
  getCitizen,
  getCitizenProfile,
  downloadAccountData,
  clearAccountData,
  deleteAccount,
} from "../Controllers/CitizenHome.js";

const router = Router();

router.get("/home", getCitizen);
router.get("/profile", getCitizenProfile);
router.get("/account/data", downloadAccountData);
router.post("/account/clear", clearAccountData);
router.post("/account/delete", deleteAccount);
export default router;