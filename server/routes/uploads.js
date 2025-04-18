import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

const MAX_IMAGES = 6;
const UPLOAD_DIR = 'public/uploads/posts';

// Ensure the upload directory exists
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR); // Save files to public/uploads/posts
  },
  filename: function (req, file, cb) {
    // Important: Assumes userId is sent in the request body *with* the files
    const userId = req.body.userId || 'unknown_user';
    const timestamp = Date.now();
    // Find the index of this file in the uploaded batch (req.files is populated by multer)
    // This relies on the array middleware and might not be perfectly stable if only one file is sent?
    // A simpler approach is just userId-timestamp-originalname, but let's try user's request
    // Note: req.files might not be fully populated *during* filename callback. 
    // Let's use a simpler, robust name: userId-timestamp-originalFilename
    // const uniqueSuffix = timestamp + '-' + Math.round(Math.random() * 1E9); // Alternative random suffix
    const uniqueFilename = `${userId}-${timestamp}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// File filter (optional: restrict file types)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Not an image! Please upload only images.'), false);
  }
};

const upload = multer({ 
  storage: storage, 
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 5 } // Optional: Limit file size (e.g., 5MB)
});

// Route to handle multiple image uploads
router.post('/posts', upload.array('postImages', MAX_IMAGES), (req, res) => {
  // 'postImages' is the field name expected from the FormData

  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No images were uploaded.' });
  }

  // Map uploaded files to their relative URL paths
  const imageUrls = req.files.map(file => {
    // Construct the URL path relative to the server root
    // IMPORTANT: Use forward slashes for URLs, even on Windows
    const relativePath = path.join('/uploads/posts', file.filename).replace(/\\/g, '/');
    return relativePath;
  });

  res.status(200).json({ 
    success: true, 
    message: `${req.files.length} images uploaded successfully.`, 
    imageUrls: imageUrls // Send back the array of URL paths
  });
});

// Handle Multer errors (like file size limit)
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading.
    return res.status(400).json({ error: `Multer error: ${err.message}` });
  } else if (err) {
    // An unknown error occurred when uploading.
    return res.status(500).json({ error: `Upload error: ${err.message}` });
  }
  next();
});

export default router; 