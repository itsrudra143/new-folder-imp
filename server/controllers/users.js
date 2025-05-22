import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Get current user with profile data
export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user with profile if STUDENT
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: req.user.role === "STUDENT",
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prepare user data based on role
    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };

    // Add profile fields for students
    if (user.role === "STUDENT" && user.profile) {
      userData.rollNumber = user.profile.rollNumber || "";
      userData.class = user.profile.class || "";
      userData.batch = user.profile.batch || "";
      userData.mentor = user.profile.mentor || "";
    }

    res.json(userData);
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Server error while fetching user data" });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user with profile if STUDENT
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: req.user.role === "STUDENT",
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // For students, include profile fields directly in the response
    if (user.role === "STUDENT" && user.profile) {
      const responseData = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        rollNumber: user.profile.rollNumber || "",
        class: user.profile.class || "",
        batch: user.profile.batch || "",
        mentor: user.profile.mentor || "",
        profile: user.profile, // Keep the original profile object for backward compatibility
      };
      return res.json(responseData);
    }

    // For other roles, return the user without profile
    res.json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error while fetching profile" });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      firstName,
      lastName,
      rollNumber,
      class: className,
      batch,
      mentor,
      currentPassword,
      newPassword,
    } = req.body;

    console.log("Update profile request received:", {
      userId,
      firstName,
      lastName,
      rollNumber,
      className,
      batch,
      mentor,
      passwordUpdateRequested: !!(currentPassword && newPassword),
    });

    // Get user with role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If password change is requested, handle it first
    if (currentPassword && newPassword) {
      try {
        console.log("Password update requested");

        // Get user with password
        const userWithPassword = await prisma.user.findUnique({
          where: { id: userId },
          select: { password: true },
        });

        if (!userWithPassword) {
          console.log("User not found for password update");
          return res.status(404).json({ message: "User not found" });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(
          currentPassword,
          userWithPassword.password
        );
        console.log("Current password validation:", isPasswordValid);

        if (!isPasswordValid) {
          return res
            .status(400)
            .json({ message: "Current password is incorrect" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await prisma.user.update({
          where: { id: userId },
          data: { password: hashedPassword },
        });

        console.log("Password updated successfully");
      } catch (error) {
        console.error("Password update error:", error);
        return res.status(500).json({ message: "Failed to update password" });
      }
    }

    // Update user and profile in a transaction
    const updatedUser = await prisma.$transaction(async (prisma) => {
      // Update user
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName,
          lastName,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      });

      // Only update profile if user is a STUDENT
      let profile = null;
      if (user.role === "STUDENT") {
        // Check if profile exists
        const existingProfile = await prisma.profile.findUnique({
          where: { userId },
        });

        // Update or create profile
        profile = existingProfile
          ? await prisma.profile.update({
              where: { userId },
              data: {
                rollNumber,
                class: className,
                batch,
                mentor,
              },
            })
          : await prisma.profile.create({
              data: {
                userId,
                rollNumber,
                class: className,
                batch,
                mentor,
              },
            });
      }

      return { ...user, profile };
    });

    console.log("Profile updated successfully:", updatedUser);

    // Prepare response data
    let responseData = {
      message: "Profile updated successfully",
      user: updatedUser,
    };

    // For students, include profile fields directly in the user object
    if (updatedUser.role === "STUDENT" && updatedUser.profile) {
      responseData.user = {
        ...updatedUser,
        rollNumber: updatedUser.profile.rollNumber || "",
        class: updatedUser.profile.class || "",
        batch: updatedUser.profile.batch || "",
        mentor: updatedUser.profile.mentor || "",
      };
    }

    res.json(responseData);
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error while updating profile" });
  }
};
