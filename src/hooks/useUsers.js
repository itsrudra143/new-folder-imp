import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userService } from "../services/userService";

// Hook to fetch a single user by ID
export const useUser = (userId) => {
  return useQuery({
    queryKey: ["user", userId],
    queryFn: () => userService.getUserById(userId),
    enabled: !!userId, // Only run the query if userId is provided
  });
};

// Hook to fetch all users (admin only)
export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => userService.getAllUsers(),
  });
};

// Hook to update a user by ID (admin only)
export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData) => userService.updateUser(userData.id, userData),
    onSuccess: (data, variables) => {
      // Invalidate and refetch the user query
      queryClient.invalidateQueries({ queryKey: ["user", variables.id] });
      // Also invalidate the users list if it exists
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

// Hook to update current user's profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (profileData) => userService.updateProfile(profileData),
    onSuccess: () => {
      // Invalidate and refetch the current user query
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });
};

// Hook to delete a user (admin only)
export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userId) => userService.deleteUser(userId),
    onSuccess: () => {
      // Invalidate and refetch the users list
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

// Hook to create a new user (admin only)
export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (userData) => userService.createUser(userData),
    onSuccess: () => {
      // Invalidate and refetch the users list
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}; 