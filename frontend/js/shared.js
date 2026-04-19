// ===== CONFIG =====
const API = {
  students: '/api/students',
  announcements: '/api/announcements',
  auth: '/api/auth/login',
  registerStudent: '/api/auth/register/student',
  registerAdmin: '/api/auth/register/admin',
  logout: '/api/auth/logout',
};

// ===== AUTH =====
function getSession() {
  try { return JSON.parse(localStorage.getItem('sms_session') || 'null'); } catch { return null; }
}
function setSession(data) { localStorage.setItem('sms_session', JSON.stringify(data)); }
function clearSession() { localStorage.removeItem('sms_session'); }

function authGuard(requiredRole) {
  const session = getSession();
  if (!session) { window.location.href = 'login.html'; return null; }
  if (requiredRole && session.role !== requiredRole) {
    window.location.href = session.role === 'admin' ? 'dashboard.html' : 'student-portal.html';
    return null;
  }
  return session;
}

function logout() {
  fetch(API.logout, { method: 'POST' }).finally(() => {
    clearSession();
    window.location.href = 'login.html';
  });
}

// ===== SIDEBAR =====
function renderSidebar(activePageId) {
  const session = getSession();
  if (!session) return;

  const isAdmin = session.role === 'admin';
  const initials = (session.user.name || 'AD').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const adminNav = [
    { id: 'dashboard', icon: '◈', label: 'Dashboard', href: 'dashboard.html' },
    { id: 'students', icon: '◉', label: 'Students', href: 'students.html' },
    { id: 'attendance', icon: '◷', label: 'Attendance', href: 'attendance.html' },
    { id: 'marks', icon: '◎', label: 'Marks', href: 'marks.html' },
    { id: 'announcements', icon: '◈', label: 'Announcements', href: 'announcements.html' },
  ];

  const studentNav = [
    { id: 'student-portal', icon: '◈', label: 'My Dashboard', href: 'student-portal.html' },
    { id: 'my-attendance', icon: '◷', label: 'My Attendance', href: 'my-attendance.html' },
    { id: 'my-marks', icon: '◎', label: 'My Marks', href: 'my-marks.html' },
    { id: 'my-announcements', icon: '◈', label: 'Notices', href: 'my-announcements.html' },
  ];

  const navItems = isAdmin ? adminNav : studentNav;

  document.getElementById('sidebar-root').innerHTML = `
    <div class="sb-logo">
      <div class="sb-mark">🎓</div>
      <div>
        <div class="sb-brand">EduTrack</div>
        <div class="sb-ver">${isAdmin ? 'admin panel' : 'student portal'}</div>
      </div>
    </div>
    <nav class="sb-nav">
      <div class="sb-section">${isAdmin ? 'Management' : 'My Academics'}</div>
      ${navItems.map(item => `
        <a class="nav-link ${activePageId === item.id ? 'active' : ''}" href="${item.href}">
          <span class="ni">${item.icon}</span>
          ${item.label}
        </a>
      `).join('')}
    </nav>
    <div class="sb-footer">
      <div class="user-row" onclick="logout()">
        <div class="avatar">${initials}</div>
        <div>
          <div class="u-name">${session.user.name}</div>
          <div class="u-role">${session.role} · logout</div>
        </div>
      </div>
    </div>
  `;
}

// ===== TOAST =====
function toast(msg, type = 'info') {
  let c = document.getElementById('toast-root');
  if (!c) { c = document.createElement('div'); c.id = 'toast-root'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  const icons = { success: '✓', error: '✕', info: 'i', warn: '!' };
  t.innerHTML = `<span class="t-icon">${icons[type] || 'i'}</span><span>${msg}</span>`;
  c.appendChild(t);
  requestAnimationFrame(() => t.classList.add('in'));
  setTimeout(() => { t.classList.remove('in'); setTimeout(() => t.remove(), 400); }, 3000);
}

// ===== CONFIRM DIALOG =====
function confirmDlg(msg, onOk) {
  const el = document.createElement('div');
  el.className = 'dlg-overlay';
  el.innerHTML = `
    <div class="dlg-box">
      <div class="dlg-icon">⚠</div>
      <div class="dlg-title">Confirm Delete</div>
      <div class="dlg-msg">${msg}</div>
      <div class="dlg-btns">
        <button class="btn btn-ghost" id="dlg-cancel">Cancel</button>
        <button class="btn btn-danger" id="dlg-ok">Delete</button>
      </div>
    </div>`;
  document.body.appendChild(el);
  el.querySelector('#dlg-cancel').onclick = () => el.remove();
  el.querySelector('#dlg-ok').onclick = () => { el.remove(); onOk(); };
  el.onclick = e => { if (e.target === el) el.remove(); };
}

// ===== MODAL =====
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }
function modalClose(el) { el.closest('.modal-overlay')?.classList.remove('open'); }

// ===== GRADE BADGE =====
function gradeBadge(g) {
  const map = { A: 'badge-a', B: 'badge-b', C: 'badge-c' };
  return `<span class="badge ${map[g] || 'badge-c'}">${g}</span>`;
}

// ===== ATT CELL =====
function attCell(pct) {
  const low = pct < 75;
  return `<div class="att-wrap">
    <div class="att-bar"><div class="att-fill ${low ? 'low' : ''}" style="width:${Math.min(pct,100)}%"></div></div>
    <span class="att-num ${low ? 'low' : ''}">${pct}%</span>
  </div>`;
}

// ===== API HELPERS — automatically send JWT token =====
function getToken() {
  const session = getSession();
  return session?.token || null;
}

async function req(method, url, body) {
  const token = getToken();
  const opts = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (res.status === 401) { clearSession(); window.location.href = 'login.html'; return {}; }
  return res.json();
}
const GET = url => req('GET', url);
const POST = (url, b) => req('POST', url, b);
const PUT = (url, b) => req('PUT', url, b);
const DELETE = url => req('DELETE', url);

// ===== EMPTY STATE =====
function emptyState(msg = 'No records found') {
  return `<tr><td colspan="20" class="empty-cell">
    <div class="empty-box">
      <div class="empty-icon">◌</div>
      <div>${msg}</div>
    </div>
  </td></tr>`;
}
