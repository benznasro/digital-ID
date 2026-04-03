import { apiFetch } from './utils.js';

const els = {
  q: document.getElementById('q'),
  gender: document.getElementById('gender'),
  maritalStatus: document.getElementById('marital_status'),
  minAge: document.getElementById('min_age'),
  maxAge: document.getElementById('max_age'),
  isAlive: document.getElementById('is_alive'),
  hasPassport: document.getElementById('has_passport'),
  hasCriminal: document.getElementById('has_criminal'),
  sortBy: document.getElementById('sort_by'),
  sortDir: document.getElementById('sort_dir'),
  limit: document.getElementById('limit'),
  page: document.getElementById('page'),
  searchBtn: document.getElementById('searchBtn'),
  clearBtn: document.getElementById('clearBtn'),
  refreshBtn: document.getElementById('refreshBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  peopleRows: document.getElementById('peopleRows'),
  detailsBody: document.getElementById('detailsBody'),
  statusBanner: document.getElementById('statusBanner'),
  resultsMeta: document.getElementById('resultsMeta'),
};

const relatedTableDefinitions = [
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

let currentPersonId = null;

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
  return String(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function fmtDate(value) {
  if (!value) return 'Not available';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString();
}

function statusTag(isTrue) {
  return isTrue ? '<span class="tag ok">Yes</span>' : '<span class="tag no">No</span>';
}

function setStatus(msg, type = '') {
  els.statusBanner.classList.remove('error', 'success');
  if (type) els.statusBanner.classList.add(type);
  els.statusBanner.textContent = msg;
}

function buildQueryParams() {
  const params = new URLSearchParams();

  const map = {
    q: els.q.value.trim(),
    gender: els.gender.value,
    marital_status: els.maritalStatus.value,
    min_age: els.minAge.value,
    max_age: els.maxAge.value,
    is_alive: els.isAlive.value,
    has_passport: els.hasPassport.value,
    has_criminal: els.hasCriminal.value,
    sort_by: els.sortBy.value,
    sort_dir: els.sortDir.value,
    limit: els.limit.value,
    page: els.page.value || '1',
  };

  Object.entries(map).forEach(([k, v]) => {
    if (v !== '') params.set(k, v);
  });

  return params.toString();
}

function renderRows(rows) {
  if (!rows.length) {
    els.peopleRows.innerHTML = '<tr><td colspan="8">No matching records.</td></tr>';
    return;
  }

  els.peopleRows.innerHTML = rows
    .map((r) => {
      const fullName = `${fmt(r.first_name)} ${fmt(r.last_name)}`;
      return `
        <tr>
          <td>${fmt(r.id)}</td>
          <td>${fmt(r.national_id)}</td>
          <td>${fullName}</td>
          <td>${fmtDate(r.date_of_birth)}</td>
          <td>${r.is_alive ? '<span class="tag ok">Alive</span>' : '<span class="tag no">Deceased</span>'}</td>
          <td>${statusTag(r.has_active_passport)}</td>
          <td>${statusTag(r.has_criminal_record)}</td>
          <td><button class="btn btn-secondary inspect-btn" data-id="${r.id}">Inspect</button></td>
        </tr>
      `;
    })
    .join('');

  document.querySelectorAll('.inspect-btn').forEach((btn) => {
    btn.addEventListener('click', () => loadPersonDetails(btn.dataset.id));
  });
}

async function loadPersonDetails(personId) {
  currentPersonId = String(personId);
  els.detailsBody.textContent = 'Loading person details...';
  const data = await apiFetch(`/api/person/${personId}`, 'GET');

  if (data?.error) {
    els.detailsBody.textContent = `Error: ${data.error}`;
    return;
  }

  const rows = [
    ['ID', fmt(data.id)],
    ['National ID', fmt(data.national_id)],
    ['Full Name', `${fmt(data.first_name)} ${fmt(data.last_name)}`],
    ['Gender', data.gender === true ? 'Male' : data.gender === false ? 'Female' : 'Not available'],
    ['Date of Birth', fmtDate(data.date_of_birth)],
    ['Marital Status', fmt(data.marital_status)],
    ['Father', fmt(data.father_name)],
    ['Mother', fmt(data.mother_name)],
    ['Email', fmt(data.email)],
    ['Phone', fmt(data.phone_number)],
  ];

  els.detailsBody.innerHTML = `
    <div class="details-core">
      ${rows
        .map(([k, v]) => `<div class="details-row"><span>${escapeHtml(k)}</span><strong>${escapeHtml(v)}</strong></div>`)
        .join('')}
    </div>
    <section class="related-section">
      <h3>Other Tables</h3>
      <div id="relatedSummary" class="related-summary">Loading related records...</div>
      <div id="relatedStatus" class="related-status">Loading related records...</div>
      <button id="moreInfoBtn" type="button" class="btn btn-primary more-info-btn">More Info</button>
    </section>
  `;

  const moreInfoBtn = document.getElementById('moreInfoBtn');
  if (moreInfoBtn) {
    moreInfoBtn.addEventListener('click', () => {
      window.location.href = `government_person_details.html?personId=${encodeURIComponent(personId)}`;
    });
  }

  const relatedRes = await apiFetch(`/api/person/${personId}/related`, 'GET');
  if (currentPersonId !== String(personId)) {
    return;
  }

  if (relatedRes?.error) {
    const relatedStatus = document.getElementById('relatedStatus');
    if (relatedStatus) relatedStatus.textContent = `Error: ${relatedRes.error}`;
    return;
  }

  const relatedSummary = document.getElementById('relatedSummary');
  const relatedStatus = document.getElementById('relatedStatus');
  const counts = relatedRes.counts || {};
  const total = Object.values(counts).reduce((acc, n) => acc + (Number(n) || 0), 0);

  if (relatedSummary) {
    relatedSummary.innerHTML = relatedTableDefinitions
      .map(({ key, label }) => `<span class="related-pill">${escapeHtml(label)} (${Number(counts[key]) || 0})</span>`)
      .join('');
  }

  if (relatedStatus) {
    relatedStatus.textContent = `Found ${total} related record(s). Use More Info for full navigation.`;
  }
}

async function runSearch() {
  setStatus('Searching records...');
  els.peopleRows.innerHTML = '';

  const query = buildQueryParams();
  const data = await apiFetch(`/api/person/gov/search?${query}`, 'GET');

  if (data?.error) {
    setStatus(`Failed: ${data.error}`, 'error');
    els.resultsMeta.textContent = 'Search failed.';
    return;
  }

  renderRows(data.data || []);

  const page = data.page || 1;
  const total = data.total || 0;
  const totalPages = data.total_pages || 1;
  els.resultsMeta.textContent = `Page ${page} of ${totalPages} | Total ${total} record(s)`;

  if ((data.data || []).length) {
    setStatus('Search completed successfully.', 'success');
  } else {
    setStatus('No data for current filters.');
  }
}

function clearFilters() {
  els.q.value = '';
  els.gender.value = '';
  els.maritalStatus.value = '';
  els.minAge.value = '';
  els.maxAge.value = '';
  els.isAlive.value = '';
  els.hasPassport.value = '';
  els.hasCriminal.value = '';
  els.sortBy.value = 'id';
  els.sortDir.value = 'asc';
  els.limit.value = '25';
  els.page.value = '1';
  currentPersonId = null;
  els.detailsBody.textContent = 'No person selected.';
}

async function logout() {
  await apiFetch('/api/auth/logout', 'POST');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  window.location.href = 'loginPage.html';
}

if (guardGovernmentAccess()) {
  els.searchBtn.addEventListener('click', runSearch);
  els.refreshBtn.addEventListener('click', runSearch);
  els.clearBtn.addEventListener('click', () => {
    clearFilters();
    runSearch();
  });
  els.logoutBtn.addEventListener('click', logout);
  els.page.addEventListener('change', runSearch);
  runSearch();
}
