import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

// It's generally best to have a single dotenv.config() call
// at the very beginning of your main application file (e.g., server/index.js)
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
