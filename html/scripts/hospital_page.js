import { apiFetch } from './utils.js';

// Sidebar Toggle (mobile) 
const sidebar       = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');

const birthDateInput = document.getElementById('birthDateTime');

function getLocalDateTimeForInput() {
  const now = new Date();
  const offsetMinutes = now.getTimezoneOffset();
  const localTime = new Date(now.getTime() - offsetMinutes * 60000);
  return localTime.toISOString().slice(0, 16);
}

if (birthDateInput && !birthDateInput.value) {
  birthDateInput.value = getLocalDateTimeForInput();
}

sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (window.innerWidth < 900 && sidebar.classList.contains('open')) {
    if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  }
});

//  Result Helper 
function showResult(elementId, res) {
  const div = document.getElementById(elementId);
  div.classList.remove('error', 'success');
  div.classList.add(res.error ? 'error' : 'success');
  div.innerText = res.message || res.error || 'Unknown response';
  console.log(res);
  
}

//  Sidebar Logs 
async function loadSidebarLogs() {
  const logsDiv = document.getElementById('sidebarLogs');
  try {
    const logs = await apiFetch('/api/hospital/my_logs', 'GET', null);

    if (!logs || !logs.length) {
      logsDiv.innerHTML = '<div class="log-entry"><i class="fa-solid fa-circle-dot"></i> No logs yet.</div>';
      return;
    }

    logsDiv.innerHTML = logs.slice(0, 5).map(log => {
      const time = new Date(log.changed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `<div class="log-entry">
        <i class="fa-solid fa-baby"></i>
        Birth #${log.birth_record_id} at ${time}
      </div>`;
    }).join('');

  } catch (err) {
    logsDiv.innerHTML = '<div class="log-entry" style="color:#c62828">Failed to load logs.</div>';
  }
}

//  Sidebar Birth Records 
let allRecords = [];

async function loadSidebarRecords() {
  const list = document.getElementById('contractsList');
  list.innerHTML = '<li class="contract-item"><i class="fa-solid fa-spinner fa-spin"></i> Loading...</li>';
  try {
    const logs = await apiFetch('/api/hospital/my_logs', 'GET', null);
    allRecords = logs || [];
    applyFilters();
  } catch (err) {
    list.innerHTML = '<li class="contract-item" style="color:#c62828">Failed to load records.</li>';
  }
}

function renderRecords(records) {
  const list = document.getElementById('contractsList');

  document.getElementById('contractCount').textContent = records.length;

  if (!records.length) {
    list.innerHTML = '<li class="contract-item no-results"><i class="fa-solid fa-inbox"></i> No records found.</li>';
    return;
  }

  list.innerHTML = records.map(r => {
    const op = r.operation || 'INSERT';
    const label = op === 'INSERT' ? 'Birth' : op === 'UPDATE' ? 'Update' : 'Delete';
    const date = new Date(r.changed_at).toLocaleDateString();
    return `<li class="contract-item">
      <div class="contract-item-header">
        <span class="contract-badge badge-birth">${label}</span>
        <span class="contract-id">#${r.birth_record_id}</span>
      </div>
      <div class="contract-names">
        Child: ${r.child_name || 'Unknown'}
      </div>
      <div class="contract-names">
        Dr. ${r.new_doctor_name || r.old_doctor_name || 'Unknown'}
      </div>
      <div class="contract-date"><i class="fa-regular fa-calendar"></i> ${date}</div>
    </li>`;
  }).join('');
}

//  Apply All Filters 
function applyFilters() {
  const search   = document.getElementById('contractSearch').value.trim().toLowerCase();
  const dateFrom = document.getElementById('filterDateFrom').value;
  const dateTo   = document.getElementById('filterDateTo').value;

  let filtered = allRecords;

  // filter by date range
  if (dateFrom) {
    const from = new Date(dateFrom);
    filtered = filtered.filter(r => new Date(r.changed_at) >= from);
  }
  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59);
    filtered = filtered.filter(r => new Date(r.changed_at) <= to);
  }

  // filter by search text
  if (search) {
    filtered = filtered.filter(r =>
      String(r.birth_record_id).includes(search)          ||
      String(r.new_child_id   || '').includes(search)     ||
      (r.child_name || '').toLowerCase().includes(search) ||
      (r.new_doctor_name || r.old_doctor_name || '').toLowerCase().includes(search)
    );
  }

  renderRecords(filtered);
}

// wire up filter inputs
document.getElementById('contractSearch').addEventListener('input',  applyFilters);
document.getElementById('filterDateFrom').addEventListener('change', applyFilters);
document.getElementById('filterDateTo').addEventListener('change',   applyFilters);

// reset button
document.getElementById('contractClear').addEventListener('click', () => {
  document.getElementById('contractSearch').value  = '';
  document.getElementById('filterDateFrom').value  = '';
  document.getElementById('filterDateTo').value    = '';
  loadSidebarRecords();
});

//  Newborn Form 
document.getElementById('marriageForm').onsubmit = async function(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    first_name:     form.newbornName.value,
    gender:         form.gender.value === 'male',
    birth_weight_kg: Number(form.weight.value),
    height_cm:      form.heightCm.value ? Number(form.heightCm.value) : null,
    apgar_score:    form.apgarScore.value ? Number(form.apgarScore.value) : null,
    blood_type:     form.bloodType.value || null,
    date_of_birth:  document.getElementById('birthDateTime').value,
    husband_id:     form.fatherId.value,
    wife_id:        form.motherId.value,
    doctor_name:    form.doctorName.value,
  };

  const res = await apiFetch('/api/hospital/new_birth', 'POST', data);
  showResult('marriageResult', res);

  if (!res.error) {
    loadSidebarLogs();
    loadSidebarRecords();
  }
};

//  Prevent wheel on number inputs 
document.querySelectorAll('input[type="number"]').forEach(input => {
  input.addEventListener('wheel', (e) => {
    e.preventDefault();
    input.blur();
  }, { passive: false });
});

//  Init 
loadSidebarLogs();
loadSidebarRecords();