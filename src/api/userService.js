import axios from './axios';

// Get user profile
export const getProfile = async () => {
  const response = await axios.get('/users/profile');
  return response.data;
};

// Update user profile
export const updateProfile = async (profileData) => {
  const response = await axios.put('/users/profile', profileData);
  
  // Update user in localStorage if profile was updated
  if (response.data.user) {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const updatedUser = {
      ...currentUser,
      firstName: response.data.user.firstName,
      lastName: response.data.user.lastName
    };
    
    // If user is a student, include profile fields directly in the user object
    if (response.data.user.role === 'STUDENT') {
      updatedUser.rollNumber = response.data.user.rollNumber || '';
      updatedUser.class = response.data.user.class || '';
      updatedUser.batch = response.data.user.batch || '';
      updatedUser.mentor = response.data.user.mentor || '';
    }
    
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }
  
  return response.data;
}; 