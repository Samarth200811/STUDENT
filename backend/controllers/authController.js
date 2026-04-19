const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');

// ─── ADMIN REGISTER ───────────────────────────────────────────────────────────
exports.registerAdmin = async (req, res) => {
  try {
    const secretKey = req.headers['x-admin-secret'];
    if (!secretKey || secretKey !== process.env.ADMIN_SECRET_KEY)
      return res.status(403).json({ success: false, message: 'Invalid admin secret key' });

    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email, password,
      email_confirm: true,
      user_metadata: { name, role: 'admin' }
    });
    if (authError) return res.status(400).json({ success: false, message: authError.message });

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      role: 'admin',
      name,
    });
    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ success: false, message: profileError.message });
    }

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      user: { id: authData.user.id, email, name, role: 'admin' }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── STUDENT REGISTER ─────────────────────────────────────────────────────────
exports.registerStudent = async (req, res) => {
  try {
    const { name, email, password, rollNumber, course, phone } = req.body;
    if (!name || !email || !password || !rollNumber)
      return res.status(400).json({ success: false, message: 'Name, email, password and roll number are required' });

    const { data: existing } = await supabase
      .from('profiles').select('id').eq('roll_number', rollNumber).single();
    if (existing)
      return res.status(400).json({ success: false, message: 'Roll number already registered' });

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email, password,
      email_confirm: true,
      user_metadata: { name, role: 'student', rollNumber }
    });
    if (authError) return res.status(400).json({ success: false, message: authError.message });

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      role: 'student',
      name,
      roll_number: rollNumber,
      course: course || '',
      phone: phone || '',
    });
    if (profileError) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ success: false, message: profileError.message });
    }

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      user: { id: authData.user.id, email, name, role: 'student', rollNumber }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── LOGIN (Admin + Student) ───────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password are required' });

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError)
      return res.status(401).json({ success: false, message: 'Invalid email or password' });

    const { data: profile, error: profileError } = await supabase
      .from('profiles').select('*').eq('id', authData.user.id).single();
    if (profileError || !profile)
      return res.status(404).json({ success: false, message: 'Profile not found' });

    const token = jwt.sign(
      { role: profile.role, id: profile.id, name: profile.name, email: authData.user.email, rollNumber: profile.roll_number || null },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    const redirectTo = profile.role === 'admin' ? 'dashboard.html' : 'student-portal.html';

    res.json({
      success: true,
      token,
      role: profile.role,
      redirectTo,
      user: {
        id: profile.id,
        name: profile.name,
        email: authData.user.email,
        role: profile.role,
        rollNumber: profile.roll_number || null,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── LOGOUT ───────────────────────────────────────────────────────────────────
exports.logout = async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
};
