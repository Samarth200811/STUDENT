const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

function calculateGrade(marks) {
  if (marks >= 80) return 'A';
  if (marks >= 60) return 'B';
  return 'C';
}

function mapStudent(s) {
  return {
    _id: s.id,
    name: s.name,
    rollNumber: s.roll_number,
    email: s.email,
    course: s.course,
    phone: s.phone,
    marks: s.marks,
    attendance: s.attendance,
    grade: s.grade,
    createdAt: s.created_at,
    attendanceRecords: (s.attendance_records || []).map(r => ({
      date: r.date, status: r.status, subject: r.subject
    })),
    marksRecords: (s.marks_records || []).map(r => ({
      subject: r.subject, examType: r.exam_type,
      score: r.score, maxScore: r.max_score, date: r.date
    })),
  };
}

exports.createStudent = async (req, res) => {
  try {
    const { name, rollNumber, email, password, course, phone, address, marks, attendance } = req.body;

    // Create Supabase Auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email, password: password || 'student123',
      email_confirm: true,
      user_metadata: { name, role: 'student', rollNumber }
    });
    if (authError) return res.status(400).json({ success: false, message: authError.message });

    const { data, error } = await supabase.from('profiles').insert({
      id: authData.user.id,
      role: 'student',
      name, roll_number: rollNumber,
      course: course || '', phone: phone || '',
      marks: marks || 0, attendance: attendance || 0,
      grade: calculateGrade(marks || 0),
    }).select().single();

    if (error) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      if (error.code === '23505') return res.status(400).json({ success: false, message: 'Roll number or email already exists' });
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(201).json({ success: true, data: mapStudent({ ...data, email }) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getAllStudents = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, attendance_records(*), marks_records(*)')
      .eq('role', 'student')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, count: data.length, data: data.map(mapStudent) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStudentById = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, attendance_records(*), marks_records(*)')
      .eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, data: mapStudent(data) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { name, rollNumber, email, course, phone, marks, attendance } = req.body;
    const updateData = {
      name, roll_number: rollNumber, course, phone,
      marks, attendance, grade: calculateGrade(marks || 0)
    };
    const { data, error } = await supabase.from('profiles')
      .update(updateData).eq('id', req.params.id).select().single();
    if (error) return res.status(400).json({ success: false, message: error.message });
    res.json({ success: true, data: mapStudent(data) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    // Delete from Supabase Auth (cascades to profiles)
    const { error: authError } = await supabase.auth.admin.deleteUser(req.params.id);
    if (authError) return res.status(500).json({ success: false, message: authError.message });
    res.json({ success: true, message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.searchStudents = async (req, res) => {
  try {
    const { q, rollNumber } = req.query;
    let query = supabase.from('profiles')
      .select('*, attendance_records(*), marks_records(*)')
      .eq('role', 'student');
    if (q) query = query.ilike('name', `%${q}%`);
    if (rollNumber) query = query.ilike('roll_number', `%${rollNumber}%`);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, count: data.length, data: data.map(mapStudent) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.filterStudents = async (req, res) => {
  try {
    const { type } = req.query;
    let query = supabase.from('profiles')
      .select('*, attendance_records(*), marks_records(*)')
      .eq('role', 'student');
    if (type === 'high_marks') query = query.gt('marks', 80);
    else if (type === 'low_attendance') query = query.lt('attendance', 75);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) return res.status(500).json({ success: false, message: error.message });
    res.json({ success: true, count: data.length, data: data.map(mapStudent) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const { count: total } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
    const { count: lowAttendance } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').lt('attendance', 75);
    const { count: gradeA } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('grade', 'A');
    const { count: gradeB } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('grade', 'B');
    const { count: gradeC } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student').eq('grade', 'C');
    const { data: agg } = await supabase.from('profiles').select('marks, attendance').eq('role', 'student');
    const avgMarks = agg?.length ? Math.round(agg.reduce((s, r) => s + r.marks, 0) / agg.length * 10) / 10 : 0;
    const avgAttendance = agg?.length ? Math.round(agg.reduce((s, r) => s + r.attendance, 0) / agg.length * 10) / 10 : 0;
    res.json({ success: true, data: { total, lowAttendance, avgMarks, avgAttendance, gradeA, gradeB, gradeC } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addAttendance = async (req, res) => {
  try {
    const { date, status, subject } = req.body;
    await supabase.from('attendance_records').upsert(
      { student_id: req.params.id, date, status, subject: subject || '' },
      { onConflict: 'student_id,date,subject' }
    );
    const { data: records } = await supabase.from('attendance_records').select('status').eq('student_id', req.params.id);
    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    await supabase.from('profiles').update({ attendance: total > 0 ? Math.round((present / total) * 100) : 0 }).eq('id', req.params.id);
    return exports.getStudentById({ params: { id: req.params.id } }, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addMarks = async (req, res) => {
  try {
    const { subject, examType, score, maxScore, date } = req.body;
    await supabase.from('marks_records').upsert(
      { student_id: req.params.id, subject, exam_type: examType || 'Mid Term', score, max_score: maxScore || 100, date: date || '' },
      { onConflict: 'student_id,subject,exam_type' }
    );
    const { data: records } = await supabase.from('marks_records').select('score, max_score').eq('student_id', req.params.id);
    const avg = records.length ? Math.round(records.reduce((s, r) => s + (r.score / r.max_score) * 100, 0) / records.length) : 0;
    await supabase.from('profiles').update({ marks: avg, grade: calculateGrade(avg) }).eq('id', req.params.id);
    return exports.getStudentById({ params: { id: req.params.id } }, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.bulkAttendance = async (req, res) => {
  try {
    const { records, date, subject } = req.body;
    for (const rec of records) {
      await supabase.from('attendance_records').upsert(
        { student_id: rec.studentId, date, status: rec.status, subject: subject || '' },
        { onConflict: 'student_id,date,subject' }
      );
      const { data: allRecs } = await supabase.from('attendance_records').select('status').eq('student_id', rec.studentId);
      const total = allRecs.length;
      const present = allRecs.filter(r => r.status === 'present').length;
      await supabase.from('profiles').update({ attendance: total > 0 ? Math.round((present / total) * 100) : 0 }).eq('id', rec.studentId);
    }
    res.json({ success: true, updated: records.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
