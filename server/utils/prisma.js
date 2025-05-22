import { PrismaClient } from "@prisma/client";

// Create a single instance of Prisma Client
const prisma = new PrismaClient();

// Add middleware to enforce that only STUDENT users can have profiles
prisma.$use(async (params, next) => {
  // Check if we're creating or updating a profile
  if (
    params.model === "Profile" &&
    (params.action === "create" || params.action === "update")
  ) {
    // Get the user ID from the data
    const userId =
      params.args.data.userId ||
      (params.args.where && params.args.where.userId) ||
      (params.args.where &&
        params.args.where.id &&
        params.action === "update" &&
        (
          await prisma.profile.findUnique({
            where: { id: params.args.where.id },
          })
        )?.userId);

    if (userId) {
      // Check if the user has the STUDENT role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (!user || user.role !== "STUDENT") {
        throw new Error("Only STUDENT users can have profiles");
      }
    }
  }

  return next(params);
});

export default prisma;
