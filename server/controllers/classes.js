import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// Create a new class
export const createClass = async (req, res) => {
  try {
    const { name, description } = req.body;
    const createdById = req.user.id;

    // Generate a unique 6-character alphanumeric code
    const code = crypto.randomBytes(3).toString("hex").toUpperCase();

    // Create the class
    const newClass = await prisma.class.create({
      data: {
        name,
        description,
        code,
        createdById,
      },
    });

    res.status(201).json({
      message: "Class created successfully",
      class: newClass,
    });
  } catch (error) {
    console.error("Create class error:", error);
    res.status(500).json({ message: "Server error while creating class" });
  }
};

// Get all classes (admin sees all their classes, students see classes they're enrolled in)
export const getAllClasses = async (req, res) => {
  try {
    const { id: userId, role } = req.user;

    let classes;

    if (role === "ADMIN") {
      // Admins see classes they created
      classes = await prisma.class.findMany({
        where: {
          createdById: userId,
        },
        include: {
          _count: {
            select: {
              enrollments: {
                where: {
                  status: "APPROVED",
                },
              },
              tests: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      // Students see classes they're enrolled in
      classes = await prisma.class.findMany({
        where: {
          enrollments: {
            some: {
              userId,
              status: "APPROVED",
            },
          },
        },
        include: {
          _count: {
            select: {
              enrollments: {
                where: {
                  status: "APPROVED",
                },
              },
              tests: true,
            },
          },
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    res.json(classes);
  } catch (error) {
    console.error("Get classes error:", error);
    res.status(500).json({ message: "Server error while fetching classes" });
  }
};

// Get class by ID
export const getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    // Check if class exists
    const classData = await prisma.class.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        enrollments: {
          where: {
            status: "APPROVED",
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                profile: true,
              },
            },
          },
        },
        tests: {
          include: {
            test: true,
          },
        },
      },
    });

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Check permissions
    if (role !== "ADMIN" && classData.createdById !== userId) {
      // For students, check if they're enrolled
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_classId: {
            userId,
            classId: id,
          },
        },
      });

      if (!enrollment || enrollment.status !== "APPROVED") {
        return res.status(403).json({ message: "Access denied to this class" });
      }
    }

    res.json(classData);
  } catch (error) {
    console.error("Get class error:", error);
    res.status(500).json({ message: "Server error while fetching class" });
  }
};

// Update class
export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;
    const { id: userId, role } = req.user;

    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id },
    });

    if (!existingClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Check permissions (only admin who created the class can update it)
    if (role !== "ADMIN" || existingClass.createdById !== userId) {
      return res.status(403).json({
        message:
          "Access denied. Only the admin who created this class can update it.",
      });
    }

    // Update class
    const updatedClass = await prisma.class.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    res.json({
      message: "Class updated successfully",
      class: updatedClass,
    });
  } catch (error) {
    console.error("Update class error:", error);
    res.status(500).json({ message: "Server error while updating class" });
  }
};

// Delete class
export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id },
    });

    if (!existingClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Check permissions (only admin who created the class can delete it)
    if (role !== "ADMIN" || existingClass.createdById !== userId) {
      return res.status(403).json({
        message:
          "Access denied. Only the admin who created this class can delete it.",
      });
    }

    // Delete class (cascade will delete enrollments and test assignments)
    await prisma.class.delete({
      where: { id },
    });

    res.json({ message: "Class deleted successfully" });
  } catch (error) {
    console.error("Delete class error:", error);
    res.status(500).json({ message: "Server error while deleting class" });
  }
};

// Generate a new class code
export const regenerateClassCode = async (req, res) => {
  try {
    const { id } = req.params;
    const { id: userId, role } = req.user;

    // Check if class exists
    const existingClass = await prisma.class.findUnique({
      where: { id },
    });

    if (!existingClass) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Check permissions (only admin who created the class can regenerate code)
    if (role !== "ADMIN" || existingClass.createdById !== userId) {
      return res.status(403).json({
        message:
          "Access denied. Only the admin who created this class can regenerate the code.",
      });
    }

    // Generate a new unique 6-character alphanumeric code
    const code = crypto.randomBytes(3).toString("hex").toUpperCase();

    // Update class with new code
    const updatedClass = await prisma.class.update({
      where: { id },
      data: { code },
    });

    res.json({
      message: "Class code regenerated successfully",
      class: updatedClass,
    });
  } catch (error) {
    console.error("Regenerate class code error:", error);
    res
      .status(500)
      .json({ message: "Server error while regenerating class code" });
  }
};

