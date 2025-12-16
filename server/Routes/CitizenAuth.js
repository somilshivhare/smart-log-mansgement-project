import { Router } from "express";
import {
  postlogin,
  postsignup,
  postlogout,
  googleLogin,
} from "../Controllers/UserAuthController.js";

const router = Router();

router.post("/signup", postsignup);
router.post("/login", postlogin);
router.post("/logout", postlogout);
router.post("/google", googleLogin);

export default router;
