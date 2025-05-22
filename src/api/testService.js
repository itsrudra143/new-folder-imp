import axios from "./axios";

// Create a new test
export const createTest = async (testData) => {
  const response = await axios.post("/tests", testData);
  return response.data;
};

// Get all tests
export const getAllTests = async () => {
  const response = await axios.get("/tests");
  return response.data;
};

// Get test by ID
export const getTestById = async (id) => {
  const response = await axios.get(`/tests/${id}`);
  return response.data;
};

// Update test
export const updateTest = async (id, testData) => {
  const response = await axios.put(`/tests/${id}`, testData);
  return response.data;
};

// Delete test
export const deleteTest = async (id) => {
  const response = await axios.delete(`/tests/${id}`);
  return response.data;
};

// Publish test
export const publishTest = async (id, scheduleData) => {
  const response = await axios.put(`/tests/${id}/publish`, scheduleData);
  return response.data;
};

// Start test attempt
export const startTest = async (id) => {
  const response = await axios.post(`/tests/${id}/start`);
  return response.data;
};

// Submit test
export const submitTest = async (id, answers) => {
  const response = await axios.post(`/tests/${id}/submit`, { answers });
  return response.data;
};

// Get test results
export const getTestResults = async (id) => {
  const response = await axios.get(`/tests/${id}/results`);
  return response.data;
};

// Get all test attempts (admin only)
export const getAllTestAttempts = async () => {
  const response = await axios.get("/tests/attempts");
  return response.data;
};

// Get user's own test attempts
export const getUserTestAttempts = async () => {
  const response = await axios.get("/tests/user/attempts");
  return response.data;
};

// Upload test attempt recording
export const uploadTestAttemptRecording = async (
  testId,
  attemptId,
  formData
) => {
  const response = await axios.post(
    `/tests/${testId}/attempts/${attemptId}/upload-recording`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};
