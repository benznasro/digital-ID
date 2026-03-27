"""
Populate the Digital ID PostgreSQL schema with realistic dummy data.

What this script fills:
- roles
- person
- users
- marriage
- birth_records
- medical_records
- education
- employment
- salary_audit (via salary updates trigger)
- assets
- passports
- criminal_records
- death_records (with side-effects via death trigger)
- act_number_tracker
- marriage_audit / birth_records_log (via triggers)

Run:
    pip install faker psycopg2-binary
    python "database\\python _scripts\\populate_children.py"
"""

import os
import sys
import random
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from collections import defaultdict

import psycopg2
from psycopg2.extras import execute_values
from faker import Faker


DATABASE = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "dbname": os.getenv("DB_NAME", "digital_id"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", ""),
}

# bcrypt hash for plain password: password
DEFAULT_PASSWORD_HASH = "$2b$12$jL0MZV.okNAMo8YO2Wpa.OmLHWLCZPuST42JePt2oWD7L.NBdSTnG"

FAKE = Faker(["fr_FR", "en_US"])
TODAY = date.today()

ROLE_NAMES = [
    "citizen",
    "hospital",
    "police",
    "government",
    "admin",
    "Marriage_Notary",
]

WILAYA_CODES = [f"{i:02d}" for i in range(1, 59)]
COMMUNE_CODES = [f"{i:04d}" for i in range(1, 200)]


@dataclass
class PersonRow:
    id: int
    gender: bool
    dob: date
    first_name: str
    last_name: str


def random_date(start: date, end: date) -> date:
    if start >= end:
        return start
    return start + timedelta(days=random.randint(0, (end - start).days))


def slug(text: str) -> str:
    return "".join(ch.lower() for ch in text if ch.isalnum())


def maybe_null(value, p_null: float):
    return None if random.random() < p_null else value


def choose_blood_type() -> str:
    weighted = (
        ["O+"] * 37
        + ["A+"] * 34
        + ["B+"] * 10
        + ["AB+"] * 4
        + ["O-"] * 7
        + ["A-"] * 6
        + ["B-"] * 1
        + ["AB-"] * 1
    )
    return random.choice(weighted)


def ensure_roles(cur) -> dict:
    execute_values(
        cur,
        "INSERT INTO roles (name) VALUES %s ON CONFLICT (name) DO NOTHING",
        [(r,) for r in ROLE_NAMES],
    )
    cur.execute("SELECT id, name FROM roles")
    return {name: role_id for role_id, name in cur.fetchall()}


def truncate_all(cur):
    ordered_tables = [
        "birth_records_log",
        "marriage_audit",
        "salary_audit",
        "death_records",
        "criminal_records",
        "passports",
        "assets",
        "employment",
        "education",
        "medical_records",
        "birth_records",
        "marriage",
        "users",
        "person",
        "act_number_tracker",
    ]

    existing = []
    for table_name in ordered_tables:
        cur.execute("SELECT to_regclass(%s)", (f"public.{table_name}",))
        if cur.fetchone()[0] is not None:
            existing.append(table_name)

    if existing:
        cur.execute(f"TRUNCATE TABLE {', '.join(existing)} RESTART IDENTITY CASCADE;")


def ensure_required_tables(cur):
    required_tables = [
        "roles",
        "person",
        "users",
        "marriage",
        "marriage_audit",
        "birth_records",
        "birth_records_log",
        "medical_records",
        "education",
        "employment",
        "salary_audit",
        "assets",
        "passports",
        "criminal_records",
        "death_records",
        "act_number_tracker",
    ]

    missing = []
    for table_name in required_tables:
        cur.execute("SELECT to_regclass(%s)", (f"public.{table_name}",))
        if cur.fetchone()[0] is None:
            missing.append(table_name)

    if missing:
        missing_text = ", ".join(missing)
        raise RuntimeError(
            "Schema is incomplete. Missing required tables: "
            f"{missing_text}. Initialize database first, then run seeder."
        )


