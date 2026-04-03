import { apiFetch, DEFAULT_PROFILE_PHOTO_URL, getPhotoUrlByPersonId } from './utils.js';

const tableDefinitions = [
  { key: 'person', label: 'Person Profile' },
  { key: 'passports', label: 'Passports' },
  { key: 'criminal_records', label: 'Criminal Records' },
  { key: 'medical_records', label: 'Medical Records' },
  { key: 'education', label: 'Education' },
  { key: 'employment', label: 'Employment' },
  { key: 'assets', label: 'Assets' },
  { key: 'marriage', label: 'Marriage' },
  { key: 'birth_records', label: 'Birth Records' },
  { key: 'death_records', label: 'Death Records' },
];

const els = {
  personTitle: document.getElementById('personTitle'),
  personPhoto: document.getElementById('personPhoto'),
  tableNav: document.getElementById('tableNav'),
  sectionTitle: document.getElementById('sectionTitle'),
  sectionMeta: document.getElementById('sectionMeta'),
  statusBanner: document.getElementById('statusBanner'),
  contentBody: document.getElementById('contentBody'),
  backBtn: document.getElementById('backBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
};

let personData = null;
let relatedTables = {};

function tokenPayload(token) {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

function guardGovernmentAccess() {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
  if (!token) {
    window.location.href = 'loginPage.html';
    return false;
  }

  const payload = tokenPayload(token);
  if (!payload || (payload.role !== 'government' && payload.role !== 'admin')) {
    window.location.href = 'loginPage.html';
    return false;
  }

  return true;
}

function fmt(value) {
  if (value === null || value === undefined || value === '') return 'Not available';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function fmtDateLike(value, keyName = '') {
  if (value === null || value === undefined || value === '') return 'Not available';
  if (typeof value === 'string') {
    const key = keyName.toLowerCase();
    if (key.includes('date') || key.includes('time') || /^\d{4}-\d{2}-\d{2}/.test(value)) {
      const d = new Date(value);
      if (!Number.isNaN(d.getTime())) {
        return key.includes('time') ? d.toLocaleString() : d.toLocaleDateString();
      }
    }
  }
  return fmt(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function prettyLabel(name) {
  return name
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function setStatus(message, type = '') {
  els.statusBanner.classList.remove('success', 'error');
  if (type) els.statusBanner.classList.add(type);
  els.statusBanner.textContent = message;
}

function renderTableNav(counts = {}) {
  els.tableNav.innerHTML = tableDefinitions
    .map(({ key, label }) => {
      const count = key === 'person' ? 1 : Number(counts[key]) || 0;
      return `<button type="button" class="nav-btn" data-key="${key}">${escapeHtml(label)} (${count})</button>`;
    })
    .join('');

  els.tableNav.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => showSection(btn.dataset.key));
  });
}

function setActiveNav(key) {
  els.tableNav.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.key === key);
  });
}

function rowHtml(k, v) {
  return `<div class="k">${escapeHtml(prettyLabel(k))}</div><div class="v">${escapeHtml(fmtDateLike(v, k))}</div>`;
}

function renderPersonProfile() {
  const rows = personData ? Object.entries(personData) : [];
  if (!rows.length) {
    els.contentBody.innerHTML = '<div class="empty-state">Person profile not available.</div>';
    return;
  }

  els.contentBody.innerHTML = `
    <div class="records-grid">
      <article class="record-card">
        <h3>Core Profile</h3>
        <div class="kv">
          ${rows.map(([k, v]) => rowHtml(k, v)).join('')}
        </div>
      </article>
    </div>
  `;
}

function renderTableRecords(tableKey) {
  const records = Array.isArray(relatedTables[tableKey]) ? relatedTables[tableKey] : [];
  if (!records.length) {
    els.contentBody.innerHTML = '<div class="empty-state">No records in this table for this person.</div>';
    return;
  }

  els.contentBody.innerHTML = `
    <div class="records-grid">
      ${records
        .map((record, idx) => {
          const rows = Object.entries(record).map(([k, v]) => rowHtml(k, v)).join('');
          return `
            <article class="record-card">
              <h3>Record ${idx + 1}</h3>
              <div class="kv">${rows}</div>
            </article>
          `;
        })
        .join('')}
    </div>
  `;
}

function showSection(sectionKey) {
  setActiveNav(sectionKey);
  const def = tableDefinitions.find((t) => t.key === sectionKey);
  const label = def?.label || prettyLabel(sectionKey);

  els.sectionTitle.textContent = label;

  if (sectionKey === 'person') {
    els.sectionMeta.textContent = 'Core person profile fields';
    renderPersonProfile();
    return;
  }

  const count = Array.isArray(relatedTables[sectionKey]) ? relatedTables[sectionKey].length : 0;
  els.sectionMeta.textContent = `${count} record(s)`;
  renderTableRecords(sectionKey);
}

async function logout() {
  await apiFetch('/api/auth/logout', 'POST');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  window.location.href = 'loginPage.html';
}

async function init() {
  if (!guardGovernmentAccess()) return;

  const personId = new URLSearchParams(window.location.search).get('personId');
  if (!personId) {
    setStatus('Missing person id in URL.', 'error');
    els.contentBody.innerHTML = '<div class="empty-state">No person selected.</div>';
    return;
  }

  els.backBtn.addEventListener('click', () => {
    window.location.href = 'government_page.html';
  });
  els.logoutBtn.addEventListener('click', logout);

  setStatus('Loading person deep view...');

  const [personRes, relatedRes, photoUrl] = await Promise.all([
    apiFetch(`/api/person/${personId}`, 'GET'),
    apiFetch(`/api/person/${personId}/related`, 'GET'),
    getPhotoUrlByPersonId(personId),
  ]);

  if (personRes?.error) {
    setStatus(`Failed to load person: ${personRes.error}`, 'error');
    els.contentBody.innerHTML = '<div class="empty-state">Cannot load person data.</div>';
    return;
  }

  if (relatedRes?.error) {
    setStatus(`Failed to load related data: ${relatedRes.error}`, 'error');
    els.contentBody.innerHTML = '<div class="empty-state">Cannot load related table data.</div>';
    return;
  }

  personData = personRes;
  relatedTables = relatedRes.tables || {};

  if (els.personPhoto) {
    els.personPhoto.onerror = () => {
      els.personPhoto.src = DEFAULT_PROFILE_PHOTO_URL;
    };
    els.personPhoto.src = photoUrl || DEFAULT_PROFILE_PHOTO_URL;
  }

  const fullName = `${fmt(personData.first_name)} ${fmt(personData.last_name)}`;
  els.personTitle.textContent = `${fullName} | National ID: ${fmt(personData.national_id)}`;

  renderTableNav(relatedRes.counts || {});
  showSection('person');
  setStatus('Person data loaded successfully.', 'success');
}

init();
