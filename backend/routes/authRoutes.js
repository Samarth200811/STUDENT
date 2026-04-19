const express = require('express');
const router = express.Router();
const { registerAdmin, registerStudent, login, logout } = require('../controllers/authController');

router.post('/register/admin', registerAdmin);
router.post('/register/student', registerStudent);
router.post('/login', login);
router.post('/logout', logout);

module.exports = router;
