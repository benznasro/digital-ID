"""
Populate the Digital ID PostgreSQL schema with realistic linked data.

Highlights:
- Generates a 10-generation family graph with parent-child lineage.
- Ensures every generated child gets a matching birth record.
- Populates all major domain tables with non-trivial, realistic data.
- Works with existing triggers (marriage/birth/death/salary audit).

Run:
    pip install faker psycopg2-binary
    python "database\\python _scripts\\populate_children.py"
"""

from __future__ import annotations

import os
import random
import sys
from dataclasses import dataclass
from datetime import date, datetime, timedelta
from typing import Dict, List, Optional, Sequence, Tuple

import psycopg2
from faker import Faker
from psycopg2.extras import execute_values


DATABASE = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "dbname": os.getenv("DB_NAME", "try2"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", ""),
}

# bcrypt hash for plaintext password: password
DEFAULT_PASSWORD_HASH = "$2b$12$jL0MZV.okNAMo8YO2Wpa.OmLHWLCZPuST42JePt2oWD7L.NBdSTnG"

FAKE = Faker(["fr_FR", "en_US"])
TODAY = date.today()

ROLE_NAMES = ["citizen", "hospital", "police", "government", "admin", "Marriage_Notary"]
WILAYA_CODES = [f"{i:02d}" for i in range(1, 59)]
COMMUNE_CODES = [f"{i:04d}" for i in range(1, 200)]

GENERATIONS = 10
FOUNDER_COUPLES = 220
TARGET_COUPLES_PER_GENERATION = [220, 205, 190, 175, 165, 155, 145, 135, 120, 95]
BASE_BIRTH_YEAR = 1740


@dataclass
class PersonRow:
    id: int
    gender: bool  # True male, False female
    dob: date
    first_name: str
    last_name: str
    dad_id: Optional[int]
    mom_id: Optional[int]


@dataclass
class MarriageRow:
    id: int
    husband_id: int
    wife_id: int
    marriage_date: datetime
    valid: bool


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


