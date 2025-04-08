import multer from "multer";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";

export function setupUpload() {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure multer storage
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      // Generate unique filename
      const uniqueId = uuidv4();
      const extension = path.extname(file.originalname).toLowerCase();
      const safeName = path.basename(file.originalname, extension)
        .replace(/[^a-z0-9]/gi, '_')
        .toLowerCase();
      
      cb(null, `${safeName}-${uniqueId}${extension}`);
    }
  });

  // File filter to only allow mp3 files
  const fileFilter = (req, file, cb) => {
    // Accept mp3 and other common audio formats
    const allowedTypes = ['.mp3', '.wav', '.ogg', '.aac', '.flac'];
    const extension = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(extension)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed!'), false);
    }
  };

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: 50 * 1024 * 1024  // 50MB max file size
    }
  });
}
