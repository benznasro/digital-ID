import { apiFetch } from "./utils.js";

const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarLinks = Array.from(document.querySelectorAll(".sidebar-link"));
const sections = Array.from(document.querySelectorAll(".content-section"));
const statusBanner = document.getElementById("statusBanner");

function setBanner(message, type = "") {
  statusBanner.classList.remove("success", "error");
  if (type) {
    statusBanner.classList.add(type);
  }
  statusBanner.textContent = message;
}

function formatDate(value) {
  if (!value) {
    return "Not available";
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return String(value);
  }
  return d.toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) {
    return "Not available";
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) {
    return String(value);
  }
  return d.toLocaleString();
}

function fmt(value) {
  return value === null || value === undefined || value === ""
    ? "Not available"
    : String(value);
}

function genderLabel(value) {
  if (value === true) {
    return "Male";
  }
  if (value === false) {
    return "Female";
  }
  return "Not available";
}

function smokerLabel(value) {
  if (value === true) {
    return "Yes";
  }
  if (value === false) {
    return "No";
  }
  return "Not available";
}
function setText(id, value) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = value;
  }
}

function renderPerson(person) {
  const fullName =
    `${fmt(person?.first_name)} ${fmt(person?.last_name)}`.trim();

  setText(
    "overviewFullName",
    fullName === "Not available Not available" ? "Not available" : fullName,
  );
  setText("overviewNationalId", fmt(person?.national_id));
  setText("overviewMarital", fmt(person?.marital_status));
  setText("identityNationalId", fmt(person?.national_id));
  setText("identityFirstName", fmt(person?.first_name));
  setText("identityLastName", fmt(person?.last_name));
  setText("identityDob", formatDate(person?.date_of_birth));
  setText("identityGender", genderLabel(person?.gender));
  setText("identityMarital", fmt(person?.marital_status));
  setText("contactEmail", fmt(person?.email));
  setText("contactPhone", fmt(person?.phone_number));

  // API returns resolved parent names; fall back to legacy id fields if needed.
  setText("familyDad", fmt(person?.father_name ?? person?.dad_id));
  setText("familyMom", fmt(person?.mother_name ?? person?.mom_id));
}

function renderBirth(birth) {
  setText("overviewBirthCertificate", fmt(birth?.birth_certificate_no));
  setText("birthCertificate", fmt(birth?.birth_certificate_no));
  setText("birthDateTime", formatDateTime(birth?.birth_datetime));
  setText("birthHospital", fmt(birth?.hospital_name));
  setText("birthDoctor", fmt(birth?.doctor_name));
  setText("birthWeight", fmt(birth?.birth_weight_kg));
  setText("birthApgar", fmt(birth?.apgar_score));
  setText("birthMarriageId", fmt(birth?.marriage_id));
}

