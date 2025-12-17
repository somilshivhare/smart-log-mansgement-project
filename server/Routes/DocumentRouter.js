import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../Middlewares/AuthMiddleware.js";
import {
  fetchDocuments,
  getDocumentDetails,
  uploadDocument,
} from "../Controllers/DocumentController.js";
const router = Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });
router.post(
  "/upload-document",
  authMiddleware,
  upload.single("document"),
  uploadDocument
);
router.get("/fetch-documents", authMiddleware, fetchDocuments);
router.get("/:id", authMiddleware, getDocumentDetails);

export default router;
