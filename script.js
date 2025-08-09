/* script.js
   GitHub Pages-ready; localStorage-based student record system
   - Admin & student login
   - Admin panel: Home, Manage Students (search/pagination/avatar), Attendance, Grades, Schedule, Import/Export
   - Light/dark theme
*/

const LS = { USERS:'csr_users_v1', ATT:'csr_attendance_v1', GRADES:'csr_grades_v1', SCHED:'csr_schedule_v1', THEME:'csr_theme_v1' };
const ADMIN = { username:'admin', password:'admin123' };

/* DOM refs */
const loginView = document.getElementById('loginView');
const dashboard = document.getElementById('dashboard');
const loginRole = document.getElementById('loginRole');
const loginId = document.getElementById('loginId');
const loginPass = document.getElementById('loginPass');
const loginBtn = document.getElementById('loginBtn');
const loadDemoBtn = document.getElementById('loadDemoBtn');
const logoutBtn = document.getElementById('logoutBtn');
const themeToggle = document.getElementById('themeToggle');
const sidebarThemeBtn = document.getElementById('sidebarThemeBtn');
const navButtons = Array.from(document.querySelectorAll('.nav-item'));
const mainTitle = document.getElementById('mainTitle');
const mainSubtitle = document.getElementById('mainSubtitle');
const content = document.getElementById('content');
const globalQuickPills = document.getElementById('globalQuickPills');
const sidebarUserName = document.getElementById('sidebarUserName');
const sidebarUserMeta = document.getElementById('sidebarUserMeta');
const userAvatarSmall = document.getElementById('userAvatarSmall');

let state = { role:null, user:null };
let studentsPage = { page:1, perPage:10, filter:'' };

/* Utilities */
function read(k){ try{ return JSON.parse(localStorage.getItem(k) || 'null'); }catch(e){ return null; } }
function write(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
function fileToDataURL(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=e=>res(e.target.result); r.onerror=rej; r.readAsDataURL(file); }); }
function nowDate(){ return new Date().toISOString().slice(0,10); }
function fullName(u){ return `${u.firstName} ${u.lastName}`; }

/* Theme */
function applyTheme(t){ document.documentElement.setAttribute('data-theme', t==='dark' ? 'dark' : 'light'); localStorage.setItem(LS.THEME, t); themeToggle.textContent = t==='dark' ? '☀️' : '🌙'; }
function initTheme(){ const stored = localStorage.getItem(LS.THEME) || 'light'; applyTheme(stored); }
themeToggle?.addEventListener('click', ()=>{ const cur = document.documentElement.getAttribute('data-theme')==='dark' ? 'dark' : 'light'; applyTheme(cur==='dark' ? 'light' : 'dark'); });
sidebarThemeBtn?.addEventListener('click', ()=> themeToggle.click());

/* Demo data */
function loadDemoData(){
  const users = [
    { id:'12-1234-567', firstName:'Juan', lastName:'Dela Cruz', track:'ICT', birth:'2005-05-31', avatar:null },
    { id:'13-1111-888', firstName:'Maria', lastName:'Santos', track:'ICT', birth:'2005-08-12', avatar:null },
    { id:'14-2222-333', firstName:'Ana', lastName:'Reyes', track:'ICT', birth:'2005-01-10', avatar:null },
    { id:'15-3333-444', firstName:'Mark', lastName:'Lopez', track:'ICT', birth:'2005-02-02', avatar:null }
  ];
  const attendance = [
    { userId:'12-1234-567', date:'2025-08-09', status:'Absent' },
    { userId:'12-1234-567', date:'2025-08-08', status:'Tardy' },
    { userId:'13-1111-888', date:'2025-08-08', status:'Absent' }
  ];
  const grades = [
    { userId:'12-1234-567', schoolYear:'2024-2025', semester:'1st Semester', subject:'Math', grade:90 },
    { userId:'12-1234-567', schoolYear:'2024-2025', semester:'1st Semester', subject:'English', grade:88 }
  ];
  const sched = [
    { subject:'Math', time:'8:00 - 9:00', days:'Mon-Fri', room:'101', teacher:'Mr. Cruz' },
    { subject:'English', time:'9:00 - 10:00', days:'Mon-Fri', room:'102', teacher:'Ms. Santos' }
  ];
  write(LS.USERS, users);
  write(LS.ATT, attendance);
  write(LS.GRADES, grades);
  write(LS.SCHED, sched);
  alert('Demo data loaded.');
  renderQuickPills();
}