function renderMedical(medical) {
  setText("overviewBloodType", fmt(medical?.blood_type));
  setText("overviewCheckup", formatDate(medical?.last_checkup_date));
  setText("medicalBloodType", fmt(medical?.blood_type));
  setText("medicalHeight", fmt(medical?.height_cm));
  setText("medicalWeight", fmt(medical?.weight_kg));
  setText("medicalSmoker", smokerLabel(medical?.smoker));
  setText("medicalConditions", fmt(medical?.chronic_conditions));
  setText("medicalCheckup", formatDate(medical?.last_checkup_date));
}
function renderMarriage(marriage) {
  if(marriage[0] === null || marriage[0] === undefined || marriage[0] === ""){
    setText("FullHesbend", fmt(marriage[0]?.fullNamehesbend));
    setText("FullWife", formatDate(marriage[0]?.fullNamewife));
    setText("Contract_no", fmt(marriage[0]?.contract_no));
    setText("Valid", fmt(marriage[0]?.valid));
    setText("DivorceDate", fmt(marriage[0]?.end_reason));
    setText("MarriageDate", fmt(marriage[0]?.marriagedate));
    setText("EndMarriageTime", smokerLabel(marriage[0]?.end_marriage_time));
    setText("Witness_1", fmt(marriage[0]?.fullNamewitness_1));
    setText("Witness_2", formatDate(marriage[0]?.fullNamewitness_2));
    setText("Dowry_amount", formatDate(marriage[0]?.dowry_amount));
    setText("Notary", formatDate(marriage[0]?.fullNamenotary));
  }else{
  let infocard=``;
  for(let i=0;i<marriage.length;i++){
    const marriageindx=marriage[i];
    infocard = infocard +
    `
    <div class="info-row"><span>Full Hesbend</span><strong id="FullHesbend">${fmt(marriageindx?.fullNamehesbend)}</strong></div>
    <div class="info-row"><span>Full Wife</span><strong id="FullWife">${fmt(marriageindx?.fullNamewife)}</strong></div>
    <div class="info-row"><span>Contract</span><strong id="Contract_no">${fmt(marriageindx?.contract_no)}</strong></div>
    <div class="info-row"><span>Valid </span><strong id="Valid">${ fmt(marriageindx?.valid)}</strong></div>
    <div class="info-row"><span>Divorce Date</span><strong id="DivorceDate">${formatDate(marriageindx?.end_reason)}</strong></div>
    <div class="info-row"><span>Marriage Date</span><strong id="MarriageDate">${formatDate(marriageindx?.marriagedate)}</strong></div>
    <div class="info-row"><span>End Marriage Time</span><strong id="EndMarriageTime">${formatDate(marriageindx?.end_marriage_time)}</strong></div>
    <div class="info-row"><span>Witness 1</span><strong id="Witness_1">${fmt(marriageindx?.fullNamewitness_1)}</strong></div>
    <div class="info-row"><span>Witness 2</span><strong id="Witness_2">${fmt(marriageindx?.fullNamewitness_2)}</strong></div>
    <div class="info-row"><span>Dowry amount</span><strong id="Dowry_amount">${fmt(marriageindx?.dowry_amount)}</strong></div>
    <div class="info-row"><span>Notary</span><strong id="Notary">${fmt(marriageindx?.fullNamenotary)}</strong></div>
    `
  }
  document.getElementById("marriageInfo").innerHTML=infocard;
  }
}
function renderEducation(education) {
  if(education[0] === null || education[0] === undefined || education[0] === ""){
    setText("FullNameStudent", fmt(education[0]?.fullNamestudent));
    setText("UniversityName", formatDate(education[0]?.university_name));
    setText("Major", fmt(education[0]?.major));
    setText("DegreeType", fmt(education[0]?.degree_type));
    setText("StudyMode", fmt(education[0]?.study_mode));
    setText("StartDate", smokerLabel(education[0]?.start_date));
    setText("GraduationDate", fmt(education[0]?.graduation_date));
    setText("GPA", formatDate(education[0]?.gpa));
    setText("Certificate", formatDate(education[0]?.certificate_url));
    setText("Is_Verified", formatDate(education[0]?.is_verified));
    setText("Created_at", formatDate(education[0]?.created_at));
  }else{
  let infocard=``;
  for(let i=0;i<education.length;i++){
    const educationindx=education[i];
    infocard = infocard +
    `
    <div class="info-row"><span>Full Name Student</span><strong id="FullNameStudent">${fmt(educationindx?.fullNamestudent)}</strong></div>
					<div class="info-row"><span>University Name</span><strong id="UniversityName">${fmt(educationindx?.university_name)}</strong></div>
					<div class="info-row"><span>Major</span><strong id="Major">${fmt(educationindx?.major)}</strong></div>
					<div class="info-row"><span>Degree Type</span><strong id="DegreeType">${fmt(educationindx?.degree_type)}</strong></div>
					<div class="info-row"><span>Study Mode</span><strong id="StudyMode">${fmt(educationindx?.study_mode)}</strong></div>
					<div class="info-row"><span>Start Date</span><strong id="StartDate">${formatDate(educationindx?.start_date)}</strong></div>
					<div class="info-row"><span>Graduation Date</span><strong id="GraduationDate">${formatDate(education?.graduation_date)}</strong></div>
					<div class="info-row"><span>GPA</span><strong id="GPA">${fmt(educationindx?.gpa)}</strong></div>
					<div class="info-row"><span>Certificate</span><strong id="Certificate">${fmt(educationindx?.certificate_url)}</strong></div>
					<div class="info-row"><span>Is Verified</span><strong id="Is_Verified">${fmt(educationindx?.is_verified)}</strong></div>
					<div class="info-row"><span>Created at</span><strong id="Created_at">${fmt(educationindx?.created_at)}</strong></div>
          `
  }
  document.getElementById("educationInfo").innerHTML=infocard
}}
function renderPassport(passport) {
  if(passport[0] === null || passport[0] === undefined || passport[0] === ""){
    setText("FullNamePerson", fmt(passport[0]?.fullNameperson));
    setText("PassportNumber", fmt(passport[0]?.passport_number));
    setText("IssueDate", formatDate(passport[0]?.issue_date));
    setText("ExpiryDate", formatDate(passport[0]?.expiry_date));
    setText("IsActive", fmt(passport[0]?.is_active));
  }else{
  let infocard=``;
  for(let i=0;i<passport.length;i++){
    console.log(passport[i]);
    const passportindx=passport[i];
    infocard = infocard +
    `
          <div class="info-row"><span>Full Name Student</span><strong id="FullNamePerson">${fmt(passportindx?.fullNameperson)}</strong></div>
					<div class="info-row"><span>University Name</span><strong id="PassportNumber">${fmt(passportindx?.passport_number)}</strong></div>
					<div class="info-row"><span>Major</span><strong id="IssueDate">${fmt(passportindx?.issue_date)}</strong></div>
					<div class="info-row"><span>Degree Type</span><strong id="ExpiryDate">${fmt(passportindx?.expiry_date)}</strong></div>
					<div class="info-row"><span>Study Mode</span><strong id="IsActive">${fmt(passportindx?.is_active)}</strong></div>
          `
  }
  document.getElementById("passportInfo").innerHTML=infocard;
}}
function activateSection(sectionName) {
  sidebarLinks.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.section === sectionName);
  });

  sections.forEach((section) => {
    const isTarget = section.id === `section-${sectionName}`;
    section.classList.toggle("active", isTarget);
  });
}

