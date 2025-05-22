import api from "./axios"; // Assuming axios instance is configured here

// Fetch all calendar events
export const getAllCalendarEvents = async () => {
  const response = await api.get("/calendar");
  return response.data;
};

// Create a new calendar event
export const createCalendarEvent = async (eventData) => {
  const response = await api.post("/calendar", eventData);
  return response.data;
};

// Update a calendar event by ID
export const updateCalendarEvent = async (id, eventData) => {
  const response = await api.put(`/calendar/${id}`, eventData);
  return response.data;
};

// Delete a calendar event by ID
export const deleteCalendarEvent = async (id) => {
  const response = await api.delete(`/calendar/${id}`);
  return response.data; // Or return response status if needed
};
