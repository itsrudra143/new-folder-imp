import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Register a new user
export const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      rollNumber,
      class: className,
      batch,
      mentor,
    } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Determine the role
    const userRole = role || "STUDENT";

    // Create profile data if student
    const profileData =
      userRole === "STUDENT"
        ? {
            rollNumber: rollNumber || "",
            class: className || "",
            batch: batch || "",
            mentor: mentor || "",
          }
        : undefined;

    // Create user with profile only if STUDENT
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: userRole,
        ...(userRole === "STUDENT" && {
          profile: {
            create: profileData,
          },
        }),
      },
      include: {
        profile: userRole === "STUDENT",
      },
    });

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

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

    res.status(201).json({
      message: "User registered successfully",
      user: userData,
      token,
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error during registration" });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists with profile data
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

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

    res.json({
      message: "Login successful",
      user: userData,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};