/* Login / Logout */
loginBtn.addEventListener('click', handleLogin);
loadDemoBtn.addEventListener('click', loadDemoData);
logoutBtn?.addEventListener('click', handleLogout);

function handleLogin(){
  const role = loginRole.value;
  const id = loginId.value.trim();
  const pass = loginPass.value.trim();
  if(role === 'admin'){
    if(id === ADMIN.username && pass === ADMIN.password){ state = { role:'admin', user:{ username: ADMIN.username } }; openDashboard(); } else alert('Invalid admin credentials');
    return;
  }
  const users = read(LS.USERS) || [];
  const u = users.find(x=>x.id===id);
  if(!u){ alert('Student ID not found'); return; }
  const mmdd = (u.birth || '').split('-').slice(1).join('');
  const expected = `${u.id}-${mmdd}`;
  if(pass === expected){ state = { role:'student', user:u }; openDashboard(); } else alert('Invalid student password (ID-MMDD)');
}

function handleLogout(){
  state = { role:null, user:null };
  dashboard.classList.add('hidden');
  loginView.classList.remove('hidden');
  content.innerHTML = '';
  setSidebarUser('Guest','Not signed in', null);
}

/* Open dashboard */
function openDashboard(){
  loginView.classList.add('hidden');
  dashboard.classList.remove('hidden');
  if(state.role==='admin'){ setSidebarUser('Administrator','Admin', null); renderNav(); openView('home'); }
  else { setSidebarUser(fullName(state.user), `${state.user.id} • ${state.user.track}`, state.user.avatar); openStudentDashboard(); }
  renderQuickPills();
}

/* Sidebar user */
function setSidebarUser(name, meta, avatarData){ sidebarUserName.textContent = name; sidebarUserMeta.textContent = meta; if(avatarData){ userAvatarSmall.innerHTML = `<img src="${avatarData}" class="thumb" alt="avatar">`; } else { userAvatarSmall.innerHTML = `<div class="avatar-small-placeholder">${(name||'')[0]||'G'}</div>`; } }

/* Nav */
function renderNav(){ navButtons.forEach(btn => { btn.onclick = ()=>{ navButtons.forEach(n=>n.classList.remove('active')); btn.classList.add('active'); openView(btn.dataset.view); }; }); }

/* Router */
function openView(view){
  if(state.role==='student'){ openStudentDashboard(); return; }
  mainTitle.textContent = { home:'Admin Home', manageStudents:'Manage Students', attendance:'Attendance', grades:'Grades', schedule:'Schedule', importExport:'Import / Export' }[view] || 'View';
  mainSubtitle.textContent = { home:'Overview & quick actions', manageStudents:'Add, edit, search, upload profile pictures', attendance:'Manage attendance records', grades:'Manage grades', schedule:'Manage class schedule', importExport:'Backup & restore data' }[view] || '';
  if(view==='home') renderHome();
  else if(view==='manageStudents') renderManageStudents();
  else if(view==='attendance') renderAttendanceAdmin();
  else if(view==='grades') renderGradesAdmin();
  else if(view==='schedule') renderScheduleAdmin();
  else if(view==='importExport') renderImportExport();
  renderQuickPills();
}

/* Quick pills */
function renderQuickPills(){ const users = read(LS.USERS) || []; const att = read(LS.ATT) || []; const grades = read(LS.GRADES) || []; const sched = read(LS.SCHED) || []; globalQuickPills.innerHTML = `<div class="pill">${users.length} students</div><div class="pill">${att.length} attendance</div><div class="pill">${grades.length} grades</div><div class="pill">${sched.length} schedule</div>`; }

