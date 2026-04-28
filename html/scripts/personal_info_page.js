import { apiFetch, DEFAULT_PROFILE_PHOTO_URL, getMyPhotoUrl } from "./utils.js";

const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarLinks = Array.from(document.querySelectorAll(".sidebar-link"));
const sections = Array.from(document.querySelectorAll(".content-section"));
const statusBanner = document.getElementById("statusBanner");
const profilePhoto = document.getElementById("profilePhoto");

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

function renderProfilePhoto(photoUrl) {
  if (!profilePhoto) {
    return;
  }
  profilePhoto.onerror = () => {
    profilePhoto.src = DEFAULT_PROFILE_PHOTO_URL;
  };
  profilePhoto.src = photoUrl || DEFAULT_PROFILE_PHOTO_URL;
}
function isEmptyList(list) {
  return !Array.isArray(list) || list.length === 0 || list[0] == null;
}

function buttonpasspor(passportindx) {
  document.getElementById("passportInfo").innerHTML = `
         <div class="info-row"><span>Full Name Student</span><strong id="FullNamePerson">${fmt(passportindx?.fullNameperson)}</strong></div>
					<div class="info-row"><span>University Name</span><strong id="PassportNumber">${fmt(passportindx?.passport_number)}</strong></div>
					<div class="info-row"><span>Major</span><strong id="IssueDate">${fmt(passportindx?.issue_date)}</strong></div>
					<div class="info-row"><span>Degree Type</span><strong id="ExpiryDate">${fmt(passportindx?.expiry_date)}</strong></div>
					<div class="info-row"><span>Study Mode</span><strong id="IsActive">${fmt(passportindx?.is_active)}</strong></div>
  `;
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
  if (isEmptyList(marriage)) {
    document.getElementById("all-Marriage").innerHTML =
      `<div class="info-row"><p>you not marriage</p></div>`;
  } else {
    const display = document.querySelector("#all-Marriage");
    let marriageHtml = "";
    for (let i = 0; i < marriage.length; i++) {
      const marriageindx = marriage[i];
      marriageHtml += `
                <div class="info-card" id="marriage-card-${i}">
                  <div>
                                      <div class="info-row"><span>Full Wife</span><strong id="FullWife${i}">${fmt(marriageindx?.wife_name)}</strong></div>
                  </div>
                  <div class="off_clock1" id="marriage-details-${i}">
                    <div class="info-row"><span>Contract</span><strong id="Contract_no${i}">${fmt(marriageindx?.contract_no)}</strong></div>
                    <div class="info-row"><span>Valid </span><strong id="Valid${i}">${fmt(marriageindx?.valid)}</strong></div>
                    <div class="info-row"><span>Divorce Date</span><strong id="DivorceDate${i}">${formatDate(marriageindx?.end_marriage_time)}</strong></div>
                    <div class="info-row"><span>Divorce Reason</span><strong id="DivorceReason${i}">${fmt(marriageindx?.end_reason)}</strong></div>
                    <div class="info-row"><span>Marriage Date</span><strong id="MarriageDate${i}">${formatDate(marriageindx?.marriage_date)}</strong></div>
                    <div class="info-row"><span>Witness 1</span><strong id="Witness_1${i}">${fmt(marriageindx?.witness_1_name)}</strong></div>
                    <div class="info-row"><span>Witness 2</span><strong id="Witness_2${i}">${fmt(marriageindx?.witness_2_name)}</strong></div>
                    <div class="info-row"><span>Dowry amount</span><strong id="Dowry_amount${i}">${fmt(marriageindx?.dowry_amount)}</strong></div>
                    <div class="info-row"><span>Notary</span><strong id="Notary${i}">${fmt(marriageindx?.notary_name)}</strong></div>
                  </div>
                </div>
            `;
    }
    display.innerHTML = marriageHtml;
    marriage.forEach((_, i) => {
      document
        .getElementById(`marriage-card-${i}`)
        .addEventListener("click", () => {
          const details = document.querySelector(`#marriage-details-${i}`);
          details.classList.toggle("off_clock1");
        });
    });
  }
}