def ensure_required_tables(cur) -> None:
    required = [
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
    for table_name in required:
        cur.execute("SELECT to_regclass(%s)", (f"public.{table_name}",))
        if cur.fetchone()[0] is None:
            missing.append(table_name)

    if missing:
        raise RuntimeError(
            "Schema is incomplete. Missing required tables: " + ", ".join(missing)
        )


def truncate_all(cur) -> None:
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
        cur.execute(f"TRUNCATE TABLE {', '.join(existing)} RESTART IDENTITY CASCADE")


def ensure_roles(cur) -> Dict[str, int]:
    execute_values(
        cur,
        "INSERT INTO roles (name) VALUES %s ON CONFLICT (name) DO NOTHING",
        [(r,) for r in ROLE_NAMES],
    )
    cur.execute("SELECT id, name FROM roles")
    return {name: rid for rid, name in cur.fetchall()}


def split_by_gender(people: Sequence[PersonRow]) -> Tuple[List[PersonRow], List[PersonRow]]:
    males = [p for p in people if p.gender]
    females = [p for p in people if not p.gender]
    random.shuffle(males)
    random.shuffle(females)
    return males, females


def insert_people(
    cur,
    rows: Sequence[Tuple[int, str, str, Optional[str], date, Optional[str], bool, Optional[int], Optional[int], str]],
) -> List[PersonRow]:
    if not rows:
        return []

    execute_values(
        cur,
        """
        INSERT INTO person (
            national_id, first_name, last_name, email, date_of_birth,
            phone_number, gender, dad_id, mom_id, marital_status
        ) VALUES %s
        RETURNING id, gender, date_of_birth, first_name, last_name, dad_id, mom_id
        """,
        rows,
        page_size=1000,
    )

    return [PersonRow(*r) for r in cur.fetchall()]


def create_founders(cur, national_id_start: int) -> Tuple[List[PersonRow], int]:
    rows = []
    for i in range(FOUNDER_COUPLES * 2):
        is_male = i % 2 == 0
        first = FAKE.first_name_male() if is_male else FAKE.first_name_female()
        last = FAKE.last_name()

        # Founder generation centered around 1740-1755.
        dob = random_date(date(BASE_BIRTH_YEAR, 1, 1), date(BASE_BIRTH_YEAR + 15, 12, 31))

        rows.append(
            (
                national_id_start,
                first,
                last,
                maybe_null(f"{slug(first)}.{slug(last)}.{national_id_start}@mail.dz", 0.85),
                dob,
                None,
                is_male,
                None,
                None,
                "single",
            )
        )
        national_id_start += 1

    founders = insert_people(cur, rows)
    return founders, national_id_start


def pair_generation(males: Sequence[PersonRow], females: Sequence[PersonRow], max_pairs: int) -> List[Tuple[PersonRow, PersonRow]]:
    available_females = list(females)
    random.shuffle(available_females)

    used_female_ids = set()
    pairs: List[Tuple[PersonRow, PersonRow]] = []

    for husband in males:
        if len(pairs) >= max_pairs:
            break

        h_parents = (husband.dad_id, husband.mom_id)

        wife_choice = None
        for wife in available_females:
            if wife.id in used_female_ids:
                continue
            w_parents = (wife.dad_id, wife.mom_id)
            # Avoid sibling marriages to satisfy incest prevention trigger.
            if h_parents[0] is not None and h_parents == w_parents:
                continue
            wife_choice = wife
            break

        if wife_choice is None:
            continue

        used_female_ids.add(wife_choice.id)
        pairs.append((husband, wife_choice))

    return pairs


def create_users(cur, role_map: Dict[str, int], all_people: Sequence[PersonRow]) -> Tuple[List[int], List[int]]:
    system_users = [
        ("admin_main", DEFAULT_PASSWORD_HASH, role_map["admin"], None, None, None),
    ]

    for i in range(1, 5):
        system_users.append(
            (
                f"gov_{i}",
                DEFAULT_PASSWORD_HASH,
                role_map["government"],
                None,
                random.choice(WILAYA_CODES),
                random.choice(COMMUNE_CODES),
            )
        )
        system_users.append(
            (
                f"police_{i}",
                DEFAULT_PASSWORD_HASH,
                role_map["police"],
                None,
                random.choice(WILAYA_CODES),
                random.choice(COMMUNE_CODES),
            )
        )

    for i in range(1, 13):
        system_users.append(
            (
                f"hospital_{i}",
                DEFAULT_PASSWORD_HASH,
                role_map["hospital"],
                None,
                random.choice(WILAYA_CODES),
                random.choice(COMMUNE_CODES),
            )
        )

    for i in range(1, 11):
        system_users.append(
            (
                f"notary_{i}",
                DEFAULT_PASSWORD_HASH,
                role_map["Marriage_Notary"],
                None,
                random.choice(WILAYA_CODES),
                random.choice(COMMUNE_CODES),
            )
        )

    execute_values(
        cur,
        """
        INSERT INTO users (username, password, role_id, person_id, wilaya_code, commune_code)
        VALUES %s
        RETURNING id, role_id
        """,
        system_users,
    )

    created = cur.fetchall()
    hospital_ids = [uid for uid, rid in created if rid == role_map["hospital"]]
    notary_ids = [uid for uid, rid in created if rid == role_map["Marriage_Notary"]]

    candidate_citizens = [p for p in all_people if TODAY >= p.dob + timedelta(days=18 * 365)]
    citizen_count = min(1200, len(candidate_citizens))
    citizen_rows = []

    for idx, p in enumerate(random.sample(candidate_citizens, citizen_count), start=1):
        citizen_rows.append(
            (
                f"citizen_{p.id}_{idx}",
                DEFAULT_PASSWORD_HASH,
                role_map["citizen"],
                p.id,
                None,
                None,
            )
        )

    if citizen_rows:
        execute_values(
            cur,
            """
            INSERT INTO users (username, password, role_id, person_id, wilaya_code, commune_code)
            VALUES %s
            ON CONFLICT (username) DO NOTHING
            """,
            citizen_rows,
            page_size=1000,
        )

    return hospital_ids, notary_ids


def create_marriages(
    cur,
    pairs: Sequence[Tuple[PersonRow, PersonRow]],
    notary_user_ids: Sequence[int],
    witness_pool_ids: Sequence[int],
    generation_index: int,
) -> List[MarriageRow]:
    if not pairs:
        return []

    rows = []
    for husband, wife in pairs:
        min_date = max(
            husband.dob + timedelta(days=18 * 365),
            wife.dob + timedelta(days=18 * 365),
        )

        # Keep generation progression stable while preserving age realism.
        gen_center_year = BASE_BIRTH_YEAR + generation_index * 28 + 23
        gen_target_date = date(gen_center_year, random.randint(1, 12), random.randint(1, 28))
        start = max(min_date, gen_target_date - timedelta(days=3 * 365))
        end = min(TODAY, gen_target_date + timedelta(days=3 * 365))
        marriage_date = random_date(start, end)

        witness_candidates = [pid for pid in witness_pool_ids if pid not in (husband.id, wife.id)]
        random.shuffle(witness_candidates)
        witness_1 = witness_candidates[0] if witness_candidates else None
        witness_2 = witness_candidates[1] if len(witness_candidates) > 1 else None

        rows.append(
            (
                husband.id,
                wife.id,
                datetime.combine(marriage_date, datetime.min.time()) + timedelta(hours=random.randint(8, 16)),
                True,
                None,
                None,
                witness_1,
                witness_2,
                round(random.uniform(15000, 950000), 2),
                random.choice(notary_user_ids),
            )
        )

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
        rows,
        page_size=500,
    )

    return [MarriageRow(*r) for r in cur.fetchall()]