/* HOME */
function renderHome(){ const users = read(LS.USERS) || []; const att = read(LS.ATT) || []; const grades = read(LS.GRADES) || []; const sched = read(LS.SCHED) || []; content.innerHTML = `<div><h4>System Summary</h4><div class="muted">Quick overview</div><div style="display:flex;gap:12px;margin-top:12px;flex-wrap:wrap"><div class="pill">${users.length} students</div><div class="pill">${att.length} attendance</div><div class="pill">${grades.length} grades</div><div class="pill">${sched.length} schedule items</div></div><div class="hr"></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;"><button class="btn primary" onclick="openView(\'manageStudents\')">Manage Students</button><button class="btn ghost" onclick="openView(\'attendance\')">Attendance</button><button class="btn ghost" onclick="openView(\'grades\')">Grades</button></div></div>`; }

/* MANAGE STUDENTS (search, pagination, upload) */
function renderManageStudents(){
  const users = read(LS.USERS) || [];
  const filter = (studentsPage.filter || '').toLowerCase();
  const filtered = users.filter(u => !filter || u.id.toLowerCase().includes(filter) || (u.firstName + ' ' + u.lastName).toLowerCase().includes(filter));
  const total = filtered.length;
  const perPage = studentsPage.perPage;
  const page = Math.min(Math.max(1, studentsPage.page), Math.ceil(Math.max(1,total)/perPage));
  studentsPage.page = page;
  const start = (page-1)*perPage;
  const pageItems = filtered.slice(start, start+perPage);

  const rows = pageItems.map((u, idx) => {
    const idxGlobal = start + idx;
    const avatarThumb = u.avatar ? `<img src="${u.avatar}" class="thumb" alt="avatar">` : '';
    return `<tr><td>${avatarThumb}<strong>${u.id}</strong></td><td>${fullName(u)}</td><td>${u.track}</td><td class="actions"><button class="btn ghost" onclick="showEditStudent(${idxGlobal})">Edit</button><button class="btn ghost" onclick="uploadStudentPhoto(${idxGlobal})">Upload Photo</button><button class="btn danger" onclick="deleteStudent(${idxGlobal})">Delete</button></td></tr>`;
  }).join('') || `<tr><td colspan="4" class="muted">No students</td></tr>`;

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  let pagesHtml = '';
  const maxButtons = 7;
  const startPage = Math.max(1, Math.min(page - Math.floor(maxButtons/2), totalPages - maxButtons + 1));
  for(let p = startPage; p <= Math.min(totalPages, startPage + maxButtons -1); p++) pagesHtml += `<button class="page-btn ${p===page ? 'active' : ''}" onclick="setStudentsPage(${p})">${p}</button>`;

  content.innerHTML = `<div><h4>Students</h4><div class="muted">Add / edit students, upload avatars, search and paginate</div><div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap"><input id="st_search" class="input" placeholder="Search by ID or name" value="${studentsPage.filter||''}"/><select id="st_perpage" class="input" style="max-width:120px;"><option ${perPage===5?'selected':''}>5</option><option ${perPage===10?'selected':''}>10</option><option ${perPage===20?'selected':''}>20</option></select><button class="btn primary" id="st_add">Add New Student</button></div><div style="overflow:auto;margin-top:12px;"><table class="table"><thead><tr><th>ID</th><th>Name</th><th>Track</th><th>Actions</th></tr></thead><tbody id="st_tab_body">${rows}</tbody></table></div><div class="pagination" style="margin-top:10px;"><button class="page-btn" onclick="setStudentsPage(1)">«</button><button class="page-btn" onclick="setStudentsPage(${Math.max(1,page-1)})">‹</button>${pagesHtml}<button class="page-btn" onclick="setStudentsPage(${Math.min(totalPages,page+1)})">›</button><button class="page-btn" onclick="setStudentsPage(${totalPages})">»</button><div style="margin-left:8px" class="muted">Page ${page} of ${totalPages}</div></div></div>`;

  document.getElementById('st_search').addEventListener('input', (e)=>{ studentsPage.filter = e.target.value; studentsPage.page = 1; renderManageStudents(); });
  document.getElementById('st_perpage').addEventListener('change', (e)=>{ studentsPage.perPage = parseInt(e.target.value,10); studentsPage.page = 1; renderManageStudents(); });
  document.getElementById('st_add').addEventListener('click', ()=> showAddStudentForm());
}
function setStudentsPage(p){ studentsPage.page = p; renderManageStudents(); }

