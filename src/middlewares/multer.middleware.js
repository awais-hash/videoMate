import multer from "multer";
import path from "path";

// 1. Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (req, file, cb) {
    // Unique naming to prevent file overwrites
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  }
});

// 2. File Filter (Allow only specific Images and Videos)
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  const allowedVideoTypes = ["video/mp4", "video/mkv", "video/quicktime"]; // mp4, mkv, mov
  
  if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true); 
  } else {
    // Reject files that are not images or videos
    cb(new Error("Only Image or Video files are allowed!"), false);
  }
};

// 3. Final Upload Middleware
export const upload = multer({ 
  storage, 
  fileFilter, 
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB limit
  }
});