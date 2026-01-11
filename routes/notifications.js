const router = require('express').Router();
const Notification = require('../Models/Notification');
const { verifyToken } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// Get notifications for current user
router.get('/',
  verifyToken,
  asyncHandler(async (req, res) => {
    const notes = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ success: true, notifications: notes });
  })
);

// Mark notification as read
router.put('/:id/read',
  verifyToken,
  asyncHandler(async (req, res) => {
    const note = await Notification.findById(req.params.id);
    if (!note || String(note.userId) !== String(req.user.id)) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    note.read = true;
    await note.save();
    res.status(200).json({ success: true, message: 'Notification marked read' });
  })
);

module.exports = router;