/* Add / Edit student */
function showAddStudentForm(){
  content.innerHTML = `<div><h4>Add student</h4><div class="row" style="margin-top:8px;"><input id="stu_id" class="input" placeholder="ID e.g. 12-1234-567"/><input id="stu_first" class="input" placeholder="First name"/></div><div class="row" style="margin-top:8px;"><input id="stu_last" class="input" placeholder="Last name"/><input id="stu_track" class="input" placeholder="Track e.g. ICT"/></div><div style="margin-top:8px;"><label class="muted tiny">Birthdate</label><input id="stu_birth" type="date" class="input"/></div><div style="margin-top:8px;display:flex;gap:8px;"><input id="stu_avatar" type="file" accept="image/*"/></div><div style="margin-top:10px;display:flex;gap:8px;"><button class="btn primary" id="stu_save">Add student</button><button class="btn ghost" id="stu_cancel">Cancel</button></div></div>`;
  document.getElementById('stu_cancel').addEventListener('click', ()=> renderManageStudents());
  document.getElementById('stu_save').addEventListener('click', async ()=>{
    const id = document.getElementById('stu_id').value.trim();
    const first = document.getElementById('stu_first').value.trim();
    const last = document.getElementById('stu_last').value.trim();
    const track = document.getElementById('stu_track').value.trim() || 'ICT';
    const birth = document.getElementById('stu_birth').value;
    const fileEl = document.getElementById('stu_avatar');
    if(!id || !first || !last || !birth){ alert('Fill all fields'); return; }
    const users = read(LS.USERS) || [];
    if(users.some(u=>u.id===id)){ alert('ID exists'); return; }
    let avatar = null;
    if(fileEl.files && fileEl.files[0]) avatar = await fileToDataURL(fileEl.files[0]);
    users.push({ id, firstName:first, lastName:last, track, birth, avatar });
    write(LS.USERS, users);
    renderManageStudents(); renderQuickPills();
  });
}

function showEditStudent(idx){
  const users = read(LS.USERS) || [];
  const u = users[idx];
  if(!u) return;
  content.innerHTML = `<div><h4>Edit ${u.id}</h4><div class="row" style="margin-top:8px;"><input id="stu_first" class="input" value="${u.firstName}"/><input id="stu_last" class="input" value="${u.lastName}"/></div><div class="row" style="margin-top:8px;"><input id="stu_track" class="input" value="${u.track}"/><input id="stu_birth" type="date" class="input" value="${u.birth}"/></div><div style="margin-top:8px"><label class="muted tiny">Change Photo</label><input id="stu_avatar" type="file" accept="image/*"/></div><div style="margin-top:10px;display:flex;gap:8px;"><button class="btn primary" id="save_edit">Save</button><button class="btn ghost" id="cancel_edit">Cancel</button></div></div>`;
  document.getElementById('cancel_edit').addEventListener('click', ()=> renderManageStudents());
  document.getElementById('save_edit').addEventListener('click', async ()=>{
    const first = document.getElementById('stu_first').value.trim();
    const last = document.getElementById('stu_last').value.trim();
    const track = document.getElementById('stu_track').value.trim();
    const birth = document.getElementById('stu_birth').value;
    const fileEl = document.getElementById('stu_avatar');
    let avatar = u.avatar;
    if(fileEl.files && fileEl.files[0]) avatar = await fileToDataURL(fileEl.files[0]);
    users[idx] = { ...users[idx], firstName:first, lastName:last, track, birth, avatar };
    write(LS.USERS, users); renderManageStudents(); renderQuickPills();
  });
}

function deleteStudent(idx){
  if(!confirm('Delete student and records?')) return;
  const users = read(LS.USERS) || [];
  const id = users[idx].id;
  users.splice(idx,1); write(LS.USERS, users);
  write(LS.ATT, (read(LS.ATT)||[]).filter(a=>a.userId!==id));
  write(LS.GRADES, (read(LS.GRADES)||[]).filter(g=>g.userId!==id));
  renderManageStudents(); renderQuickPills();
}

