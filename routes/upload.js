const router = require('express').Router();
const upload = require('../utils/upload');
const { verifyToken } = require('../middleware/auth');
const fs = require('fs');
const path = require('path');

// Upload profile picture
router.post('/profile', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileUrl = `/uploads/profiles/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        filename: req.file.filename,
        url: fileUrl,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
});

// Upload post image
router.post('/post', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const fileUrl = `/uploads/posts/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Post image uploaded successfully',
      data: {
        filename: req.file.filename,
        url: fileUrl,
        size: req.file.size
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error uploading file',
      error: error.message
    });
  }
});

// Delete uploaded file
router.delete('/:filename', verifyToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const profilePath = path.join(__dirname, '../uploads/profiles', filename);
    const postPath = path.join(__dirname, '../uploads/posts', filename);

    let deleted = false;

    // Try to delete from profiles directory
    if (fs.existsSync(profilePath)) {
      fs.unlinkSync(profilePath);
      deleted = true;
    }

    // Try to delete from posts directory
    if (fs.existsSync(postPath)) {
      fs.unlinkSync(postPath);
      deleted = true;
    }

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting file',
      error: error.message
    });
  }
});

module.exports = router;
