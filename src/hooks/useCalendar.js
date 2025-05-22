import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// Import the specific service functions
import * as calendarService from "../api/calendarService";
import { toast } from "react-hot-toast"; // Import toast for user feedback

// Fetch all calendar events
const fetchCalendarEvents = async () => {
  // Use the service function
  return await calendarService.getAllCalendarEvents();
};

export const useCalendarEvents = (options = {}) => {
  return useQuery({
    queryKey: ["calendarEvents"],
    queryFn: fetchCalendarEvents,
    onError: (error) => {
      // Add basic error handling for fetch
      console.error("Error fetching calendar events:", error);
      toast.error(
        error.response?.data?.message || "Failed to fetch calendar events"
      );
    },
    ...options,
  });
};

// Create a new calendar event
export const useCreateCalendarEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    // Use the service function
    mutationFn: calendarService.createCalendarEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
      toast.success("Calendar event created successfully");
    },
    onError: (error) => {
      console.error("Error creating calendar event:", error);
      toast.error(
        error.response?.data?.message || "Failed to create calendar event"
      );
    },
  });
};

// Update a calendar event
const updateEventMutationFn = async ({ id, eventData }) => {
  // Use the service function
  return await calendarService.updateCalendarEvent(id, eventData);
};

export const useUpdateCalendarEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateEventMutationFn,
    onSuccess: (_data, variables) => {
      // Use _data prefix for unused variable
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
      // Optionally update the specific event in the cache
      queryClient.invalidateQueries({
        queryKey: ["calendarEvents", variables.id],
      }); // Also invalidate single event if needed
      toast.success("Calendar event updated successfully");
    },
    onError: (error) => {
      console.error("Error updating calendar event:", error);
      toast.error(
        error.response?.data?.message || "Failed to update calendar event"
      );
    },
  });
};

// Delete a calendar event
const deleteEventMutationFn = async (id) => {
  // Use the service function
  return await calendarService.deleteCalendarEvent(id);
};

export const useDeleteCalendarEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteEventMutationFn,
    onSuccess: (_data, _id) => {
      // Use _data and _id prefix for unused variables
      queryClient.invalidateQueries({ queryKey: ["calendarEvents"] });
      // Optionally remove the event from the cache
      // queryClient.removeQueries({ queryKey: ["calendarEvents", _id] });
      toast.success("Calendar event deleted successfully");
    },
    onError: (error) => {
      console.error("Error deleting calendar event:", error);
      toast.error(
        error.response?.data?.message || "Failed to delete calendar event"
      );
    },
  });
};