function uploadStudentPhoto(idx){
  const input = document.createElement('input'); input.type='file'; input.accept='image/*';
  input.onchange = async (e)=>{ const f=e.target.files[0]; if(!f) return; const data=await fileToDataURL(f); const users=read(LS.USERS)||[]; users[idx].avatar=data; write(LS.USERS, users); renderManageStudents(); renderQuickPills(); alert('Uploaded'); };
  input.click();
}

/* ATTENDANCE */
function renderAttendanceAdmin(){
  const att = read(LS.ATT)||[]; const users = read(LS.USERS)||[];
  const rows = att.map((a,i)=>`<tr><td>${a.userId}</td><td>${a.date}</td><td>${a.status}</td><td class="actions"><button class="btn danger" onclick="deleteAttendance(${i})">Delete</button></td></tr>`).join('') || `<tr><td colspan="4" class="muted">No records</td></tr>`;
  content.innerHTML = `<div><h4>Attendance</h4><div class="muted">Add attendance</div><div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;"><select id="attUser" class="input">${users.map(u=>`<option value="${u.id}">${u.id} • ${u.firstName}</option>`).join('')}</select><input id="attDate" type="date" class="input" value="${nowDate()}" style="max-width:160px"/><select id="attStatus" class="input" style="max-width:140px"><option>Present</option><option>Absent</option><option>Tardy</option></select><button class="btn primary" id="addAtt">Add</button></div><div style="overflow:auto;margin-top:12px;"><table class="table"><thead><tr><th>Student</th><th>Date</th><th>Status</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  document.getElementById('addAtt').addEventListener('click', ()=>{ const userId=document.getElementById('attUser').value; const date=document.getElementById('attDate').value; const status=document.getElementById('attStatus').value; if(!date){ alert('Pick date'); return; } const arr=read(LS.ATT)||[]; arr.push({ userId,date,status }); write(LS.ATT, arr); renderAttendanceAdmin(); renderQuickPills(); });
}
function deleteAttendance(i){ const arr=read(LS.ATT)||[]; if(!arr[i]) return; if(!confirm('Delete?')) return; arr.splice(i,1); write(LS.ATT, arr); renderAttendanceAdmin(); renderQuickPills(); }

/* GRADES */
function renderGradesAdmin(){
  const grades = read(LS.GRADES)||[]; const users = read(LS.USERS)||[];
  const rows = grades.map((g,i)=>`<tr><td>${g.userId}</td><td>${g.schoolYear}</td><td>${g.semester}</td><td>${g.subject}</td><td><input type="number" value="${g.grade}" onchange="editGrade(${i}, this.value)" style="width:80px"/></td><td class="actions"><button class="btn danger" onclick="deleteGrade(${i})">Delete</button></td></tr>`).join('') || `<tr><td colspan="6" class="muted">No grade records</td></tr>`;
  content.innerHTML = `<div><h4>Grades</h4><div class="muted">Add grade</div><div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;"><select id="gUser" class="input">${users.map(u=>`<option value="${u.id}">${u.id} • ${u.firstName}</option>`).join('')}</select><input id="gSY" class="input" placeholder="2024-2025" style="max-width:160px"/><select id="gSem" class="input" style="max-width:160px"><option>1st Semester</option><option>2nd Semester</option></select><input id="gSubject" class="input" placeholder="Subject" style="max-width:180px"/><input id="gValue" type="number" class="input" placeholder="Grade" style="max-width:120px"/><button class="btn primary" id="addG">Add</button></div><div style="overflow:auto;margin-top:12px;"><table class="table"><thead><tr><th>Student</th><th>SY</th><th>Sem</th><th>Subject</th><th>Grade</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  document.getElementById('addG').addEventListener('click', ()=>{ const userId=document.getElementById('gUser').value; const sy=document.getElementById('gSY').value.trim()||'2024-2025'; const sem=document.getElementById('gSem').value; const subj=document.getElementById('gSubject').value.trim(); const val=parseInt(document.getElementById('gValue').value,10); if(!subj||isNaN(val)){ alert('Enter subject and numeric grade'); return; } const arr=read(LS.GRADES)||[]; arr.push({ userId, schoolYear:sy, semester:sem, subject:subj, grade:val }); write(LS.GRADES, arr); renderGradesAdmin(); renderQuickPills(); });
}
function editGrade(i,val){ const arr=read(LS.GRADES)||[]; arr[i].grade = parseInt(val,10)||0; write(LS.GRADES, arr); }
function deleteGrade(i){ const arr=read(LS.GRADES)||[]; if(!arr[i]) return; if(!confirm('Delete?')) return; arr.splice(i,1); write(LS.GRADES, arr); renderGradesAdmin(); renderQuickPills(); }

