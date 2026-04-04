const fs = require('fs');
const multer = require('multer');
const path = require('path');

const uploadsDir = path.join(__dirname, '../../uploads');
const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpg', 'image/jpeg'];
const allowedExtensions = ['.pdf', '.png', '.jpg', '.jpeg'];

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const safeExtension = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${safeExtension}`);
  }
});

const fileFilter = (req, file, cb) => {
  const extension = path.extname(file.originalname).toLowerCase();
  const isMimeTypeAllowed = allowedMimeTypes.includes(file.mimetype);
  const isExtensionAllowed = allowedExtensions.includes(extension);

  if (isMimeTypeAllowed && isExtensionAllowed) {
    return cb(null, true);
  }

  return cb(new Error('Unsupported file type. Only PDF, PNG, JPG, and JPEG files are allowed.'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const uploadSingleReport = upload.single('report');

const handleReportUpload = (req, res, next) => {
  uploadSingleReport(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the 5MB limit'
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message || 'File upload failed'
    });
  });
};

module.exports = {
  uploadsDir,
  handleReportUpload
};
