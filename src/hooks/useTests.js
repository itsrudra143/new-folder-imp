import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as testService from "../api/testService";

// Hook for fetching all tests
export const useTests = (options = {}) => {
  return useQuery({
    queryKey: ["tests"],
    queryFn: testService.getAllTests,
    refetchInterval: 60000, // Refetch every minute to check for test activation
    ...options,
  });
};

// Hook for fetching a single test
export const useTest = (id, options = {}) => {
  return useQuery({
    queryKey: ["tests", id],
    queryFn: () => testService.getTestById(id),
    enabled: !!id,
    refetchInterval: 60000, // Refetch every minute to check for test activation
    ...options,
  });
};

// Hook for creating a new test
export const useCreateTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: testService.createTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
    },
  });
};

// Hook for updating a test
export const useUpdateTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, testData }) => testService.updateTest(id, testData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      queryClient.invalidateQueries({ queryKey: ["tests", variables.id] });
    },
  });
};

// Hook for deleting a test
export const useDeleteTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: testService.deleteTest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
    },
  });
};

// Hook for publishing a test
export const usePublishTest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, scheduleData }) =>
      testService.publishTest(id, scheduleData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tests"] });
      queryClient.invalidateQueries({ queryKey: ["tests", variables.id] });
    },
  });
};

// Hook for starting a test attempt
export const useStartTest = () => {
  return useMutation({
    mutationFn: testService.startTest,
  });
};

// Hook for submitting a test
export const useSubmitTest = () => {
  return useMutation({
    mutationFn: ({ id, answers }) => testService.submitTest(id, answers),
  });
};

// Hook for fetching test results
export const useTestResults = (id) => {
  return useQuery({
    queryKey: ["testResults", id],
    queryFn: () => testService.getTestResults(id),
    enabled: !!id,
  });
};

// Hook for fetching all test attempts (admin only)
export const useAllTestAttempts = () => {
  return useQuery({
    queryKey: ["testAttempts"],
    queryFn: testService.getAllTestAttempts,
  });
};

// Hook for fetching user's own test attempts
export const useUserTestAttempts = () => {
  return useQuery({
    queryKey: ["userTestAttempts"],
    queryFn: testService.getUserTestAttempts,
  });
};

// Hook for uploading a test attempt recording
export const useUploadRecording = () => {
  // const queryClient = useQueryClient(); // Not invalidating any queries for now
  return useMutation({
    mutationFn: ({ testId, attemptId, formData }) =>
      testService.uploadTestAttemptRecording(testId, attemptId, formData),
    // onSuccess: (data) => {
    // Optional: Handle success, e.g., invalidate queries or show toast
    // queryClient.invalidateQueries({ queryKey: ['testAttempts', variables.testId] });
    // },
    // onError: (error) => {
    // Optional: Handle error globally here if needed
    // }
  });
};
