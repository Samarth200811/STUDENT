const express = require('express');
const router = express.Router();
const {
  createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent,
  searchStudents, filterStudents, getStats, addAttendance, addMarks, bulkAttendance
} = require('../controllers/studentController');
const { verifyToken, requireAdmin } = require('../middleware/auth');

router.get('/search', verifyToken, searchStudents);
router.get('/filter', verifyToken, filterStudents);
router.get('/stats', verifyToken, getStats);
router.post('/bulk-attendance', verifyToken, requireAdmin, bulkAttendance);

router.post('/', verifyToken, requireAdmin, createStudent);
router.get('/', verifyToken, getAllStudents);
router.get('/:id', verifyToken, getStudentById);
router.put('/:id', verifyToken, requireAdmin, updateStudent);
router.delete('/:id', verifyToken, requireAdmin, deleteStudent);

router.post('/:id/attendance', verifyToken, requireAdmin, addAttendance);
router.post('/:id/marks', verifyToken, requireAdmin, addMarks);

module.exports = router;
