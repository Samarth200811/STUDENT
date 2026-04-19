const express = require('express');
const router = express.Router();
const { createAnnouncement, getAllAnnouncements, deleteAnnouncement } = require('../controllers/announcementController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/', getAllAnnouncements);
router.post('/', verifyToken, requireAdmin, createAnnouncement);
router.delete('/:id', verifyToken, requireAdmin, deleteAnnouncement);

module.exports = router;
