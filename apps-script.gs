/**
 * Nixan Portfolio - Google Apps Script Backend
 *
 * Deploy:
 *   1. Open your Google Sheet (it MUST have tabs named: Skills, Experience, Education, Projects, Contact).
 *      First row of every tab = column headers (see SRS). The "Skills" tab columns:
 *         ID | Skill | Category | Percentage
 *      Experience: ID | Company | Role | Start Date | End Date | Description | Technology
 *      Education:  ID | Degree | College | Year | CGPA
 *      Projects:   ID | Project Name | Description | Technology | GitHub URL | Demo URL | Image URL
 *      Contact:    ID | Name | Email | Subject | Message | Date
 *   2. Extensions → Apps Script. Paste this file. Save.
 *   3. In Script Properties (Project Settings → Script Properties) set:
 *         ADMIN_USERNAME      = your username
 *         ADMIN_PASSWORD      = your password
 *         RESUME_FILE_ID      = (optional) Google Drive file ID of your resume PDF
 *   4. Deploy → New deployment → Web app
 *         Execute as: Me
 *         Who has access: Anyone
 *      Copy the URL.
 *   5. In your portfolio project, set env var:
 *         VITE_APPS_SCRIPT_URL=<that URL>
 */

const SHEETS = {
  skills: 'Skills',
  experience: 'Experience',
  education: 'Education',
  projects: 'Projects',
  contact: 'Contact',
};

function doGet(e) { return handle(e, null); }
function doPost(e) {
  let body = null;
  try { body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : null; } catch (_) {}
  return handle(e, body);
}

function handle(e, body) {
  try {
    const action = (e.parameter.action || '').toLowerCase();
    if (action === 'login')  return json(login(body || {}));
    if (action === 'resume') return json(resume());
    const sheet = SHEETS[(e.parameter.sheet || '').toLowerCase()];
    if (!sheet) return json({ ok: false, error: 'Unknown sheet' });
    if (action === 'list')   return json({ ok: true, data: listRows(sheet) });
    if (action === 'create') return json(createRow(sheet, body || {}));
    if (action === 'update') return json(updateRow(sheet, e.parameter.id, body || {}));
    if (action === 'delete') return json(deleteRow(sheet, e.parameter.id));
    return json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  }
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function login(body) {
  const props = PropertiesService.getScriptProperties();
  const u = props.getProperty('ADMIN_USERNAME') || 'admin';
  const p = props.getProperty('ADMIN_PASSWORD') || 'admin';
  if (body.username === u && body.password === p) {
    return { ok: true, data: { token: Utilities.getUuid() } };
  }
  return { ok: false, error: 'Invalid username or password' };
}

function resume() {
  const id = PropertiesService.getScriptProperties().getProperty('RESUME_FILE_ID');
  if (!id) return { ok: false, error: 'Resume not configured. Set RESUME_FILE_ID in Script Properties.' };
  return { ok: true, data: { url: 'https://drive.google.com/uc?export=download&id=' + id } };
}

function getSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error('Sheet "' + name + '" not found');
  return sh;
}

function listRows(name) {
  const sh = getSheet(name);
  const values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
  return values.slice(1)
    .filter(r => r.some(v => v !== '' && v !== null))
    .map(r => {
      const o = {};
      headers.forEach((h, i) => { o[h] = r[i] == null ? '' : String(r[i]); });
      return o;
    });
}

function createRow(name, body) {
  const sh = getSheet(name);
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0].map(String);
  const id = body.ID || Utilities.getUuid().slice(0, 8);
  const row = headers.map(h => h === 'ID' ? id : (body[h] != null ? body[h] : ''));
  sh.appendRow(row);
  return { ok: true, data: { id } };
}

function updateRow(name, id, body) {
  if (!id) return { ok: false, error: 'Missing id' };
  const sh = getSheet(name);
  const values = sh.getDataRange().getValues();
  const headers = values[0].map(String);
  const idCol = headers.indexOf('ID');
  if (idCol < 0) return { ok: false, error: 'No ID column' };
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idCol]) === String(id)) {
      const newRow = headers.map((h, c) => h === 'ID' ? id : (body[h] != null ? body[h] : values[i][c]));
      sh.getRange(i + 1, 1, 1, headers.length).setValues([newRow]);
      return { ok: true };
    }
  }
  return { ok: false, error: 'Not found' };
}

function deleteRow(name, id) {
  if (!id) return { ok: false, error: 'Missing id' };
  const sh = getSheet(name);
  const values = sh.getDataRange().getValues();
  const headers = values[0].map(String);
  const idCol = headers.indexOf('ID');
  for (let i = 1; i < values.length; i++) {
    if (String(values[i][idCol]) === String(id)) { sh.deleteRow(i + 1); return { ok: true }; }
  }
  return { ok: false, error: 'Not found' };
}
