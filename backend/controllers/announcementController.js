const supabase = require('../config/supabase');

exports.getAllAnnouncements = async (req, res) => {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, data });
};

exports.createAnnouncement = async (req, res) => {
  const { title, content, priority } = req.body;
  const { data, error } = await supabase
    .from('announcements')
    .insert({ title, content, priority: priority || 'general' })
    .select()
    .single();
  if (error) return res.status(400).json({ success: false, message: error.message });
  res.status(201).json({ success: true, data });
};

exports.deleteAnnouncement = async (req, res) => {
  const { error } = await supabase.from('announcements').delete().eq('id', req.params.id);
  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, message: 'Deleted successfully' });
};
