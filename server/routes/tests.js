import express from "express";
import multer from "multer";
import {
  createTest,
  getAllTests,
  getTestById,
  updateTest,
  deleteTest,
  publishTest,
  startTest,
  submitTest,
  getTestResults,
  getAllTestAttempts,
  getUserTestAttempts,
  uploadTestAttemptRecording,
} from "../controllers/tests.js";
import { authenticate, authorizeAdmin } from "../middleware/auth.js";

const router = express.Router();

// Configure multer for memory storage (to get buffer for Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 200 * 1024 * 1024 }, // Example: 200MB limit for video files
  fileFilter: (req, file, cb) => {
    // Added filename to req.file to be accessible in controller if client doesn't set it
    // However, multer itself doesn't add originalname to req.file if it's not in FormData.
    // The frontend will need to ensure FormData includes the filename if it wants to control it.
    // For now, controller defaults it if not present.
    if (file.mimetype === "video/webm" || file.mimetype === "video/mp4") {
      // Allow webm and mp4
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only .webm or .mp4 video recordings are allowed."
        ),
        false
      );
    }
  },
});

// Admin routes
router.post("/", authenticate, authorizeAdmin, createTest);
router.put("/:id", authenticate, authorizeAdmin, updateTest);
router.delete("/:id", authenticate, authorizeAdmin, deleteTest);
router.put("/:id/publish", authenticate, authorizeAdmin, publishTest);
router.get("/attempts", authenticate, authorizeAdmin, getAllTestAttempts);

// Student and admin routes
router.get("/", authenticate, getAllTests);
router.get("/user/attempts", authenticate, getUserTestAttempts);
router.get("/:id", authenticate, getTestById);

// Student routes
router.post("/:id/start", authenticate, startTest);
router.post("/:id/submit", authenticate, submitTest);
router.get("/:id/results", authenticate, getTestResults);

// Route for uploading test attempt recording (accessible by authenticated users, e.g., students)
router.post(
  "/:testId/attempts/:attemptId/upload-recording",
  authenticate, // Ensure user is authenticated
  upload.single("recording"), // 'recording' should be the field name in FormData from frontend
  uploadTestAttemptRecording
);

export default router;
