import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import AdminProfileForm from "../admin-profile/adminprofile";
import StudentProfileForm from "../student-profile/studentprofile";
import { useUpdateProfile } from "../../hooks/useUsers";
import { userService } from "../../services/userService";
import "./Profile.css";

const Profile = () => {
  const { user: authUser, setUser: setAuthUser } = useAuth();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const updateProfileMutation = useUpdateProfile();

  // Fetch user data using getCurrentUser instead of getUserById
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        // Use the current user from auth context directly if available
        if (authUser) {
          console.log("Using auth user directly:", authUser);

          // If we need more detailed profile data, fetch it from the API
          try {
            const userData = await userService.getCurrentUser();
            console.log("User data from API:", userData);
            setUser(userData);
          } catch (fetchError) {
            console.warn(
              "Could not fetch detailed profile, using auth user:",
              fetchError
            );
            setUser(authUser);
          }
        } else {
          // Fallback to API call if needed
          console.log("Fetching current user from API");
          const userData = await userService.getCurrentUser();
          console.log("User data from API:", userData);
          setUser(userData);
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [authUser]);

  // For debugging
  useEffect(() => {
    console.log("Current user state:", user);
  }, [user]);

  if (isLoading) {
    return <div className="loading-container">Loading profile...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Profile</h2>
        <p>
          {error.message || "An error occurred while loading your profile."}
        </p>
        <button
          className="retry-button"
          onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="not-found-container">
        <h2>Profile Not Found</h2>
        <p>Unable to load your profile information.</p>
        <button
          className="retry-button"
          onClick={() => window.location.reload()}>
          Retry
        </button>
      </div>
    );
  }

  // Handle profile update
  const handleUpdateProfile = async (profileData) => {
    console.log("handleUpdateProfile called with:", profileData);

    // Log if password data is included
    if (profileData.currentPassword && profileData.newPassword) {
      console.log("Password update requested");
    }

    try {
      if (
        !updateProfileMutation ||
        typeof updateProfileMutation.mutateAsync !== "function"
      ) {
        console.error(
          "updateProfileMutation is not properly initialized:",
          updateProfileMutation
        );
        return {
          success: false,
          error: "Update function is not available. Please try again later.",
        };
      }

      console.log("Updating profile with data:", profileData);

      // Use the updateProfile method instead of updateUser
      const result = await updateProfileMutation.mutateAsync(profileData);

      console.log("Update result:", result);

      // Update the local user state with the new data
      setUser((prevUser) => {
        // Handle the nested profile structure
        const updatedUser = { ...prevUser };

        // Update basic user fields
        if (profileData.firstName)
          updatedUser.firstName = profileData.firstName;
        if (profileData.lastName) updatedUser.lastName = profileData.lastName;
        if (profileData.email) updatedUser.email = profileData.email;

        // Update profile fields - they can be either directly in the user object or in the profile property
        if (profileData.rollNumber !== undefined) {
          updatedUser.rollNumber = profileData.rollNumber;
          if (updatedUser.profile)
            updatedUser.profile.rollNumber = profileData.rollNumber;
        }

        if (profileData.class !== undefined) {
          updatedUser.class = profileData.class;
          if (updatedUser.profile)
            updatedUser.profile.class = profileData.class;
        }

        if (profileData.batch !== undefined) {
          updatedUser.batch = profileData.batch;
          if (updatedUser.profile)
            updatedUser.profile.batch = profileData.batch;
        }

        if (profileData.mentor !== undefined) {
          updatedUser.mentor = profileData.mentor;
          if (updatedUser.profile)
            updatedUser.profile.mentor = profileData.mentor;
        }

        return updatedUser;
      });

      // Also update the auth context to keep everything in sync
      if (result && result.user && setAuthUser) {
        setAuthUser(result.user);
      }

      // Also update the auth user in localStorage to keep everything in sync
      if (result && result.user) {
        const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
        const updatedUser = {
          ...currentUser,
          ...result.user,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating profile:", error);
      console.error("Error response:", error.response?.data);
      return {
        success: false,
        error:
          error.response?.data?.message ||
          "Failed to update profile. Please try again.",
      };
    }
  };

  // Verify that handleUpdateProfile is a function before passing it
  console.log(
    "handleUpdateProfile is a function:",
    typeof handleUpdateProfile === "function"
  );

  // Render the appropriate profile form based on user role
  return (
    <div className="profile-page">
      {user?.role === "ADMIN" ? (
        <AdminProfileForm
          initialData={user}
          onSubmit={handleUpdateProfile}
        />
      ) : (
        <StudentProfileForm
          initialData={user}
          onSubmit={handleUpdateProfile}
        />
      )}
    </div>
  );
};

export default Profile;