def create_people(cur, target_adults: int = 3200):
    national_id = 1_000_000_000

    rows = []
    for i in range(target_adults):
        is_male = (i % 2 == 0)
        first = FAKE.first_name_male() if is_male else FAKE.first_name_female()
        last = FAKE.last_name()
        dob = random_date(date(1950, 1, 1), date(2005, 12, 31))

        email = maybe_null(f"{slug(first)}.{slug(last)}.{i}@mail.dz", 0.1)
        phone = maybe_null(f"0{random.randint(500000000, 799999999)}", 0.08)

        rows.append(
            (
                national_id,
                first,
                last,
                email,
                dob,
                phone,
                is_male,
                None,
                None,
                "single",
            )
        )
        national_id += 1

    execute_values(
        cur,
        """
        INSERT INTO person (
            national_id, first_name, last_name, email, date_of_birth,
            phone_number, gender, dad_id, mom_id, marital_status
        ) VALUES %s
        RETURNING id, gender, date_of_birth, first_name, last_name
        """,
        rows,
        page_size=1000,
    )

    adults = [PersonRow(*r) for r in cur.fetchall()]
    males = [p for p in adults if p.gender]
    females = [p for p in adults if not p.gender]

    random.shuffle(males)
    random.shuffle(females)

    return adults, males, females, national_id


def create_users(cur, role_map: dict, adults: list[PersonRow]):
    system_users = []

    # admin
    system_users.append((
        "admin_main",
        DEFAULT_PASSWORD_HASH,
        role_map["admin"],
        None,
        None,
        None,
    ))

    # government + police
    for i in range(1, 4):
        system_users.append((
            f"gov_{i}",
            DEFAULT_PASSWORD_HASH,
            role_map["government"],
            None,
            random.choice(WILAYA_CODES),
            random.choice(COMMUNE_CODES),
        ))
        system_users.append((
            f"police_{i}",
            DEFAULT_PASSWORD_HASH,
            role_map["police"],
            None,
            random.choice(WILAYA_CODES),
            random.choice(COMMUNE_CODES),
        ))

    # hospitals + notaries
    for i in range(1, 9):
        system_users.append((
            f"hospital_{i}",
            DEFAULT_PASSWORD_HASH,
            role_map["hospital"],
            None,
            random.choice(WILAYA_CODES),
            random.choice(COMMUNE_CODES),
        ))
    for i in range(1, 8):
        system_users.append((
            f"notary_{i}",
            DEFAULT_PASSWORD_HASH,
            role_map["Marriage_Notary"],
            None,
            random.choice(WILAYA_CODES),
            random.choice(COMMUNE_CODES),
        ))

    execute_values(
        cur,
        """
        INSERT INTO users (username, password, role_id, person_id, wilaya_code, commune_code)
        VALUES %s
        RETURNING id, username, role_id
        """,
        system_users,
    )
    created = cur.fetchall()

    hospitals = [u for u in created if u[2] == role_map["hospital"]]
    notaries = [u for u in created if u[2] == role_map["Marriage_Notary"]]

    # citizen users linked to people
    citizen_sample = random.sample(adults, min(500, len(adults)))
    citizen_rows = []
    for i, p in enumerate(citizen_sample, start=1):
        citizen_rows.append((
            f"citizen_{p.id}_{i}",
            DEFAULT_PASSWORD_HASH,
            role_map["citizen"],
            p.id,
            None,
            None,
        ))

    execute_values(
        cur,
        """
        INSERT INTO users (username, password, role_id, person_id, wilaya_code, commune_code)
        VALUES %s
        ON CONFLICT (username) DO NOTHING
        """,
        citizen_rows,
        page_size=500,
    )

    return hospitals, notaries