// Join class (for students)
export const joinClass = async (req, res) => {
  try {
    const { code } = req.body;
    const { id: userId, role } = req.user;

    // Only students can join classes
    if (role !== "STUDENT") {
      return res
        .status(403)
        .json({ message: "Only students can join classes" });
    }

    // Find class by code
    const classData = await prisma.class.findUnique({
      where: { code },
    });

    if (!classData) {
      return res.status(404).json({ message: "Invalid class code" });
    }

    // Check if student is already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_classId: {
          userId,
          classId: classData.id,
        },
      },
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === "APPROVED") {
        return res
          .status(400)
          .json({ message: "You are already enrolled in this class" });
      } else if (existingEnrollment.status === "PENDING") {
        return res
          .status(400)
          .json({ message: "Your enrollment request is pending approval" });
      } else {
        return res
          .status(400)
          .json({ message: "Your previous enrollment request was rejected" });
      }
    }

    // Create enrollment request
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        classId: classData.id,
        status: "PENDING",
      },
    });

    res.status(201).json({
      message: "Enrollment request submitted successfully",
      enrollment,
    });
  } catch (error) {
    console.error("Join class error:", error);
    res.status(500).json({ message: "Server error while joining class" });
  }
};

// Get pending enrollment requests (for admin)
export const getPendingEnrollments = async (req, res) => {
  try {
    const { id } = req.params; // class ID
    const { id: userId, role } = req.user;

    // Only admins can view enrollment requests
    if (role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin role required." });
    }

    // Check if class exists and belongs to the admin
    const classData = await prisma.class.findUnique({
      where: {
        id,
        createdById: userId,
      },
    });

    if (!classData) {
      return res
        .status(404)
        .json({ message: "Class not found or access denied" });
    }

    // Get pending enrollment requests
    const pendingEnrollments = await prisma.enrollment.findMany({
      where: {
        classId: id,
        status: "PENDING",
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profile: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(pendingEnrollments);
  } catch (error) {
    console.error("Get pending enrollments error:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching pending enrollments" });
  }
};

// Approve or reject enrollment request
export const updateEnrollmentStatus = async (req, res) => {
  try {
    const { id } = req.params; // enrollment ID
    const { status } = req.body; // 'APPROVED' or 'REJECTED'
    const { id: userId, role } = req.user;

    // Only admins can update enrollment status
    if (role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin role required." });
    }

    // Check if enrollment exists
    const enrollment = await prisma.enrollment.findUnique({
      where: { id },
      include: {
        class: true,
      },
    });

    if (!enrollment) {
      return res.status(404).json({ message: "Enrollment request not found" });
    }

    // Check if admin owns the class
    if (enrollment.class.createdById !== userId) {
      return res.status(403).json({
        message:
          "Access denied. Only the admin who created this class can update enrollment status.",
      });
    }

    // Update enrollment status
    const updatedEnrollment = await prisma.enrollment.update({
      where: { id },
      data: { status },
    });

    res.json({
      message: `Enrollment request ${status.toLowerCase()} successfully`,
      enrollment: updatedEnrollment,
    });
  } catch (error) {
    console.error("Update enrollment status error:", error);
    res
      .status(500)
      .json({ message: "Server error while updating enrollment status" });
  }
};

// Assign test to class
export const assignTestToClass = async (req, res) => {
  try {
    const { classId, testId } = req.body;
    const { id: userId, role } = req.user;

    // Only admins can assign tests
    if (role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin role required." });
    }

    // Check if class exists and belongs to the admin
    const classData = await prisma.class.findUnique({
      where: {
        id: classId,
        createdById: userId,
      },
    });

    if (!classData) {
      return res
        .status(404)
        .json({ message: "Class not found or access denied" });
    }

    // Check if test exists and belongs to the admin
    const test = await prisma.test.findUnique({
      where: {
        id: testId,
        createdById: userId,
      },
    });

    if (!test) {
      return res
        .status(404)
        .json({ message: "Test not found or access denied" });
    }

    // Check if test is already assigned to the class
    const existingAssignment = await prisma.testClass.findUnique({
      where: {
        testId_classId: {
          testId,
          classId,
        },
      },
    });

    if (existingAssignment) {
      return res
        .status(400)
        .json({ message: "Test is already assigned to this class" });
    }

    // Create test assignment
    const testAssignment = await prisma.testClass.create({
      data: {
        testId,
        classId,
      },
    });

    res.status(201).json({
      message: "Test assigned to class successfully",
      testAssignment,
    });
  } catch (error) {
    console.error("Assign test error:", error);
    res.status(500).json({ message: "Server error while assigning test" });
  }
};

// Remove test from class
export const removeTestFromClass = async (req, res) => {
  try {
    const { id } = req.params; // TestClass ID
    const { id: userId, role } = req.user;

    // Only admins can remove tests
    if (role !== "ADMIN") {
      return res
        .status(403)
        .json({ message: "Access denied. Admin role required." });
    }

    // Check if test assignment exists
    const testAssignment = await prisma.testClass.findUnique({
      where: { id },
      include: {
        class: true,
      },
    });

    if (!testAssignment) {
      return res.status(404).json({ message: "Test assignment not found" });
    }

    // Check if admin owns the class
    if (testAssignment.class.createdById !== userId) {
      return res.status(403).json({
        message:
          "Access denied. Only the admin who created this class can remove assigned tests.",
      });
    }

    // Delete test assignment
    await prisma.testClass.delete({
      where: { id },
    });

    res.json({ message: "Test removed from class successfully" });
  } catch (error) {
    console.error("Remove test error:", error);
    res.status(500).json({ message: "Server error while removing test" });
  }
};

// Get tests for a class
export const getClassTests = async (req, res) => {
  try {
    const { id } = req.params; // class ID
    const { id: userId, role } = req.user;
    const now = new Date();

    // Check if class exists
    const classData = await prisma.class.findUnique({
      where: { id },
    });

    if (!classData) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Check permissions
    if (role === "ADMIN") {
      // Admin must own the class
      if (classData.createdById !== userId) {
        return res.status(403).json({
          message:
            "Access denied. Only the admin who created this class can view its tests.",
        });
      }
    } else {
      // Student must be enrolled in the class
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_classId: {
            userId,
            classId: id,
          },
        },
      });

      if (!enrollment || enrollment.status !== "APPROVED") {
        return res.status(403).json({
          message:
            "Access denied. You must be enrolled in this class to view its tests.",
        });
      }
    }

    // Get tests assigned to the class
    const testAssignments = await prisma.testClass.findMany({
      where: { classId: id },
      include: {
        test: {
          include: {
            _count: {
              select: { questions: true },
            },
            createdBy: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // For students, include both active tests and upcoming tests (inactive with future start time)
    const tests = testAssignments
      .filter(
        (assignment) =>
          role === "ADMIN" ||
          assignment.test.isActive ||
          (assignment.test.startTime &&
            new Date(assignment.test.startTime) > now &&
            assignment.test.status !== "EXPIRED")
      )
      .map((assignment) => ({
        ...assignment.test,
        testClassId: assignment.id, // Include the TestClass ID for reference
      }));

    res.json(tests);
  } catch (error) {
    console.error("Get class tests error:", error);
    res
      .status(500)
      .json({ message: "Server error while fetching class tests" });
  }
};

// Get all classes for a student
export const getClasses = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const now = new Date();

    // Get all classes where the user is enrolled
    const classes = await prisma.class.findMany({
      where: {
        enrollments: {
          some: {
            userId,
            status: "APPROVED",
          },
        },
      },
      include: {
        createdBy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { tests: true },
        },
        tests: {
          select: {
            testId: true,
            test: {
              select: {
                isActive: true,
                startTime: true,
                status: true,
              },
            },
          },
        },
      },
    });

    // Add count of upcoming tests to each class
    const classesWithUpcomingTests = classes.map((classItem) => {
      const upcomingTests = classItem.tests.filter(
        (test) =>
          !test.test.isActive &&
          test.test.startTime &&
          new Date(test.test.startTime) > now &&
          test.test.status !== "EXPIRED"
      ).length;

      // Remove the tests array from the response
      const { tests, ...classWithoutTests } = classItem;

      return {
        ...classWithoutTests,
        upcomingTests,
      };
    });

    res.json(classesWithUpcomingTests);
  } catch (error) {
    console.error("Get classes error:", error);
    res.status(500).json({ message: "Server error while fetching classes" });
  }
};
