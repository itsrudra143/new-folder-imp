import axios from './axios';

// Create a new class
export const createClass = async (classData) => {
  const response = await axios.post('/classes', classData);
  return response.data;
};

// Get all classes (admin sees their classes, students see enrolled classes)
export const getAllClasses = async () => {
  const response = await axios.get('/classes');
  return response.data;
};

// Get class by ID
export const getClassById = async (id) => {
  const response = await axios.get(`/classes/${id}`);
  return response.data;
};

// Update class
export const updateClass = async (id, classData) => {
  const response = await axios.put(`/classes/${id}`, classData);
  return response.data;
};

// Delete class
export const deleteClass = async (id) => {
  const response = await axios.delete(`/classes/${id}`);
  return response.data;
};

// Regenerate class code
export const regenerateClassCode = async (id) => {
  const response = await axios.post(`/classes/${id}/regenerate-code`);
  return response.data;
};

// Join class (for students)
export const joinClass = async (code) => {
  const response = await axios.post('/classes/join', { code });
  return response.data;
};

// Get pending enrollment requests (for admin)
export const getPendingEnrollments = async (classId) => {
  const response = await axios.get(`/classes/${classId}/enrollments`);
  return response.data;
};

// Update enrollment status (approve/reject)
export const updateEnrollmentStatus = async (enrollmentId, status) => {
  const response = await axios.put(`/classes/enrollments/${enrollmentId}`, { status });
  return response.data;
};

// Assign test to class
export const assignTestToClass = async (classId, testId) => {
  const response = await axios.post('/classes/assign-test', { classId, testId });
  return response.data;
};

// Remove test from class
export const removeTestFromClass = async (assignmentId) => {
  const response = await axios.delete(`/classes/test-assignments/${assignmentId}`);
  return response.data;
};

// Get tests for a class
export const getClassTests = async (classId) => {
  const response = await axios.get(`/classes/${classId}/tests`);
  return response.data;
}; 