def create_marriages(cur, males: list[PersonRow], females: list[PersonRow], notary_ids: list[int]):
    couples = min(len(males), len(females), 1300)
    marriages = []

    female_pool = females[:]
    random.shuffle(female_pool)
    wife_idx = 0
    candidate_witness_ids = [p.id for p in males] + [p.id for p in females]

    for h in males[:couples]:
        if wife_idx >= len(female_pool):
            break

        w = female_pool[wife_idx]
        wife_idx += 1

        min_date = max(h.dob + timedelta(days=18 * 365), w.dob + timedelta(days=18 * 365))
        marriage_date = random_date(min_date, min(TODAY, min_date + timedelta(days=20 * 365)))

        is_divorced = random.random() < 0.18
        is_death_ended = False

        end_marriage_time = None
        end_reason = None
        valid = True

        if is_divorced:
            valid = False
            end_marriage_time = random_date(marriage_date + timedelta(days=180), TODAY)
            end_reason = random.choice(["divorce", "annulment", "Khula"])

        witness_choices = [pid for pid in candidate_witness_ids if pid not in (h.id, w.id)]
        witness_1 = random.choice(witness_choices) if witness_choices and random.random() > 0.25 else None
        witness_2_pool = [pid for pid in witness_choices if pid != witness_1]
        witness_2 = random.choice(witness_2_pool) if witness_2_pool and random.random() > 0.35 else None

        marriages.append((
            h.id,
            w.id,
            marriage_date,
            valid,
            end_marriage_time,
            end_reason,
            witness_1,
            witness_2,
            round(random.uniform(10000, 900000), 2),
            random.choice(notary_ids),
            is_death_ended,
        ))

    execute_values(
        cur,
        """
        INSERT INTO marriage (
            husband_id, wife_id, marriage_date, valid,
            end_marriage_time, end_reason,
            witness_1_id, witness_2_id, dowry_amount, notary_id
        ) VALUES %s
        RETURNING id, husband_id, wife_id, marriage_date, valid
        """,
        [m[:-1] for m in marriages],
        page_size=500,
    )

    created = cur.fetchall()

    cur.execute(
        """
        UPDATE person p
        SET marital_status = CASE
            WHEN m.valid = true THEN 'married'
            ELSE 'divorced'
        END
        FROM marriage m
        WHERE p.id = m.husband_id OR p.id = m.wife_id
        """
    )

    return created


def create_children_and_births(cur, marriages, next_nid: int, hospital_ids: list[int]):
    child_rows = []
    birth_rows = []

    birth_cert = 5_000_000_000

    for marriage_id, husband_id, wife_id, marriage_date, valid in marriages:
        if isinstance(marriage_date, datetime):
            marriage_date = marriage_date.date()

        r = random.random()
        if r < 0.08:
            count = 0
        elif r < 0.28:
            count = 1
        elif r < 0.54:
            count = 2
        elif r < 0.76:
            count = 3
        elif r < 0.90:
            count = 4
        else:
            count = random.randint(5, 7)

        for _ in range(count):
            dob = random_date(marriage_date + timedelta(days=260), min(TODAY, marriage_date + timedelta(days=22 * 365)))
            is_male = random.random() < 0.51
            first = FAKE.first_name_male() if is_male else FAKE.first_name_female()
            last = FAKE.last_name()

            child_rows.append((
                next_nid,
                first,
                last,
                maybe_null(f"{slug(first)}.{slug(last)}.{next_nid}@mail.dz", 0.97),
                dob,
                maybe_null(f"0{random.randint(500000000, 799999999)}", 0.995),
                is_male,
                husband_id,
                wife_id,
                "single",
                marriage_id,
            ))
            next_nid += 1

    if not child_rows:
        return next_nid

    execute_values(
        cur,
        """
        INSERT INTO person (
            national_id, first_name, last_name, email, date_of_birth,
            phone_number, gender, dad_id, mom_id, marital_status
        ) VALUES %s
        RETURNING id
        """,
        [row[:-1] for row in child_rows],
        page_size=1000,
    )
    child_ids = [r[0] for r in cur.fetchall()]

    for inserted_id, src in zip(child_ids, child_rows):
        marriage_id = src[-1]
        dob = src[4]
        birth_rows.append((
            birth_cert,
            inserted_id,
            marriage_id,
            random.choice([
                "CHU Oran",
                "CHU Bab El Oued",
                "Mustapha Pacha Hospital",
                "EHS Mother and Child",
                "Regional General Hospital",
            ]),
            f"Dr. {FAKE.last_name()}",
            round(random.uniform(2.2, 4.7), 2),
            datetime.combine(dob, datetime.min.time()) + timedelta(hours=random.randint(0, 23), minutes=random.randint(0, 59)),
            random.choice(WILAYA_CODES),
            random.choice(COMMUNE_CODES),
            random.randint(6, 10),
        ))
        birth_cert += 1

    execute_values(
        cur,
        """
        INSERT INTO birth_records (
            birth_certificate_no, child_id, marriage_id,
            hospital_name, doctor_name, birth_weight_kg,
            birth_date_time, wilaya_code, commune_code, apgar_score
        ) VALUES %s
        """,
        birth_rows,
        page_size=1000,
    )

    # Trigger some UPDATE audit records
    cur.execute(
        """
        UPDATE birth_records
        SET doctor_name = doctor_name || ' (reviewed)'
        WHERE id IN (
          SELECT id FROM birth_records ORDER BY random() LIMIT 120
        )
        """
    )

    # Stamp app user ids for birth logs when missing
    if hospital_ids:
        cur.execute(
            """
            UPDATE birth_records_log
            SET changed_by_user_id = %s
            WHERE changed_by_user_id IS NULL
            """,
            (random.choice(hospital_ids),),
        )

    return next_nid


