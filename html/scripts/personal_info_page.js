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
  setText('medicalBloodType', fmt(medical?.blood_type));
  setText('medicalHeight', fmt(medical?.height_cm));
  setText('medicalWeight', fmt(medical?.weight_kg));
  setText('medicalSmoker', smokerLabel(medical?.smoker));
  setText('medicalConditions', fmt(medical?.chronic_conditions));
  setText('medicalCheckup', formatDate(medical?.last_checkup_date));
}
function renderMarriage(marriage){
  const fullNameHesbend = `${fmt(marriage-hesbend?.first_name)} ${fmt(marriage-hesbend?.last_name)}`.trim();
  const fullNameWife = `${fmt(marriage-wife?.first_name)} ${fmt(marriage-wife?.last_name)}`.trim();
  const fullwitness_1 = `${fmt(marriage-witness_1?.first_name)} ${fmt(marriage-witness_1?.last_name)}`.trim();
  const fullwitness_2 = `${fmt(marriage-witness_1?.first_name)} ${fmt(marriage-witness_1?.last_name)}`.trim();
  setText('FullHesbend', fmt(marriage?.fullNameHesbend));
  setText('FullWife', fmt(marriage?.fullNameWife));
  setText('Contract_no', fmt(marriage?.contract_no));
  setText('Valid', fmt(marriage?.valid));
  setText('DivorceDate', formatDate(marriage?.end_reason));
  setText('MarriageDate', formatDate(marriage?.marriagedate));
  setText('EndMarriageTime', formatDate(marriage?.end_marriage_time));
  setText('Witness_1', fmt(marriage?.fullwitness_1));
  setText('Witness_2', fmt(marriage?.fullwitness_1));
  setText('Dowry_amount', fmt(marriage?.dowry_amount));
  setText('Notary', fmt(marriage?.fullNamenotary));
}
function renderEducation(education) {
  const fullNamestudent = `${fmt(education-student?.first_name)} ${fmt(education-student?.last_name)}`.trim();
  setText('FullNameStudent', fmt(education?.fullNamestudent));
  setText('UniversityName', fmt(education?.university_name));
  setText('Major', fmt(education?.major));
  setText('DegreeType', fmt(education?.degree_type));
  setText('StudyMode', fmt(education?.study_mode));
  setText('StartDate', smokerLabel(education?.start_date));
  setText('GraduationDate', fmt(education?.graduation_date));
  setText('Certificate', formatDate(education?.certificate_url));
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
    apiFetch('/api/marriage/me', 'GET', null),
    apiFetch('/api/education/me', 'GET', null)
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
    errors.push('marriage ');
  }
    if (educationRes.status === 'fulfilled' && !educationRes.value?.error) {
    renderEducation(educationRes.value);
  } else {
    renderEducation(null);
    errors.push('education ');
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
