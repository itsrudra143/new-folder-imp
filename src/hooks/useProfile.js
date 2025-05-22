import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as userService from '../api/userService';

// Hook for fetching user profile
export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: userService.getProfile,
  });
};

// Hook for updating user profile
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userService.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}; 