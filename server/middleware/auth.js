import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import process from "process";

const prisma = new PrismaClient();

// Authenticate user middleware
export const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user by id
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // If user is a student, get profile data
    let userData = { ...user };

    if (user.role === "STUDENT") {
      const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
      });

      if (profile) {
        userData.rollNumber = profile.rollNumber || "";
        userData.class = profile.class || "";
        userData.batch = profile.batch || "";
        userData.mentor = profile.mentor || "";
      }
    }

    // Set user in request
    req.user = userData;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error.message);
    return res.status(401).json({ message: "Token is not valid" });
  }
};

// Authorize admin middleware
export const authorizeAdmin = (req, res, next) => {
  if (req.user && req.user.role === "ADMIN") {
    next();
  } else {
    return res
      .status(403)
      .json({ message: "Access denied. Admin role required." });
  }
};