def create_medical_records(cur):
    cur.execute("SELECT id, gender, date_of_birth FROM person")
    people = cur.fetchall()

    rows = []
    for pid, gender, dob in people:
        age = max(0, int((TODAY - dob).days / 365.25)) if dob else random.randint(0, 90)

        if gender is True:
            height = round(random.uniform(160, 193), 1)
            weight = round(random.uniform(55, 110), 1)
        else:
            height = round(random.uniform(148, 182), 1)
            weight = round(random.uniform(45, 95), 1)

        if age < 12:
            height = round(random.uniform(70, 150), 1)
            weight = round(random.uniform(8, 50), 1)

        rows.append((
            pid,
            choose_blood_type(),
            height,
            weight,
            random.random() < (0.25 if age > 20 else 0.01),
            maybe_null(random.choice([
                "hypertension",
                "asthma",
                "diabetes type 2",
                "thyroid disorder",
                "none",
            ]), 0.6),
            random_date(max(dob + timedelta(days=3650), date(2010, 1, 1)) if dob else date(2010, 1, 1), TODAY),
        ))

    execute_values(
        cur,
        """
        INSERT INTO medical_records (
          person_id, blood_type, height_cm, weight_kg,
          smoker, chronic_conditions, last_checkup_date
        ) VALUES %s
        """,
        rows,
        page_size=1000,
    )


def create_education(cur):
    cur.execute(
        """
        SELECT id, date_of_birth
        FROM person
        WHERE date_of_birth <= %s
        """,
        (date(TODAY.year - 18, TODAY.month, TODAY.day),),
    )
    adults = cur.fetchall()

    universities = [
        "University of Algiers",
        "University of Oran",
        "USTHB",
        "University of Constantine",
        "University of Tlemcen",
        "ENSA",
    ]

    majors = [
        "Computer Science",
        "Civil Engineering",
        "Medicine",
        "Law",
        "Economics",
        "Business Administration",
        "Mathematics",
        "Physics",
        "Architecture",
        "Nursing",
    ]

    rows = []
    for pid, dob in adults:
        if random.random() > 0.64:
            continue

        start_year = max(dob.year + 18, 1990)
        start = random_date(date(start_year, 9, 1), min(TODAY, date(start_year + 8, 9, 1)))
        grad = maybe_null(random_date(start + timedelta(days=3 * 365), min(TODAY, start + timedelta(days=7 * 365))), 0.18)

        rows.append((
            pid,
            random.choice(universities),
            random.choice(majors),
            random.choice(["Bachelor", "Master", "PhD", "Licence", "Engineer"]),
            round(random.uniform(2.1, 4.0), 2),
            random.choice(["full-time", "part-time", "distance"]),
            start,
            grad,
            maybe_null(f"https://certificates.example/{pid}", 0.55),
            random.random() < 0.72,
        ))

    if rows:
        execute_values(
            cur,
            """
            INSERT INTO education (
              person_id, university_name, major, degree_type, gpa,
              study_mode, start_date, graduation_date, certificate_url, is_verified
            ) VALUES %s
            """,
            rows,
            page_size=1000,
        )