sidebarLinks.forEach((btn) => {
  btn.addEventListener("click", () => {
    activateSection(btn.dataset.section);
    if (window.innerWidth < 900) {
      sidebar.classList.remove("open");
    }
  });
});

sidebarToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

document.addEventListener("click", (e) => {
  if (window.innerWidth >= 900) {
    return;
  }
  if (!sidebar.contains(e.target) && !sidebarToggle.contains(e.target)) {
    sidebar.classList.remove("open");
  }
});

async function loadProfileData() {
  setBanner("Loading your data...");

  const [personRes, birthRes, medicalRes, marriageRes, educationRes,passportRes] =
    await Promise.allSettled([
      apiFetch("/api/person/me", "GET", null),
      apiFetch("/api/birth_records/me", "GET", null),
      apiFetch("/api/medical_records/me", "GET", null),
      apiFetch("/api/marriage/me", "GET", null),
      apiFetch("/api/education/me", "GET", null),
      apiFetch("/api/passport/me", "GET", null),
    ]);
    console.log({ personRes, birthRes, medicalRes, marriageRes, educationRes,passportRes });

  const errors = [];

  if (personRes.status === "fulfilled" && !personRes.value?.error) {
    renderPerson(personRes.value);
  } else {
    errors.push("personal info");
  }

  if (birthRes.status === "fulfilled" && !birthRes.value?.error) {
    renderBirth(birthRes.value);
  } else {
    renderBirth(null);
    errors.push("birth record");
  }

  if (medicalRes.status === "fulfilled" && !medicalRes.value?.error) {
    renderMedical(medicalRes.value);
  } else {
    renderMedical(null);
    errors.push("medical record");
  }
  if (marriageRes.status === "fulfilled" && !marriageRes.value?.error) {
    renderMarriage(marriageRes.value);
  } else {
    renderMarriage(null);
    errors.push("marriage");
  }
  if (educationRes.status === "fulfilled" && !educationRes.value?.error) {
    renderEducation(educationRes.value);
  } else {
    renderEducation(null);
    errors.push("education");
  }
  if (passportRes.status === "fulfilled" && !passportRes.value?.error) {
    renderPassport(passportRes.value);
  } else {
    renderPassport(null);
    errors.push("passport");
  }
  
  if (errors.length === 0) {
    setBanner("Your records are loaded successfully.", "success");
    return;
  }

  if (errors.length < 3) {
    setBanner(
      `Loaded with partial data. Missing: ${errors.join(", ")}.`,
      "error",
    );
    return;
  }

  setBanner(
    "Could not load records. Check login token or API server.",
    "error",
  );
}

loadProfileData();