function renderEducation(education) {
  if (isEmptyList(education)) {
    document.getElementById("all-Education").innerHTML =
      `<div class="info-row"><p>you not education</p></div>`;
  } else {
    const display = document.querySelector("#all-Education");
    let educationhtml = "";
    for (let i = 0; i < education.length; i++) {
      const educationindx = education[i];
      educationhtml += `
                <div class="info-card" id="education-card-${i}">
                    <div>
                      <div class="info-row"><span>Major</span><strong id="Major${i}">${fmt(educationindx?.major)}</strong></div>
                    </div>
			 <div class="off_clock1" id="education-details-${i}">
					<div class="info-row"><span>University Name</span><strong id="UniversityName${i}">${fmt(educationindx?.university_name)}</strong></div>
					<div class="info-row"><span>Degree Type</span><strong id="DegreeType${i}">${fmt(educationindx?.degree_type)}</strong></div>
					<div class="info-row"><span>Study Mode</span><strong id="StudyMode${i}">${fmt(educationindx?.study_mode)}</strong></div>
					<div class="info-row"><span>Start Date</span><strong id="StartDate${i}">${formatDate(educationindx?.start_date)}</strong></div>
					<div class="info-row"><span>Graduation Date</span><strong id="GraduationDate${i}">${formatDate(educationindx?.graduation_date)}</strong></div>
					<div class="info-row"><span>GPA</span><strong id="GPA${i}">${fmt(educationindx?.gpa)}</strong></div>
					<div class="info-row"><span>Certificate</span><strong id="Certificate${i}">${fmt(educationindx?.certificate_url)}</strong></div>
					<div class="info-row"><span>Is Verified</span><strong id="Is_Verified${i}">${fmt(educationindx?.is_verified)}</strong></div>
					<div class="info-row"><span>Created at</span><strong id="Created_at">${fmt(educationindx?.created_at)}</strong></div>          
                  </div>
              `;
    }
    display.innerHTML = educationhtml;
    education.forEach((_, i) => {
      document
        .getElementById(`education-card-${i}`)
        .addEventListener("click", () => {
          const details = document.querySelector(`#education-details-${i}`);
          details.classList.toggle("off_clock1");
        });
    });
  }
}

function renderPassport(passport) {
  if (isEmptyList(passport)) {
    document.getElementById("passportInfo").innerHTML =
      `<div class="info-row"><p>you not have Passport</p></div>`;
  } else if (passport.length === 1) {
    setText("FullNamePerson", fmt(passport[0]?.fullNameperson));
    setText("PassportNumber", fmt(passport[0]?.passport_number));
    setText("IssueDate", formatDate(passport[0]?.issue_date));
    setText("ExpiryDate", formatDate(passport[0]?.expiry_date));
    setText("IsActive", fmt(passport[0]?.is_active));
  } else {
    let infocard = "";
    for (let i = 0; i < passport.length; i++) {
      const passportindx = passport[i];
      infocard += `
          <div class="info-row">
            <button class="info-row" id="biometrucs${i}">
              <span>Passport</span>
              <strong id="Fullwife">${fmt(passportindx?.certificate_url)}</strong>
            </button>
          </div>
      `;
    }
    document.getElementById("passportInfo").innerHTML = infocard;
    passport.forEach((passportindx, i) => {
      document
        .querySelector(`#biometrucs${i}`)
        .addEventListener("click", () => {
          buttonpasspor(passportindx);
        });
    });
  }
}

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

  const [
    personRes,
    birthRes,
    medicalRes,
    marriageRes,
    educationRes,
    passportRes,
    myPhotoUrlRes,
  ] = await Promise.allSettled([
    apiFetch("/api/person/me", "GET", null),
    apiFetch("/api/birth_records/me", "GET", null),
    apiFetch("/api/medical_records/me", "GET", null),
    apiFetch("/api/marriage/me", "GET", null),
    apiFetch("/api/education/me", "GET", null),
    apiFetch("/api/passport/me", "GET", null),
    getMyPhotoUrl(),
  ]);
  console.log({
    personRes,
    birthRes,
    medicalRes,
    marriageRes,
    educationRes,
    passportRes,
    myPhotoUrlRes,
  });

  if (myPhotoUrlRes.status === "fulfilled") {
    renderProfilePhoto(myPhotoUrlRes.value);
  } else {
    renderProfilePhoto(DEFAULT_PROFILE_PHOTO_URL);
  }

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
