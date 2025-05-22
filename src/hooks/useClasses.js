import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as classService from "../api/classService";
import { toast } from "react-hot-toast";

// Hook for fetching all classes
export const useClasses = (options = {}) => {
  return useQuery({
    queryKey: ["classes"],
    queryFn: classService.getAllClasses,
    ...options,
  });
};

// Hook for fetching a single class by ID
export const useClass = (id) => {
  return useQuery({
    queryKey: ["classes", id],
    queryFn: () => classService.getClassById(id),
    enabled: !!id,
  });
};

// Hook for creating a new class
export const useCreateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classService.createClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class created successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to create class");
    },
  });
};

// Hook for updating a class
export const useUpdateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, classData }) => classService.updateClass(id, classData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["classes", variables.id] });
      toast.success("Class updated successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update class");
    },
  });
};

// Hook for deleting a class
export const useDeleteClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classService.deleteClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Class deleted successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete class");
    },
  });
};

// Hook for regenerating a class code
export const useRegenerateClassCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classService.regenerateClassCode,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["classes", variables] });
      toast.success("Class code regenerated successfully");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to regenerate class code"
      );
    },
  });
};

// Hook for joining a class (students)
export const useJoinClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classService.joinClass,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Enrollment request submitted successfully");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to join class");
    },
  });
};

// Hook for fetching pending enrollments
export const usePendingEnrollments = (classId) => {
  return useQuery({
    queryKey: ["enrollments", classId],
    queryFn: () => classService.getPendingEnrollments(classId),
    enabled: !!classId,
  });
};

// Hook for updating enrollment status
export const useUpdateEnrollmentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ enrollmentId, status }) =>
      classService.updateEnrollmentStatus(enrollmentId, status),
    onSuccess: (_, variables) => {
      // We don't know which class this enrollment belongs to, so invalidate all
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success(
        `Enrollment ${variables.status.toLowerCase()} successfully`
      );
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to update enrollment status"
      );
    },
  });
};

// Hook for assigning a test to a class
export const useAssignTestToClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classId, testId }) =>
      classService.assignTestToClass(classId, testId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["classes", variables.classId],
      });
      queryClient.invalidateQueries({
        queryKey: ["classes", variables.classId, "tests"],
      });
      toast.success("Test assigned to class successfully");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to assign test to class"
      );
    },
  });
};

// Hook for removing a test from a class
export const useRemoveTestFromClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: classService.removeTestFromClass,
    onSuccess: () => {
      // We don't know which class this test belongs to, so invalidate all
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      toast.success("Test removed from class successfully");
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || "Failed to remove test from class"
      );
    },
  });
};

// Hook for fetching tests for a class
export const useClassTests = (classId, options = {}) => {
  return useQuery({
    queryKey: ["classes", classId, "tests"],
    queryFn: () => classService.getClassTests(classId),
    enabled: !!classId,
    ...options,
  });
};