/* SCHEDULE */
function renderScheduleAdmin(){ const arr=read(LS.SCHED)||[]; const rows = arr.map((s,i)=>`<tr><td>${s.subject}</td><td>${s.time}</td><td>${s.days}</td><td>${s.room}</td><td>${s.teacher}</td><td class="actions"><button class="btn danger" onclick="deleteSchedule(${i})">Delete</button></td></tr>`).join('')||`<tr><td colspan="6" class="muted">No schedule</td></tr>`; content.innerHTML = `<div><h4>Schedule</h4><div class="muted">Add schedule</div><div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;"><input id="sSubject" class="input" placeholder="Subject"/><input id="sTime" class="input" placeholder="Time (8:00 - 9:00)"/><input id="sDays" class="input" placeholder="Days e.g. Mon-Fri"/><input id="sRoom" class="input" placeholder="Room"/><input id="sTeacher" class="input" placeholder="Teacher"/><button class="btn primary" id="addS">Add</button></div><div style="overflow:auto;margin-top:12px;"><table class="table"><thead><tr><th>Subject</th><th>Time</th><th>Days</th><th>Room</th><th>Teacher</th><th>Action</th></tr></thead><tbody>${rows}</tbody></table></div></div>`; document.getElementById('addS').addEventListener('click', ()=>{ const subject=document.getElementById('sSubject').value.trim(); const time=document.getElementById('sTime').value.trim(); const days=document.getElementById('sDays').value.trim(); const room=document.getElementById('sRoom').value.trim(); const teacher=document.getElementById('sTeacher').value.trim(); if(!subject||!time){ alert('Subject and time required'); return; } const arr2=read(LS.SCHED)||[]; arr2.push({ subject,time,days,room,teacher }); write(LS.SCHED, arr2); renderScheduleAdmin(); renderQuickPills(); }); }
function deleteSchedule(i){ const arr=read(LS.SCHED)||[]; if(!arr[i]) return; if(!confirm('Delete schedule?')) return; arr.splice(i,1); write(LS.SCHED, arr); renderScheduleAdmin(); renderQuickPills(); }

