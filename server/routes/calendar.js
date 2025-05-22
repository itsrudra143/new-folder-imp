import express from "express";
import {
  getAllCalendarEvents,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "../controllers/calendar.js";
import { authenticate, authorizeAdmin } from "../middleware/auth.js";

const router = express.Router();

// Apply authenticate middleware to all routes
router.use(authenticate);

// Routes for calendar events
router.get("/", getAllCalendarEvents);

// Only admins can create, update, delete calendar events
router.post("/", authorizeAdmin, createCalendarEvent);
router.put("/:id", authorizeAdmin, updateCalendarEvent);
router.delete("/:id", authorizeAdmin, deleteCalendarEvent);

export default router;