def create_employment_and_audit(cur):
    cur.execute(
        """
        SELECT id, date_of_birth FROM person
        WHERE date_of_birth <= %s
        """,
        (date(TODAY.year - 18, TODAY.month, TODAY.day),),
    )
    adults = cur.fetchall()

    titles = [
        "Software Engineer",
        "Nurse",
        "Teacher",
        "Accountant",
        "Civil Engineer",
        "Doctor",
        "Project Manager",
        "Police Officer",
        "Analyst",
        "HR Specialist",
    ]

    departments = ["IT", "Health", "Finance", "Education", "Operations", "Legal", "Public Service"]
    work_types = ["full-time", "part-time", "contract", "temporary"]

    employed_ids = []
    rows = []
    for pid, dob in adults:
        if random.random() > 0.72:
            continue

        start = random_date(max(dob + timedelta(days=18 * 365), date(2000, 1, 1)), TODAY)
        active = random.random() < 0.78
        end_d = None if active else maybe_null(random_date(start + timedelta(days=120), TODAY), 0.1)

        rows.append((
            pid,
            random.randint(1, 400),
            random.choice(titles),
            random.choice(departments),
            random.choice(work_types),
            round(random.uniform(30000, 420000), 2),
            active,
            start,
            end_d,
            None,
            random.choice(["Algiers", "Oran", "Annaba", "Constantine", "Blida", "Setif"]),
        ))

    if not rows:
        return

    execute_values(
        cur,
        """
        INSERT INTO employment (
          person_id, company_id, job_title, department, employment_type,
          salary, is_active, start_date, end_date, manager_id, work_location
        ) VALUES %s
        RETURNING id
        """,
        rows,
        page_size=1000,
    )
    employment_ids = [r[0] for r in cur.fetchall()]

    # Trigger salary_audit by changing salaries in a subset
    if employment_ids:
        sample = random.sample(employment_ids, min(420, len(employment_ids)))
        cur.execute(
            """
            UPDATE employment
            SET salary = salary * (1 + (random() * 0.15)::numeric)
            WHERE id = ANY(%s)
            """,
            (sample,),
        )


def ensure_salary_audit_not_empty(cur):
    cur.execute("SELECT to_regclass('public.salary_audit')")
    if cur.fetchone()[0] is None:
        return

    cur.execute("SELECT COUNT(*) FROM salary_audit")
    if cur.fetchone()[0] > 0:
        return

    # Fallback for DB instances where salary audit trigger is missing.
    cur.execute(
        """
        INSERT INTO salary_audit (employment_id, old_salary, new_salary, changed_at, changed_by_user)
        SELECT
            e.id,
            round((e.salary / (1 + (random() * 0.12)))::numeric, 2) AS old_salary,
            e.salary AS new_salary,
            NOW() - (random() * interval '720 days') AS changed_at,
            'seed-script'
        FROM employment e
        ORDER BY random()
        LIMIT 350
        """
    )