def create_children_and_births(
    cur,
    marriages: Sequence[MarriageRow],
    generation_index: int,
    next_national_id: int,
    hospital_user_ids: Sequence[int],
) -> Tuple[List[PersonRow], int]:
    if not marriages:
        return [], next_national_id

    # Fixed offset per generation keeps certificate numbers globally unique and readable.
    birth_certificate_base = 5_000_000_000 + generation_index * 1_000_000

    child_insert_rows = []
    child_meta: List[Tuple[int, datetime]] = []  # (marriage_id, birth_datetime)

    for marriage in marriages:
        # 1-4 children, weighted toward 2-3.
        child_count = random.choice([1, 2, 2, 3, 3, 4])
        marriage_day = marriage.marriage_date.date()

        for _ in range(child_count):
            birth_start = marriage_day + timedelta(days=260)
            birth_end = min(TODAY, marriage_day + timedelta(days=12 * 365))
            child_dob = random_date(birth_start, birth_end)
            child_is_male = random.random() < 0.51
            first = FAKE.first_name_male() if child_is_male else FAKE.first_name_female()

            child_insert_rows.append(
                (
                    next_national_id,
                    first,
                    FAKE.last_name(),
                    maybe_null(f"{slug(first)}.{next_national_id}@mail.dz", 0.985),
                    child_dob,
                    None,
                    child_is_male,
                    marriage.husband_id,
                    marriage.wife_id,
                    "single",
                )
            )

            birth_dt = datetime.combine(child_dob, datetime.min.time()) + timedelta(
                hours=random.randint(0, 23), minutes=random.randint(0, 59)
            )
            child_meta.append((marriage.id, birth_dt))
            next_national_id += 1

    children = insert_people(cur, child_insert_rows)

    birth_rows = []
    for idx, child in enumerate(children):
        marriage_id, birth_dt = child_meta[idx]
        birth_rows.append(
            (
                birth_certificate_base + idx,
                child.id,
                marriage_id,
                random.choice(
                    [
                        "CHU Oran",
                        "CHU Bab El Oued",
                        "Mustapha Pacha Hospital",
                        "EHS Mother and Child",
                        "Regional General Hospital",
                        "Ibn Sina Medical Center",
                    ]
                ),
                f"Dr. {FAKE.last_name()}",
                round(random.uniform(2.3, 4.5), 2),
                birth_dt,
                random.choice(WILAYA_CODES),
                random.choice(COMMUNE_CODES),
                random.randint(7, 10),
            )
        )

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

    # Generate birth update audits as well.
    cur.execute(
        """
        UPDATE birth_records
        SET doctor_name = doctor_name || ' (verified)'
        WHERE id IN (
          SELECT id FROM birth_records ORDER BY random() LIMIT 250
        )
        """
    )

    if hospital_user_ids:
        cur.execute(
            """
            UPDATE birth_records_log
            SET changed_by_user_id = %s
            WHERE changed_by_user_id IS NULL
            """,
            (random.choice(hospital_user_ids),),
        )

    return children, next_national_id


