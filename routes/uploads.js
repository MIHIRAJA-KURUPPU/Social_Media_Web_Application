const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { verifyToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

// Storage config: store in /api/public/uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif/;
  const ext = allowed.test(path.extname(file.originalname).toLowerCase());
  const mime = allowed.test(file.mimetype);
  if (ext && mime) cb(null, true); else cb(new Error('Only images are allowed'));
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

// Ensure upload folder exists at runtime; app should create it in deployment scripts

// Endpoint: POST /api/uploads/image
router.post('/image',
  verifyToken,
  upload.single('image'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const publicPath = `/public/uploads/${req.file.filename}`;
    logger.logInfo('Image uploaded', { userId: req.user.id, file: req.file.filename });

    res.status(200).json({ success: true, url: publicPath });
  })
);

module.exports = router;
