import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all calendar events
export const getAllCalendarEvents = async (req, res) => {
  try {
    // Optional: Add filtering by date range if needed from query params
    // const { startDate, endDate } = req.query;
    const events = await prisma.calendarEvent.findMany({
      orderBy: { startTime: "asc" },
      // Add where clause here if filtering is implemented
      include: {
        test: {
          // Include linked test details if available
          select: {
            id: true, // Include ID for reference
            title: true,
            status: true, // Include test status
            isPublished: true, // Include published status
            startTime: true, // Include test start time for comparison/filtering
          },
        },
      },
    });
    res.json(events);
  } catch (error) {
    console.error("Get calendar events error:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching calendar events" });
  }
};

// Create a new calendar event
export const createCalendarEvent = async (req, res) => {
  try {
    const { title, description, startTime, endTime, isAllDay, testId } =
      req.body;

    // Basic validation
    if (!title || !startTime) {
      return res
        .status(400)
        .json({ message: "Title and startTime are required." });
    }

    const newEvent = await prisma.calendarEvent.create({
      data: {
        title,
        description,
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : null,
        isAllDay: isAllDay || false,
        testId: testId || null,
        // createdById: userId, // Add if you want to track who created the event
      },
      include: {
        test: { select: { title: true } },
      },
    });
    res.status(201).json(newEvent);
  } catch (error) {
    console.error("Create calendar event error:", error);
    res
      .status(500)
      .json({ message: "Server error while creating calendar event" });
  }
};

// Update a calendar event
export const updateCalendarEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, startTime, endTime, isAllDay, testId } =
      req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (endTime !== undefined)
      updateData.endTime = endTime ? new Date(endTime) : null;
    if (isAllDay !== undefined) updateData.isAllDay = isAllDay;
    if (testId !== undefined) updateData.testId = testId || null; // Allow unsetting testId

    const updatedEvent = await prisma.calendarEvent.update({
      where: { id },
      data: updateData,
      include: {
        test: { select: { title: true } },
      },
    });
    res.json(updatedEvent);
  } catch (error) {
    console.error("Update calendar event error:", error);
    res
      .status(500)
      .json({ message: "Server error while updating calendar event" });
  }
};

// Delete a calendar event
export const deleteCalendarEvent = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.calendarEvent.delete({
      where: { id },
    });
    res.status(204).send(); // No content on successful deletion
  } catch (error) {
    console.error("Delete calendar event error:", error);
    res
      .status(500)
      .json({ message: "Server error while deleting calendar event" });
  }
};