def dissolve_some_marriages(cur) -> None:
    # Produce realistic divorce records and marriage audit updates.
    cur.execute(
        """
        UPDATE marriage m
        SET valid = false,
            end_marriage_time = m.marriage_date + (interval '365 days' * (2 + (random() * 18)::int)),
            end_reason = CASE WHEN random() < 0.75 THEN 'divorce' ELSE 'Khula' END
        WHERE m.valid = true
          AND m.marriage_date < NOW() - interval '8 years'
          AND random() < 0.18
        """
    )


def create_medical_records(cur) -> None:
    cur.execute("SELECT id, gender, date_of_birth FROM person")
    people = cur.fetchall()

    rows = []
    chronic = ["hypertension", "asthma", "diabetes type 2", "thyroid disorder", "none"]

    for pid, gender, dob in people:
        age = max(0, int((TODAY - dob).days / 365.25))

        if age < 12:
            height = round(random.uniform(72, 150), 1)
            weight = round(random.uniform(9, 52), 1)
        elif gender is True:
            height = round(random.uniform(160, 194), 1)
            weight = round(random.uniform(55, 112), 1)
        else:
            height = round(random.uniform(148, 183), 1)
            weight = round(random.uniform(45, 98), 1)

        last_checkup = random_date(max(date(2008, 1, 1), dob + timedelta(days=365 * 3)), TODAY)

        rows.append(
            (
                pid,
                choose_blood_type(),
                height,
                weight,
                random.random() < (0.28 if age > 20 else 0.01),
                maybe_null(random.choice(chronic), 0.58),
                last_checkup,
            )
        )

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


def create_education(cur) -> None:
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
        "Ecole Nationale Polytechnique",
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
        if random.random() > 0.73:
            continue

        start = random_date(max(date(1960, 9, 1), dob + timedelta(days=18 * 365)), TODAY)
        grad = maybe_null(random_date(start + timedelta(days=3 * 365), min(TODAY, start + timedelta(days=8 * 365))), 0.16)

        rows.append(
            (
                pid,
                random.choice(universities),
                random.choice(majors),
                random.choice(["Bachelor", "Master", "PhD", "Licence", "Engineer"]),
                round(random.uniform(2.1, 4.0), 2),
                random.choice(["full-time", "part-time", "distance"]),
                start,
                grad,
                maybe_null(f"https://certificates.example/{pid}", 0.52),
                random.random() < 0.76,
            )
        )

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