def create_assets(cur):
    cur.execute("SELECT id, date_of_birth FROM person")
    people = cur.fetchall()

    types = ["car", "land", "house", "apartment", "shop", "farm equipment", "motorbike"]
    rows = []
    reg_counter = 10_000

    for pid, dob in people:
        if random.random() > 0.42:
            continue

        asset_count = 1 if random.random() < 0.8 else random.randint(2, 4)
        for _ in range(asset_count):
            date_owned = random_date(max(dob + timedelta(days=18 * 365), date(1995, 1, 1)), TODAY)
            rows.append((
                pid,
                random.choice(types),
                f"REG-{reg_counter}",
                datetime.combine(date_owned, datetime.min.time()),
                round(random.uniform(80000, 8_000_000), 2),
            ))
            reg_counter += 1

    if rows:
        execute_values(
            cur,
            """
            INSERT INTO assets (
              owner_id, asset_type, registration_number, date_owned, estimated_value
            ) VALUES %s
            """,
            rows,
            page_size=1000,
        )


def create_passports(cur):
    cur.execute("SELECT id, date_of_birth FROM person")
    people = cur.fetchall()

    rows = []
    seq = 100000
    for pid, dob in people:
        if random.random() > 0.56:
            continue
        issue = random_date(max(dob + timedelta(days=16 * 365), date(2000, 1, 1)), TODAY)
        expiry = issue + timedelta(days=random.choice([5 * 365, 10 * 365]))
        rows.append((
            pid,
            f"P{seq}",
            issue,
            expiry,
            True,
        ))
        seq += 1

    if rows:
        execute_values(
            cur,
            """
            INSERT INTO passports (person_id, passport_number, issue_date, expiry_date, is_active)
            VALUES %s
            """,
            rows,
            page_size=1000,
        )


def create_criminal_records(cur):
    cur.execute("SELECT id, date_of_birth FROM person")
    people = cur.fetchall()

    violations = [
        "traffic offense",
        "theft",
        "fraud",
        "public disturbance",
        "property damage",
        "tax evasion",
    ]
    dispositions = ["pending", "closed", "convicted", "dismissed", "under review"]

    rows = []
    cno = 200000
    for pid, dob in people:
        age = int((TODAY - dob).days / 365.25)
        if age < 18 or random.random() > 0.055:
            continue

        occ = random_date(date(max(2000, dob.year + 18), 1, 1), TODAY)
        filing = random_date(occ, TODAY)

        rows.append((
            pid,
            f"CR-{cno}",
            random.random() > 0.18,
            random.choice(violations),
            random.choice(dispositions),
            FAKE.sentence(nb_words=random.randint(7, 16)),
            datetime.combine(occ, datetime.min.time()),
            datetime.combine(filing, datetime.min.time()),
            round(random.uniform(0, 200000), 2),
            maybe_null(FAKE.sentence(nb_words=10), 0.5),
            random.choice(["Algiers", "Oran", "Constantine", "Annaba", "Setif", "Blida"]),
            random.random() < 0.09,
        ))
        cno += 1

    if rows:
        execute_values(
            cur,
            """
            INSERT INTO criminal_records (
              person_id, case_number, status, violation_type, disposition,
              description, occurrence_date, filing_date, fine_amount,
              sentence_details, location_details, is_expunged
            ) VALUES %s
            """,
            rows,
            page_size=1000,
        )


