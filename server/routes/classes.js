import express from "express";
import { authenticate, authorizeAdmin } from "../middleware/auth.js";
import {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  deleteClass,
  regenerateClassCode,
  joinClass,
  getPendingEnrollments,
  updateEnrollmentStatus,
  assignTestToClass,
  removeTestFromClass,
  getClassTests,
} from "../controllers/classes.js";

const router = express.Router();

// Class management routes (admin only)
router.post("/", authenticate, authorizeAdmin, createClass);
router.get("/", authenticate, getAllClasses);
router.get("/:id", authenticate, getClassById);
router.put("/:id", authenticate, authorizeAdmin, updateClass);
router.delete("/:id", authenticate, authorizeAdmin, deleteClass);
router.post(
  "/:id/regenerate-code",
  authenticate,
  authorizeAdmin,
  regenerateClassCode
);

// Enrollment management
router.post("/join", authenticate, joinClass);
router.get(
  "/:id/enrollments",
  authenticate,
  authorizeAdmin,
  getPendingEnrollments
);
router.put(
  "/enrollments/:id",
  authenticate,
  authorizeAdmin,
  updateEnrollmentStatus
);

// Test assignment management
router.post("/assign-test", authenticate, authorizeAdmin, assignTestToClass);
router.delete(
  "/test-assignments/:id",
  authenticate,
  authorizeAdmin,
  removeTestFromClass
);
router.get("/:id/tests", authenticate, getClassTests);

export default router;