def create_employment_and_audit(cur) -> None:
    cur.execute(
        """
        SELECT id, date_of_birth
        FROM person
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
        "Data Analyst",
        "HR Specialist",
    ]
    departments = ["IT", "Health", "Finance", "Education", "Operations", "Legal", "Public Service"]
    work_types = ["full-time", "part-time", "contract", "temporary"]

    rows = []
    for pid, dob in adults:
        if random.random() > 0.68:
            continue

        start = random_date(max(date(1960, 1, 1), dob + timedelta(days=18 * 365)), TODAY)
        active = random.random() < 0.8
        end_date = None if active else maybe_null(random_date(start + timedelta(days=100), TODAY), 0.1)

        rows.append(
            (
                pid,
                random.randint(1, 700),
                random.choice(titles),
                random.choice(departments),
                random.choice(work_types),
                round(random.uniform(32000, 520000), 2),
                active,
                start,
                end_date,
                None,
                random.choice(["Algiers", "Oran", "Annaba", "Constantine", "Blida", "Setif"]),
            )
        )

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

    sample = random.sample(employment_ids, min(700, len(employment_ids)))
    cur.execute(
        """
        UPDATE employment
        SET salary = salary * (1 + (random() * 0.18)::numeric)
        WHERE id = ANY(%s)
        """,
        (sample,),
    )


def ensure_salary_audit_not_empty(cur) -> None:
    cur.execute("SELECT to_regclass('public.salary_audit')")
    if cur.fetchone()[0] is None:
        return

    cur.execute("SELECT COUNT(*) FROM salary_audit")
    if cur.fetchone()[0] > 0:
        return

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


def create_assets(cur) -> None:
    cur.execute("SELECT id, date_of_birth FROM person")
    people = cur.fetchall()

    asset_types = ["car", "land", "house", "apartment", "shop", "farm equipment", "motorbike"]
    rows = []
    reg_no = 10_000

    for pid, dob in people:
        age = int((TODAY - dob).days / 365.25)
        if age < 18 or random.random() > 0.5:
            continue

        count = 1 if random.random() < 0.78 else random.randint(2, 4)
        for _ in range(count):
            owned = random_date(max(date(1960, 1, 1), dob + timedelta(days=18 * 365)), TODAY)
            rows.append(
                (
                    pid,
                    random.choice(asset_types),
                    f"REG-{reg_no}",
                    datetime.combine(owned, datetime.min.time()),
                    round(random.uniform(90000, 9_000_000), 2),
                )
            )
            reg_no += 1

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


def create_passports(cur) -> None:
    cur.execute("SELECT id, date_of_birth FROM person")
    people = cur.fetchall()

    rows = []
    seq = 100000

    for pid, dob in people:
        age = int((TODAY - dob).days / 365.25)
        if age < 16 or random.random() > 0.66:
            continue

        issue = random_date(max(date(1960, 1, 1), dob + timedelta(days=16 * 365)), TODAY)
        expiry = issue + timedelta(days=random.choice([5 * 365, 10 * 365]))

        rows.append((pid, f"P{seq}", issue, expiry, True))
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


def create_criminal_records(cur) -> None:
    cur.execute("SELECT id, date_of_birth FROM person")
    people = cur.fetchall()

    violations = ["traffic offense", "theft", "fraud", "public disturbance", "property damage", "tax evasion"]
    dispositions = ["pending", "closed", "convicted", "dismissed", "under review"]

    rows = []
    case_no = 200000

    for pid, dob in people:
        age = int((TODAY - dob).days / 365.25)
        if age < 18 or random.random() > 0.06:
            continue

        occ = random_date(max(date(1960, 1, 1), dob + timedelta(days=18 * 365)), TODAY)
        filing = random_date(occ, TODAY)

        rows.append(
            (
                pid,
                f"CR-{case_no}",
                random.random() > 0.16,
                random.choice(violations),
                random.choice(dispositions),
                FAKE.sentence(nb_words=random.randint(8, 18)),
                datetime.combine(occ, datetime.min.time()),
                datetime.combine(filing, datetime.min.time()),
                round(random.uniform(0, 250000), 2),
                maybe_null(FAKE.sentence(nb_words=10), 0.45),
                random.choice(["Algiers", "Oran", "Constantine", "Annaba", "Setif", "Blida"]),
                random.random() < 0.08,
            )
        )
        case_no += 1

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


def create_death_records(cur, hospital_user_ids: Sequence[int]) -> None:
    cur.execute(
        """
        SELECT p.id, p.date_of_birth
        FROM person p
        LEFT JOIN death_records d ON d.person_id = p.id
        WHERE d.person_id IS NULL
        """
    )
    people = cur.fetchall()

    person_ids = [p[0] for p in people]
    doctor_candidates = random.sample(person_ids, min(300, len(person_ids))) if person_ids else []

    rows = []
    for pid, dob in people:
        age = int((TODAY - dob).days / 365.25)
        if age < 18:
            continue

        if age < 40:
            p_dead = 0.01
        elif age < 60:
            p_dead = 0.05
        elif age < 80:
            p_dead = 0.18
        else:
            p_dead = 0.5

        if random.random() > p_dead:
            continue

        death_day = random_date(max(date(1960, 1, 1), dob + timedelta(days=18 * 365)), TODAY)
        kin = random.choice(person_ids) if random.random() < 0.7 and person_ids else None

        rows.append(
            (
                pid,
                datetime.combine(death_day, datetime.min.time()) + timedelta(
                    hours=random.randint(0, 23), minutes=random.randint(0, 59)
                ),
                random.choice(["Algiers", "Oran", "Annaba", "Constantine", "Setif"]),
                random.choice(["heart disease", "stroke", "cancer", "road accident", "respiratory failure", "natural causes"]),
                maybe_null(random.choice(doctor_candidates), 0.55) if doctor_candidates else None,
                maybe_null(random.choice(["I21.9", "I64", "C80", "J96", "V89", "R54"]), 0.35),
                kin,
                random.random() < 0.72,
                random.choice(hospital_user_ids) if hospital_user_ids else None,
            )
        )

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


def populate_act_number_tracker(cur) -> None:
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


def print_counts(cur) -> None:
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
        print(f"{t:20s} : {cur.fetchone()[0]}")


def assert_tables_populated(cur) -> None:
    required_non_empty = [
        "roles",
        "person",
        "users",
        "marriage",
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

    empties = []
    for t in required_non_empty:
        cur.execute(f"SELECT COUNT(*) FROM {t}")
        if cur.fetchone()[0] == 0:
            empties.append(t)

    if empties:
        raise RuntimeError("Seed completed but some required tables are empty: " + ", ".join(empties))


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
                print("Resetting and seeding tables with 10 generations...")
                ensure_required_tables(cur)
                truncate_all(cur)
                role_map = ensure_roles(cur)

                all_people: List[PersonRow] = []
                generation_people: Dict[int, List[PersonRow]] = {}

                next_national_id = 1_000_000_000
                founders, next_national_id = create_founders(cur, next_national_id)
                generation_people[0] = founders
                all_people.extend(founders)

                hospital_ids, notary_ids = create_users(cur, role_map, all_people)
                if not notary_ids:
                    raise RuntimeError("No notary users available for marriage generation")

                generation_marriages: Dict[int, List[MarriageRow]] = {}

                for gen in range(GENERATIONS):
                    current_people = generation_people.get(gen, [])
                    males, females = split_by_gender(current_people)

                    target_pairs = TARGET_COUPLES_PER_GENERATION[gen]
                    pairs = pair_generation(males, females, max_pairs=target_pairs)
                    if not pairs:
                        raise RuntimeError(f"No eligible pairs found for generation {gen}")

                    # Ensure marriage audit trigger can capture a valid actor.
                    cur.execute(
                        "SELECT set_config('app.current_user_id', %s, false)",
                        (str(random.choice(notary_ids)),),
                    )

                    witness_pool = [p.id for p in all_people if TODAY >= p.dob + timedelta(days=18 * 365)]
                    marriages = create_marriages(cur, pairs, notary_ids, witness_pool, generation_index=gen)
                    generation_marriages[gen] = marriages

                    # Ensure birth log trigger can capture a valid hospital actor.
                    if hospital_ids:
                        cur.execute(
                            "SELECT set_config('app.current_user_id', %s, false)",
                            (str(random.choice(hospital_ids)),),
                        )

                    if gen < GENERATIONS - 1:
                        children, next_national_id = create_children_and_births(
                            cur,
                            marriages,
                            generation_index=gen + 1,
                            next_national_id=next_national_id,
                            hospital_user_ids=hospital_ids,
                        )
                        generation_people[gen + 1] = children
                        all_people.extend(children)

                dissolve_some_marriages(cur)
                create_medical_records(cur)
                create_education(cur)
                create_employment_and_audit(cur)
                ensure_salary_audit_not_empty(cur)
                create_assets(cur)
                create_passports(cur)
                create_criminal_records(cur)
                create_death_records(cur, hospital_ids)
                populate_act_number_tracker(cur)

                assert_tables_populated(cur)
                print_counts(cur)

                print("\n=== Generation Stats ===")
                for gen in range(GENERATIONS):
                    pcount = len(generation_people.get(gen, []))
                    mcount = len(generation_marriages.get(gen, []))
                    print(f"generation_{gen:02d} people={pcount} marriages={mcount}")

                print("\nDone. Realistic multi-generation dummy data generated successfully.")
                print("Default login password for seeded users: password")

    except Exception as exc:
        print("Seeding failed:", exc, file=sys.stderr)
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
