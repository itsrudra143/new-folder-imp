import axios from "axios";
import { API_URL } from "./config";

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const userService = {
  // Get current user profile
  getCurrentUser: async () => {
    const response = await api.get("/users/me");
    return response.data;
  },

  // Get user by ID
  getUserById: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  // Get all users (admin only)
  getAllUsers: async () => {
    const response = await api.get("/users");
    return response.data;
  },

  // Update user by ID (admin only)
  updateUser: async (userId, userData) => {
    const response = await api.put(`/users/${userId}`, userData);
    return response.data;
  },

  // Update current user's profile
  updateProfile: async (profileData) => {
    console.log("userService.updateProfile called with:", profileData);
    
    try {
      const response = await api.put("/users/profile", profileData);
      console.log("Profile update response:", response.data);
      
      // Update user in localStorage if profile was updated successfully
      if (response.data && response.data.user) {
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        
        // Create updated user with all fields from response
        const updatedUser = {
          ...currentUser,
          ...response.data.user
        };
        
        // For students, ensure profile fields are included
        if (updatedUser.role === 'STUDENT') {
          // Copy profile fields from response if they exist
          if (response.data.user.rollNumber !== undefined) updatedUser.rollNumber = response.data.user.rollNumber;
          if (response.data.user.class !== undefined) updatedUser.class = response.data.user.class;
          if (response.data.user.batch !== undefined) updatedUser.batch = response.data.user.batch;
          if (response.data.user.mentor !== undefined) updatedUser.mentor = response.data.user.mentor;
          
          // Fallback to profile object if direct fields don't exist
          if (response.data.user.profile) {
            if (!updatedUser.rollNumber && response.data.user.profile.rollNumber) {
              updatedUser.rollNumber = response.data.user.profile.rollNumber;
            }
            if (!updatedUser.class && response.data.user.profile.class) {
              updatedUser.class = response.data.user.profile.class;
            }
            if (!updatedUser.batch && response.data.user.profile.batch) {
              updatedUser.batch = response.data.user.profile.batch;
            }
            if (!updatedUser.mentor && response.data.user.profile.mentor) {
              updatedUser.mentor = response.data.user.profile.mentor;
            }
          }
        }
        
        localStorage.setItem("user", JSON.stringify(updatedUser));
        console.log("Updated user in localStorage:", updatedUser);
      }
      
      return response.data;
    } catch (error) {
      console.error("Error in userService.updateProfile:", error);
      console.error("Error response:", error.response?.data);
      throw error;
    }
  },

  // Delete user (admin only)
  deleteUser: async (userId) => {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },

  // Create user (admin only)
  createUser: async (userData) => {
    const response = await api.post("/users", userData);
    return response.data;
  },
}; 