def create_death_records(cur, hospital_user_ids: list[int]):
    cur.execute(
        """
        SELECT p.id, p.date_of_birth
        FROM person p
        LEFT JOIN death_records d ON d.person_id = p.id
        WHERE d.person_id IS NULL
        """
    )
    people = cur.fetchall()

    doctor_candidates = [r[0] for r in random.sample(people, min(200, len(people)))] if people else []
    rows = []

    for pid, dob in people:
        age = int((TODAY - dob).days / 365.25)
        if age < 18:
            continue

        if age < 40:
            p_dead = 0.01
        elif age < 60:
            p_dead = 0.04
        elif age < 80:
            p_dead = 0.15
        else:
            p_dead = 0.42

        if random.random() > p_dead:
            continue

        death_day = random_date(max(dob + timedelta(days=18 * 365), date(2000, 1, 1)), TODAY)
        rows.append((
            pid,
            datetime.combine(death_day, datetime.min.time()) + timedelta(hours=random.randint(0, 23), minutes=random.randint(0, 59)),
            random.choice(["Algiers", "Oran", "Annaba", "Constantine", "Setif"]),
            random.choice(["heart disease", "stroke", "cancer", "road accident", "respiratory failure", "natural causes"]),
            maybe_null(random.choice(doctor_candidates), 0.55) if doctor_candidates else None,
            maybe_null(random.choice(["I21.9", "I64", "C80", "J96", "V89", "R54"]), 0.35),
            None,
            random.random() < 0.7,
            random.choice(hospital_user_ids) if hospital_user_ids else None,
        ))

    if rows:
        execute_values(
            cur,
            """
            INSERT INTO death_records (
              person_id, death_date, place_of_death, cause_of_death,
              doctor_id, icd_10_code, kin_contact_id,
              notified_next_of_kin, hospital_user_id
            ) VALUES %s
            ON CONFLICT (person_id) DO NOTHING
            """,
            rows,
            page_size=500,
        )


def populate_act_number_tracker(cur):
    cur.execute(
        """
        INSERT INTO act_number_tracker (wilaya_code, commune_code, birth_year, last_act_no)
        SELECT
          COALESCE(wilaya_code, '00')::bpchar,
          COALESCE(commune_code, '0000')::bpchar,
          to_char(birth_date_time, 'YY')::bpchar,
          COUNT(*)::int
        FROM birth_records
        GROUP BY 1,2,3
        ON CONFLICT (wilaya_code, commune_code, birth_year)
        DO UPDATE SET last_act_no = EXCLUDED.last_act_no
        """
    )


def print_counts(cur):
    tables = [
        "roles",
        "person",
        "users",
        "marriage",
        "marriage_audit",
        "birth_records",
        "birth_records_log",
        "medical_records",
        "education",
        "employment",
        "salary_audit",
        "assets",
        "passports",
        "criminal_records",
        "death_records",
        "act_number_tracker",
    ]

    print("\n=== Seeded Row Counts ===")
    for t in tables:
        cur.execute(f"SELECT COUNT(*) FROM {t}")
        count = cur.fetchone()[0]
        print(f"{t:20s} : {count}")


def main() -> None:
    random.seed(42)
    Faker.seed(42)

    try:
        conn = psycopg2.connect(**DATABASE)
    except Exception as exc:
        print("Failed to connect to PostgreSQL:", exc, file=sys.stderr)
        sys.exit(1)

    try:
        with conn:
            with conn.cursor() as cur:
                print("Resetting and seeding tables...")
                ensure_required_tables(cur)
                truncate_all(cur)
                role_map = ensure_roles(cur)

                adults, males, females, next_nid = create_people(cur, target_adults=3200)
                hospitals, notaries = create_users(cur, role_map, adults)

                hospital_ids = [u[0] for u in hospitals]
                notary_ids = [u[0] for u in notaries]

                if not notary_ids:
                    raise RuntimeError("No notary users available for marriage generation")

                # marriage audit user context
                cur.execute("SELECT set_config('app.current_user_id', %s, false)", (str(random.choice(notary_ids)),))
                marriages = create_marriages(cur, males, females, notary_ids)

                # birth audit user context
                if hospital_ids:
                    cur.execute("SELECT set_config('app.current_user_id', %s, false)", (str(random.choice(hospital_ids)),))
                next_nid = create_children_and_births(cur, marriages, next_nid, hospital_ids)

                create_medical_records(cur)
                create_education(cur)
                create_employment_and_audit(cur)
                ensure_salary_audit_not_empty(cur)
                create_assets(cur)
                create_passports(cur)
                create_criminal_records(cur)
                create_death_records(cur, hospital_ids)
                populate_act_number_tracker(cur)

                print_counts(cur)

                print("\nDone. Dummy data generation completed successfully.")
                print("Default login password for seeded users: password")

    except Exception as exc:
        print("Seeding failed:", exc, file=sys.stderr)
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
