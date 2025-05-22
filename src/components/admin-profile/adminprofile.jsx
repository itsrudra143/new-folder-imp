import React, { useState, useEffect } from "react";
import "./adminprofile.css";

const AdminProfileForm = ({ initialData, onSubmit }) => {
  // Debug the props received
  console.log("AdminProfileForm received props:", { initialData, onSubmitType: typeof onSubmit });

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isPasswordChangeVisible, setIsPasswordChangeVisible] = useState(false);

  // Initialize form with user data when available
  useEffect(() => {
    console.log("Initial data received:", initialData);
    if (initialData) {
      setProfile(prevProfile => ({
        ...prevProfile,
        firstName: initialData.firstName || "",
        lastName: initialData.lastName || "",
        email: initialData.email || "",
      }));
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Basic validation
    if (!profile.firstName.trim()) newErrors.firstName = "First name is required";
    if (!profile.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!profile.email.trim()) newErrors.email = "Email is required";
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (profile.email && !emailRegex.test(profile.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Password validation (only if user is trying to change password)
    if (isPasswordChangeVisible) {
      if (!profile.currentPassword) newErrors.currentPassword = "Current password is required";
      if (!profile.newPassword) newErrors.newPassword = "New password is required";
      if (profile.newPassword && profile.newPassword.length < 6) {
        newErrors.newPassword = "Password must be at least 6 characters";
      }
      if (!profile.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
      if (profile.newPassword !== profile.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setMessage({ type: "", text: "" });
    
    try {
      // Prepare data for submission
      const submissionData = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
      };
      
      // Add password data if user is changing password
      if (isPasswordChangeVisible && profile.currentPassword && profile.newPassword) {
        submissionData.currentPassword = profile.currentPassword;
        submissionData.newPassword = profile.newPassword;
      }
      
      // Check if onSubmit is a function before calling it
      if (typeof onSubmit === 'function') {
        console.log("Calling onSubmit with data:", submissionData);
        const result = await onSubmit(submissionData);
        console.log("onSubmit result:", result);
        
        if (result && result.success) {
          setMessage({ 
            type: "success", 
            text: "Profile updated successfully!" 
          });
          
          // Clear password fields after successful update
          if (isPasswordChangeVisible) {
            setProfile(prev => ({
              ...prev,
              currentPassword: "",
              newPassword: "",
              confirmPassword: ""
            }));
            setIsPasswordChangeVisible(false);
          }
        } else {
          setMessage({ 
            type: "error", 
            text: result?.error || "Failed to update profile. Please try again." 
          });
        }
      } else {
        console.error("onSubmit is not a function:", onSubmit);
        setMessage({ 
          type: "error", 
          text: "System error: Form submission handler is not properly configured." 
        });
      }
    } catch (error) {
      console.error("Error in form submission:", error);
      setMessage({ 
        type: "error", 
        text: "An unexpected error occurred. Please try again." 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-profile-container">
      <h2>Admin Profile</h2>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="admin-profile-form">
        <div className="form-section">
          <h3>Personal Information</h3>
          
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={profile.firstName}
              onChange={handleChange}
              className={errors.firstName ? "error" : ""}
            />
            {errors.firstName && <span className="error-text">{errors.firstName}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={profile.lastName}
              onChange={handleChange}
              className={errors.lastName ? "error" : ""}
            />
            {errors.lastName && <span className="error-text">{errors.lastName}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={profile.email}
              onChange={handleChange}
              className={errors.email ? "error" : ""}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}
          </div>
        </div>
        
        <div className="form-section">
          <div className="password-section-header">
            <h3>Password</h3>
            <button 
              type="button" 
              className="toggle-password-btn"
              onClick={() => setIsPasswordChangeVisible(!isPasswordChangeVisible)}
            >
              {isPasswordChangeVisible ? "Cancel" : "Change Password"}
            </button>
          </div>
          
          {isPasswordChangeVisible && (
            <div className="password-change-fields">
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={profile.currentPassword}
                  onChange={handleChange}
                  className={errors.currentPassword ? "error" : ""}
                />
                {errors.currentPassword && <span className="error-text">{errors.currentPassword}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={profile.newPassword}
                  onChange={handleChange}
                  className={errors.newPassword ? "error" : ""}
                />
                {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={profile.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? "error" : ""}
                />
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>
            </div>
          )}
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="save-btn" 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminProfileForm;