/* IMPORT / EXPORT */
function renderImportExport(){ content.innerHTML = `<div><h4>Import / Export</h4><div class="muted">Backup/restore DB (includes avatars)</div><div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;"><button class="btn primary" onclick="exportDB()">Export JSON</button><label class="btn ghost" style="cursor:pointer;">Import JSON <input id="impFile" type="file" accept="application/json" style="display:none" onchange="importDB(event)"></label><button class="btn ghost" onclick="clearAll()">Reset Local Data</button></div><div class="hr"></div><div class="muted">Import replaces current data. Export first if you need a backup.</div></div>`; }
function exportDB(){ const payload = { users: read(LS.USERS)||[], attendance: read(LS.ATT)||[], grades: read(LS.GRADES)||[], schedule: read(LS.SCHED)||[] }; const blob=new Blob([JSON.stringify(payload, null,2)], {type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='csr_export.json'; a.click(); URL.revokeObjectURL(url); }
function importDB(e){ const file = e.target.files[0]; if(!file){ alert('No file'); return; } const r=new FileReader(); r.onload = function(ev){ try{ const obj=JSON.parse(ev.target.result); write(LS.USERS, obj.users||[]); write(LS.ATT, obj.attendance||[]); write(LS.GRADES, obj.grades||[]); write(LS.SCHED, obj.schedule||[]); alert('Import done'); openView('home'); renderQuickPills(); }catch(err){ alert('Invalid JSON'); } }; r.readAsText(file); if(e.target) e.target.value=''; }

/* STUDENT DASHBOARD (student view uses same layout area) */
function openStudentDashboard(){ const u = state.user; setSidebarUser(fullName(u), `${u.id} • ${u.track}`, u.avatar); const avatarHtml = u.avatar ? `<img src="${u.avatar}" class="avatar" alt="avatar">` : `<div class="avatar-placeholder">${(u.firstName||'')[0]}${(u.lastName||'')[0]}</div>`; content.innerHTML = `<div><div style="display:flex;gap:16px;align-items:center"><div style="min-width:150px;text-align:center">${avatarHtml}</div><div style="flex:1"><div class="muted">Student Information</div><div style="margin-top:8px;font-weight:700;font-size:18px">${fullName(u)}</div><div class="muted" style="margin-top:6px">${u.id} • ${u.track}</div><div class="hr"></div><div style="display:flex;gap:8px;flex-wrap:wrap"><div class="pill">${countAbsences(u.id)} absences</div><div class="pill">${getGradesCount(u.id)} grades</div></div></div></div></div><div style="margin-top:12px;"><button class="btn ghost" onclick="renderStudentSchedule()">Schedule</button><button class="btn ghost" onclick="renderStudentAttendance()">Attendance</button><button class="btn ghost" onclick="renderStudentGrades()">Grades</button></div>`; }

/* Student subviews */
function renderStudentSchedule(){ const sched = read(LS.SCHED)||[]; const rows = sched.map(s=>`<tr><td>${s.subject}</td><td>${s.time}</td><td>${s.days}</td><td>${s.room}</td><td>${s.teacher}</td></tr>`).join('') || '<tr><td colspan="5" class="muted">No schedule</td></tr>'; content.innerHTML = `<div><h4>Schedule</h4><div style="overflow:auto"><table class="table"><thead><tr><th>Subject</th><th>Time</th><th>Days</th><th>Room</th><th>Teacher</th></tr></thead><tbody>${rows}</tbody></table></div></div>`; }
function renderStudentAttendance(){ const uid = state.user.id; const att = (read(LS.ATT)||[]).filter(a=>a.userId===uid).sort((a,b)=>b.date.localeCompare(a.date)); const rows = att.map(a=>`<li style="padding:8px 0;border-bottom:1px solid rgba(0,0,0,0.04);display:flex;justify-content:space-between"><span>${a.date}</span><span>${a.status}</span></li>`).join('') || '<li class="muted">No records</li>'; content.innerHTML = `<div><h4>Attendance</h4><ul style="list-style:none;padding:0;margin-top:8px">${rows}</ul></div>`; }
function renderStudentGrades(){ const uid = state.user.id; const gradesAll = (read(LS.GRADES)||[]).filter(g=>g.userId===uid); const rows = gradesAll.map(g=>`<tr><td>${g.subject}</td><td>${g.grade}</td></tr>`).join('') || '<tr><td colspan="2" class="muted">No grades</td></tr>'; content.innerHTML = `<div><h4>Grades</h4><div style="overflow:auto"><table class="table"><thead><tr><th>Subject</th><th>Grade</th></tr></thead><tbody>${rows}</tbody></table></div></div>`; }

/* helpers */
function countAbsences(userId){ return (read(LS.ATT)||[]).filter(a=>a.userId===userId && a.status==='Absent').length; }
function getGradesCount(userId){ return (read(LS.GRADES)||[]).filter(g=>g.userId===userId).length; }

/* global functions for inline buttons */
window.openView = function(v){ if(state.role==='student'){ openStudentDashboard(); return; } openView(v); };
window.showAddStudentForm = function(){ showAddStudentForm(); };
window.editGrade = function(i,v){ editGrade(i,v); };

/* clear all */
function clearAll(){ if(!confirm('Clear all local data?')) return; localStorage.removeItem(LS.USERS); localStorage.removeItem(LS.ATT); localStorage.removeItem(LS.GRADES); localStorage.removeItem(LS.SCHED); alert('Cleared. Page will reload.'); location.reload(); }

/* Boot */
(function boot(){ initTheme(); if(!localStorage.getItem(LS.USERS)) loadDemoData(); renderQuickPills(); renderNav(); })();
