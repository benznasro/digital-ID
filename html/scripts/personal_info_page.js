import { apiFetch } from './utils.js';

const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarLinks = Array.from(document.querySelectorAll('.sidebar-link'));
const sections = Array.from(document.querySelectorAll('.content-section'));
const statusBanner = document.getElementById('statusBanner');

function setBanner(message, type = '') {
  statusBanner.classList.remove('success', 'error');
  if (type) {
    statusBanner.classList.add(type);
  }
  statusBanner.textContent = message;
}

function formatDate(value) {
  if (!value) {
    return 'Not available';
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return String(value);
  }
  return d.toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) {
    return 'Not available';
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return String(value);
  }
  return d.toLocaleString();
}

function fmt(value) {
  return value === null || value === undefined || value === '' ? 'Not available' : String(value);
}

function genderLabel(value) {
  if (value === true) {
    return 'Male';
  }
  if (value === false) {
    return 'Female';
  }
  return 'Not available';
}

function smokerLabel(value) {
  if (value === true) {
    return 'Yes';
  }
  if (value === false) {
    return 'No';
  }
  return 'Not available';
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = value;
  }
}

function renderPerson(person) {
  const fullName = `${fmt(person?.first_name)} ${fmt(person?.last_name)}`.trim();

  setText('overviewFullName', fullName === 'Not available Not available' ? 'Not available' : fullName);
  setText('overviewNationalId', fmt(person?.national_id));
  setText('overviewMarital', fmt(person?.marital_status));
  setText('identityNationalId', fmt(person?.national_id));
  setText('identityFirstName', fmt(person?.first_name));
  setText('identityLastName', fmt(person?.last_name));
  setText('identityDob', formatDate(person?.date_of_birth));
  setText('identityGender', genderLabel(person?.gender));
  setText('identityMarital', fmt(person?.marital_status));
  setText('contactEmail', fmt(person?.email));
  setText('contactPhone', fmt(person?.phone_number));

  setText('familyDad', fmt(person?.dad_id));
  setText('familyMom', fmt(person?.mom_id));
}

function renderBirth(birth) {
  setText('overviewBirthCertificate', fmt(birth?.birth_certificate_no));

  setText('birthRecordId', fmt(birth?.id));
  setText('birthCertificate', fmt(birth?.birth_certificate_no));
  setText('birthDateTime', formatDateTime(birth?.birth_datetime));
  setText('birthHospital', fmt(birth?.hospital_name));
  setText('birthDoctor', fmt(birth?.doctor_name));
  setText('birthWeight', fmt(birth?.birth_weight_kg));
  setText('birthApgar', fmt(birth?.apgar_score));
  setText('birthMarriageId', fmt(birth?.marriage_id));
}

function renderMedical(medical) {
  setText('overviewBloodType', fmt(medical?.blood_type));
  setText('overviewCheckup', formatDate(medical?.last_checkup_date));

  setText('medicalId', fmt(medical?.id));
  setText('medicalBloodType', fmt(medical?.blood_type));
  setText('medicalHeight', fmt(medical?.height_cm));
  setText('medicalWeight', fmt(medical?.weight_kg));
  setText('medicalSmoker', smokerLabel(medical?.smoker));
  setText('medicalConditions', fmt(medical?.chronic_conditions));
  setText('medicalCheckup', formatDate(medical?.last_checkup_date));
}
function renderMarriage(marriage){
  setText('FullHesbend"', fmt(marriage?.blood_type));
  setText('FullWife', formatDate(marriage?.last_checkup_date));

  setText('valid', fmt(marriage?.id));
  setText('divorceDate', fmt(marriage?.blood_type));
  setText('MarriageDate', fmt(marriage?.height_cm));
  setText('witness_1', fmt(marriage?.weight_kg));
  setText('witness_2', smokerLabel(marriage?.smoker));
  setText('dowry_amount', fmt(marriage?.chronic_conditions));
  setText('notary', formatDate(marriage?.last_checkup_date));
}
function activateSection(sectionName) {
  sidebarLinks.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.section === sectionName);
  });

  sections.forEach((section) => {
    const isTarget = section.id === `section-${sectionName}`;
    section.classList.toggle('active', isTarget);
  });
}

sidebarLinks.forEach((btn) => {
  btn.addEventListener('click', () => {
    activateSection(btn.dataset.section);
    if (window.innerWidth < 900) {
      sidebar.classList.remove('open');
    }
  });
});

sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (window.innerWidth >= 900) {
    return;
  }
  if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
    sidebar.classList.remove('open');
  }
});

async function loadProfileData() {
  setBanner('Loading your data...');

  const [personRes, birthRes, medicalRes,marriageRes] = await Promise.allSettled([
    apiFetch('/api/person/me', 'GET', null),
    apiFetch('/api/birth_records/me', 'GET', null),
    apiFetch('/api/medical_records/me', 'GET', null),
    apiFetch('/api/marriage/me', 'GET', null)
  ]);

  const errors = [];

  if (personRes.status === 'fulfilled' && !personRes.value?.error) {
    renderPerson(personRes.value);
  } else {
    errors.push('personal info');
  }

  if (birthRes.status === 'fulfilled' && !birthRes.value?.error) {
    renderBirth(birthRes.value);
  } else {
    renderBirth(null);
    errors.push('birth record');
  }

  if (medicalRes.status === 'fulfilled' && !medicalRes.value?.error) {
    renderMedical(medicalRes.value);
  } else {
    renderMedical(null);
    errors.push('medical record');
  }
  if (marriageRes.status === 'fulfilled' && !marriageRes.value?.error) {
    renderMarriage(marriageRes.value);
  } else {
    renderMarriage(null);
    errors.push('medical record');
  }
  if (errors.length === 0) {
    setBanner('Your records are loaded successfully.', 'success');
    return;
  }

  if (errors.length < 3) {
    setBanner(`Loaded with partial data. Missing: ${errors.join(', ')}.`, 'error');
    return;
  }

  setBanner('Could not load records. Check login token or API server.', 'error');
}

loadProfileData();
