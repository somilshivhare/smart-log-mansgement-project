import { Router } from "express";
import { postlogin, postlogout, postsignup } from "../Controllers/adminAuth.js";
const router=Router();
router.post('/signup',postsignup);
router.post('/login',postlogin);
router.post('/logout',postlogout);
export default router;