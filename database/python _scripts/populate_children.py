"""
Phase-based realistic population simulator for Digital ID database.

Implements:
- Phase 1: founders (year 1724 context), born 1680-1710, parent IDs NULL.
- Phase 2: recursive 25-year generational loop (1724..2024) with marriage, births, mortality.
- Phase 3: legal/social complexity (divorce, education, crime, assets).
- Phase 4: global constraints (configurable total/living targets by 2024; uniqueness and relation safety).
- Phase 5: workforce employment + salary audit trigger population.

Run:
    pip install faker psycopg2-binary
    python "database\\python _scripts\\populate_children.py"
"""

from __future__ import annotations

import os
import random
import sys
from dataclasses import dataclass
from datetime import date, datetime, timedelta, timezone
from typing import Dict, List, Optional, Sequence, Tuple

import psycopg2
from faker import Faker
from psycopg2.extras import execute_values


DATABASE = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "dbname": os.getenv("DB_NAME", "digital_id"),
    "user": os.getenv("DB_USER", "postgres"),
    "password": os.getenv("DB_PASSWORD", ""),
}

DEFAULT_PASSWORD_HASH = "$2b$12$jL0MZV.okNAMo8YO2Wpa.OmLHWLCZPuST42JePt2oWD7L.NBdSTnG"

FAKE = Faker(["fr_FR", "en_US"])
TODAY = date(2024, 12, 31)

ROLE_NAMES = ["citizen", "hospital", "police", "government", "admin", "Marriage_Notary"]
WILAYA_CODES = [f"{i:02d}" for i in range(1, 59)]
COMMUNE_CODES = [f"{i:04d}" for i in range(1, 200)]

SIM_START_YEAR = 1724
SIM_END_YEAR = 2024
GENERATION_STEP = 25

FOUNDER_COUNT = 200
NATIONAL_ID_START = 1_000_000_000  # 10 digits
PASSPORT_START = 4_000_000_000  # 10 digits
BIRTH_CERT_START = 5_000_000_000
TARGET_TOTAL_PERSONS = int(os.getenv("TARGET_TOTAL_PERSONS", "50000"))
TARGET_LIVING_MIN = int(os.getenv("TARGET_LIVING_MIN", str(max(5000, TARGET_TOTAL_PERSONS // 2))))


@dataclass
class PersonState:
    id: int
    gender: bool  # True=male, False=female
    dob: date
    dad_id: Optional[int]
    mom_id: Optional[int]
    is_alive: bool = True
    death_date: Optional[datetime] = None
    founder_forced_death: Optional[datetime] = None


@dataclass
class MarriageState:
    id: int
    husband_id: int
    wife_id: int
    marriage_date: datetime
    valid: bool


def random_date(start: date, end: date) -> date:
    if start >= end:
        return start
    return start + timedelta(days=random.randint(0, (end - start).days))


def random_datetime_between(start: datetime, end: datetime) -> datetime:
    if start >= end:
        return start
    delta = int((end - start).total_seconds())
    return start + timedelta(seconds=random.randint(0, max(delta, 1)))


def maybe_null(value, p_null: float):
    return None if random.random() < p_null else value


def slug(text: str) -> str:
    return "".join(ch.lower() for ch in text if ch.isalnum())


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


def years_old(dob: date, at_date: date) -> int:
    return int((at_date - dob).days / 365.25)


def marriage_probability_for_year(year: int) -> float:
    # Gradual decline in marriage rates to mimic modern demographic transition.
    if year <= 1800:
        return 0.78
    if year <= 1900:
        return 0.72
    if year <= 1975:
        return 0.64
    return 0.58


def draw_children_count_for_year(year: int) -> int:
    # Fertility declines over time: large families are common early, rarer recently.
    r = random.random()
    if year <= 1850:
        if r < 0.10:
            return random.randint(0, 1)
        if r < 0.55:
            return random.randint(2, 4)
        if r < 0.90:
            return random.randint(5, 7)
        return random.randint(8, 10)

    if year <= 1950:
        if r < 0.15:
            return random.randint(0, 1)
        if r < 0.70:
            return random.randint(2, 4)
        if r < 0.95:
            return random.randint(5, 6)
        return random.randint(7, 8)

    if r < 0.22:
        return random.randint(0, 1)
    if r < 0.80:
        return random.randint(2, 3)
    if r < 0.98:
        return random.randint(4, 5)
    return 6


def ensure_required_tables(cur) -> None:
    required = [
        "roles",
        "person",
        "users",
        "marriage",
        "marriage_audit",
        "birth_records",
        "birth_records_log",
        "criminal_records_log",
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
        raise RuntimeError("Schema is incomplete. Missing: " + ", ".join(missing))


def truncate_all(cur) -> None:
    ordered_tables = [
        "birth_records_log",
        "criminal_records_log",
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


def create_system_users(cur, role_map: Dict[str, int]) -> Tuple[List[int], List[int]]:
    rows = [
        ("admin_main", DEFAULT_PASSWORD_HASH, role_map["admin"], None, None, None),
    ]

    for i in range(1, 6):
        rows.append((f"gov_{i}", DEFAULT_PASSWORD_HASH, role_map["government"], None, random.choice(WILAYA_CODES), random.choice(COMMUNE_CODES)))
        rows.append((f"police_{i}", DEFAULT_PASSWORD_HASH, role_map["police"], None, random.choice(WILAYA_CODES), random.choice(COMMUNE_CODES)))

    for i in range(1, 16):
        rows.append((f"hospital_{i}", DEFAULT_PASSWORD_HASH, role_map["hospital"], None, random.choice(WILAYA_CODES), random.choice(COMMUNE_CODES)))

    for i in range(1, 16):
        rows.append((f"notary_{i}", DEFAULT_PASSWORD_HASH, role_map["Marriage_Notary"], None, random.choice(WILAYA_CODES), random.choice(COMMUNE_CODES)))

    execute_values(
        cur,
        """
        INSERT INTO users (username, password, role_id, person_id, wilaya_code, commune_code)
        VALUES %s
        RETURNING id, role_id
        """,
        rows,
    )

    created = cur.fetchall()
    hospital_ids = [uid for uid, rid in created if rid == role_map["hospital"]]
    notary_ids = [uid for uid, rid in created if rid == role_map["Marriage_Notary"]]
    return hospital_ids, notary_ids


def insert_people(cur, rows: Sequence[Tuple]) -> List[Tuple[int, bool, date, Optional[int], Optional[int]]]:
    if not rows:
        return []

    inserted: List[Tuple[int, bool, date, Optional[int], Optional[int]]] = []
    chunk_size = 1000

    for i in range(0, len(rows), chunk_size):
        chunk = rows[i : i + chunk_size]
        execute_values(
            cur,
            """
            INSERT INTO person (
                national_id, first_name, last_name, email, date_of_birth,
                phone_number, gender, dad_id, mom_id, marital_status
            ) VALUES %s
            RETURNING id, gender, date_of_birth, dad_id, mom_id
            """,
            chunk,
            page_size=len(chunk),
        )
        inserted.extend(cur.fetchall())

    return inserted


def create_founders(cur, next_nid: int) -> Tuple[Dict[int, PersonState], int]:
    rows = []

    for i in range(FOUNDER_COUNT):
        male = i % 2 == 0
        first = FAKE.first_name_male() if male else FAKE.first_name_female()
        last = FAKE.last_name()
        dob = random_date(date(1680, 1, 1), date(1710, 12, 31))

        rows.append(
            (
                next_nid,
                first,
                last,
                maybe_null(f"{slug(first)}.{slug(last)}.{next_nid}@mail.dz", 0.9),
                dob,
                None,
                male,
                None,
                None,
                "single",
            )
        )
        next_nid += 1

    inserted = insert_people(cur, rows)
    states: Dict[int, PersonState] = {}

    for pid, gender, dob, dad_id, mom_id in inserted:
        death_age = random.randint(60, 90)
        forced = datetime.combine(dob, datetime.min.time(), tzinfo=timezone.utc) + timedelta(days=death_age * 365)
        states[pid] = PersonState(
            id=pid,
            gender=gender,
            dob=dob,
            dad_id=dad_id,
            mom_id=mom_id,
            founder_forced_death=forced,
        )

    return states, next_nid


def are_close_relatives(a: PersonState, b: PersonState) -> bool:
    if a.id == b.id:
        return True

    # First-degree direct.
    if a.dad_id == b.id or a.mom_id == b.id or b.dad_id == a.id or b.mom_id == a.id:
        return True

    # Siblings / half-siblings.
    if a.dad_id is not None and a.dad_id == b.dad_id:
        return True
    if a.mom_id is not None and a.mom_id == b.mom_id:
        return True

    return False


def pick_marriage_pairs(
    people: Dict[int, PersonState],
    active_marriage_for: Dict[int, int],
    at_year: int,
) -> List[Tuple[PersonState, PersonState]]:
    at_date = date(at_year, 12, 31)

    men = [
        p
        for p in people.values()
        if p.is_alive and p.gender and p.id not in active_marriage_for and 20 <= years_old(p.dob, at_date) <= 35
    ]
    women = [
        p
        for p in people.values()
        if p.is_alive and (not p.gender) and p.id not in active_marriage_for and 20 <= years_old(p.dob, at_date) <= 35
    ]

    random.shuffle(men)
    random.shuffle(women)

    used_wives = set()
    pairs: List[Tuple[PersonState, PersonState]] = []

    for husband in men:
        if random.random() > marriage_probability_for_year(at_year):
            continue

        h_age = years_old(husband.dob, at_date)

        compatible = []
        for wife in women:
            if wife.id in used_wives:
                continue
            if are_close_relatives(husband, wife):
                continue

            w_age = years_old(wife.dob, at_date)
            age_gap = h_age - w_age
            if age_gap < 0 or age_gap > 5:
                continue

            # Skew toward husbands 0-3 years older.
            weight = 5 if 0 <= age_gap <= 3 else 1
            compatible.extend([wife] * weight)

        if not compatible:
            continue

        wife = random.choice(compatible)
        used_wives.add(wife.id)
        pairs.append((husband, wife))

    return pairs


def insert_marriages(
    cur,
    pairs: Sequence[Tuple[PersonState, PersonState]],
    notary_ids: Sequence[int],
    witness_pool: Sequence[int],
    year: int,
) -> List[MarriageState]:
    rows = []
    year_start = datetime(year, 1, 1, tzinfo=timezone.utc)
    year_end = datetime(min(year + GENERATION_STEP - 1, SIM_END_YEAR), 12, 31, tzinfo=timezone.utc)

    for husband, wife in pairs:
        min_d = datetime.combine(max(husband.dob + timedelta(days=20 * 365), wife.dob + timedelta(days=20 * 365)), datetime.min.time(), tzinfo=timezone.utc)
        marriage_date = random_datetime_between(max(year_start, min_d), year_end)

        witnesses = [pid for pid in witness_pool if pid not in (husband.id, wife.id)]
        random.shuffle(witnesses)
        w1 = witnesses[0] if witnesses else None
        w2 = witnesses[1] if len(witnesses) > 1 else None

        rows.append(
            (
                husband.id,
                wife.id,
                marriage_date,
                True,
                None,
                None,
                w1,
                w2,
                round(random.uniform(10000, 900000), 2),
                random.choice(notary_ids),
            )
        )

    if not rows:
        return []

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
        page_size=1000,
    )

    return [MarriageState(*r) for r in cur.fetchall()]


def insert_children_birth_medical(
    cur,
    marriages: Sequence[MarriageState],
    people: Dict[int, PersonState],
    next_nid: int,
    next_birth_cert: int,
    period_start_year: int,
    hospital_ids: Sequence[int],
) -> Tuple[int, int, List[int]]:
    if not marriages:
        return next_nid, next_birth_cert, []

    person_rows = []
    birth_meta: List[Tuple[int, datetime]] = []  # marriage_id, birth_datetime

    period_start = date(period_start_year, 1, 1)
    period_end = date(min(period_start_year + GENERATION_STEP - 1, SIM_END_YEAR), 12, 31)

    for m in marriages:
        mom = people[m.wife_id]
        dad = people[m.husband_id]

        marriage_day = m.marriage_date.date()
        n_children = draw_children_count_for_year(marriage_day.year)

        for _ in range(n_children):
            start = max(period_start, marriage_day + timedelta(days=260))
            end = min(period_end, mom.dob + timedelta(days=40 * 365))
            if end <= start:
                continue

            dob = random_date(start, end)
            is_male = random.random() < 0.51
            first = FAKE.first_name_male() if is_male else FAKE.first_name_female()

            person_rows.append(
                (
                    next_nid,
                    first,
                    FAKE.last_name(),
                    maybe_null(f"{slug(first)}.{next_nid}@mail.dz", 0.995),
                    dob,
                    None,
                    is_male,
                    dad.id,
                    mom.id,
                    "single",
                )
            )

            bdt = datetime.combine(dob, datetime.min.time(), tzinfo=timezone.utc) + timedelta(
                hours=random.randint(0, 23), minutes=random.randint(0, 59)
            )
            birth_meta.append((m.id, bdt))
            next_nid += 1

    inserted = insert_people(cur, person_rows)

    if not inserted:
        return next_nid, next_birth_cert, []

    new_ids = []
    birth_rows = []
    medical_rows = []

    for i, (pid, gender, dob, dad_id, mom_id) in enumerate(inserted):
        new_ids.append(pid)
        people[pid] = PersonState(id=pid, gender=gender, dob=dob, dad_id=dad_id, mom_id=mom_id)

        marriage_id, birth_dt = birth_meta[i]
        birth_rows.append(
            (
                next_birth_cert,
                pid,
                marriage_id,
                random.choice(["CHU Oran", "CHU Bab El Oued", "Mustapha Pacha Hospital", "EHS Mother and Child", "Regional General Hospital"]),
                f"Dr. {FAKE.last_name()}",
                round(random.uniform(2.2, 4.7), 2),
                birth_dt,
                random.choice(WILAYA_CODES),
                random.choice(COMMUNE_CODES),
                random.randint(6, 10),
            )
        )
        next_birth_cert += 1

        medical_rows.append(
            (
                pid,
                choose_blood_type(),
                round(random.uniform(48, 56), 1),
                round(random.uniform(2.4, 4.5), 1),
                False,
                None,
                dob,
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

    execute_values(
        cur,
        """
        INSERT INTO medical_records (
            person_id, blood_type, height_cm, weight_kg,
            smoker, chronic_conditions, last_checkup_date
        ) VALUES %s
        ON CONFLICT DO NOTHING
        """,
        medical_rows,
        page_size=1000,
    )

    if hospital_ids:
        cur.execute(
            """
            UPDATE birth_records_log
            SET changed_by_user_id = %s
            WHERE changed_by_user_id IS NULL
            """,
            (random.choice(hospital_ids),),
        )

    return next_nid, next_birth_cert, new_ids


def insert_death_records(cur, rows: Sequence[Tuple]) -> None:
    if not rows:
        return

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
        page_size=1000,
    )


def apply_mortality(
    cur,
    people: Dict[int, PersonState],
    year: int,
    hospital_ids: Sequence[int],
) -> None:
    period_start = datetime(year, 1, 1, tzinfo=timezone.utc)
    period_end = datetime(min(year + GENERATION_STEP - 1, SIM_END_YEAR), 12, 31, tzinfo=timezone.utc)

    person_ids = [p.id for p in people.values()]
    doctor_pool = random.sample(person_ids, min(250, len(person_ids))) if person_ids else []

    rows = []

    for p in people.values():
        if not p.is_alive:
            continue

        # Founder rule: all founders must die naturally age 60-90.
        if p.founder_forced_death is not None and p.founder_forced_death <= period_end:
            ddt = p.founder_forced_death
            p.is_alive = False
            p.death_date = ddt
            rows.append(
                (
                    p.id,
                    ddt,
                    random.choice(["Algiers", "Oran", "Constantine", "Annaba", "Setif"]),
                    "natural causes",
                    maybe_null(random.choice(doctor_pool), 0.6) if doctor_pool else None,
                    maybe_null(random.choice(["R54", "I64", "I21.9"]), 0.5),
                    maybe_null(random.choice(person_ids), 0.4),
                    True,
                    random.choice(hospital_ids) if hospital_ids else None,
                )
            )
            continue

        age_end = years_old(p.dob, period_end.date())

        # Mandatory mortality: age 80+.
        if age_end >= 80:
            min_date = max(period_start, datetime.combine(p.dob + timedelta(days=80 * 365), datetime.min.time(), tzinfo=timezone.utc))
            ddt = random_datetime_between(min_date, period_end)
            p.is_alive = False
            p.death_date = ddt
            rows.append(
                (
                    p.id,
                    ddt,
                    random.choice(["Algiers", "Oran", "Constantine", "Annaba", "Setif"]),
                    random.choice(["natural causes", "heart disease", "stroke", "respiratory failure"]),
                    maybe_null(random.choice(doctor_pool), 0.6) if doctor_pool else None,
                    maybe_null(random.choice(["R54", "I64", "I21.9", "J96"]), 0.45),
                    maybe_null(random.choice(person_ids), 0.4),
                    random.random() < 0.8,
                    random.choice(hospital_ids) if hospital_ids else None,
                )
            )
            continue

        # Random mortality by age bands.
        if age_end <= 40:
            p_dead = 0.05
        elif age_end <= 70:
            p_dead = 0.15
        elif age_end < 80:
            p_dead = 0.22
        else:
            p_dead = 0.0

        if random.random() < p_dead:
            min_age = max(0, age_end - GENERATION_STEP + 1)
            min_dt = datetime.combine(p.dob + timedelta(days=min_age * 365), datetime.min.time(), tzinfo=timezone.utc)
            ddt = random_datetime_between(max(period_start, min_dt), period_end)
            p.is_alive = False
            p.death_date = ddt
            rows.append(
                (
                    p.id,
                    ddt,
                    random.choice(["Algiers", "Oran", "Constantine", "Annaba", "Setif"]),
                    random.choice(["accident", "infection", "cardiac arrest", "stroke", "natural causes"]),
                    maybe_null(random.choice(doctor_pool), 0.6) if doctor_pool else None,
                    maybe_null(random.choice(["V89", "A41", "I46", "I64", "R54"]), 0.45),
                    maybe_null(random.choice(person_ids), 0.4),
                    random.random() < 0.7,
                    random.choice(hospital_ids) if hospital_ids else None,
                )
            )

    insert_death_records(cur, rows)


def create_citizen_users(cur, role_map: Dict[str, int], people: Dict[int, PersonState]) -> None:
    living_adults = [p for p in people.values() if p.is_alive and years_old(p.dob, TODAY) >= 18]
    sample_size = min(2500, len(living_adults))
    rows = []

    for i, p in enumerate(random.sample(living_adults, sample_size), start=1):
        rows.append((f"citizen_{p.id}_{i}", DEFAULT_PASSWORD_HASH, role_map["citizen"], p.id, None, None))

    if rows:
        execute_values(
            cur,
            """
            INSERT INTO users (username, password, role_id, person_id, wilaya_code, commune_code)
            VALUES %s
            ON CONFLICT (username) DO NOTHING
            """,
            rows,
            page_size=1000,
        )


def create_missing_medicals(cur) -> None:
    cur.execute(
        """
        SELECT p.id, p.gender, p.date_of_birth
        FROM person p
        LEFT JOIN medical_records m ON m.person_id = p.id
        WHERE m.person_id IS NULL
        """
    )
    missing = cur.fetchall()

    rows = []
    for pid, gender, dob in missing:
        age = years_old(dob, TODAY)
        if age < 12:
            h = round(random.uniform(72, 150), 1)
            w = round(random.uniform(9, 52), 1)
        elif gender:
            h = round(random.uniform(160, 194), 1)
            w = round(random.uniform(55, 112), 1)
        else:
            h = round(random.uniform(148, 183), 1)
            w = round(random.uniform(45, 98), 1)

        rows.append((pid, choose_blood_type(), h, w, random.random() < 0.23, maybe_null(random.choice(["hypertension", "asthma", "none"]), 0.62), random_date(max(date(1960, 1, 1), dob), TODAY)))

    if rows:
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


def apply_divorce_phase(cur) -> None:
    # Use add_divorce function as requested for marriages in the last 100 years.
    cur.execute(
        """
        SELECT id, marriage_date
        FROM marriage
        WHERE valid = true
          AND marriage_date >= %s
        """,
        (datetime(1924, 1, 1, tzinfo=timezone.utc),),
    )
    candidates = cur.fetchall()
    if not candidates:
        return

    sample_n = int(len(candidates) * 0.10)
    selected = random.sample(candidates, sample_n) if sample_n > 0 else []

    for mid, mdate in selected:
        start = mdate + timedelta(days=365)
        end = datetime(2024, 12, 31, tzinfo=timezone.utc)
        if start >= end:
            continue
        divorce_date = random_datetime_between(start, end)
        reason = random.choice(["divorce", "Khula", "annulment"])
        cur.execute("SELECT add_divorce(%s, %s, %s)", (mid, divorce_date, reason))


def create_education(cur, people: Dict[int, PersonState]) -> None:
    rows = []

    for p in people.values():
        age = years_old(p.dob, TODAY)
        if age <= 20:
            continue

        # High school layer.
        if random.random() < 0.85:
            hs_start = date(max(1900, p.dob.year + 15), 9, 1)
            hs_grad = date(max(hs_start.year + 3, hs_start.year), 6, 30)
            if hs_grad <= TODAY:
                rows.append(
                    (
                        p.id,
                        random.choice(["Lycée Emir Abdelkader", "Lycée Ibn Khaldoun", "Lycée El Mokrani", "Lycée Ibn Sina"]),
                        random.choice(["Science", "Literature", "Economics", "Technical"]),
                        "High School",
                        round(random.uniform(2.0, 4.0), 2),
                        "full-time",
                        hs_start,
                        hs_grad,
                        maybe_null(f"https://certificates.example/hs/{p.id}", 0.7),
                        random.random() < 0.85,
                    )
                )

        # University layer.
        if random.random() < 0.40:
            uni_start = date(max(1900, p.dob.year + 18), 9, 1)
            uni_grad = date(max(uni_start.year + random.randint(3, 6), uni_start.year), 7, 1)
            if uni_grad <= TODAY:
                rows.append(
                    (
                        p.id,
                        random.choice(["University of Algiers", "University of Oran", "USTHB", "University of Constantine", "University of Tlemcen", "ENSA"]),
                        random.choice(["Computer Science", "Civil Engineering", "Medicine", "Law", "Economics", "Business Administration", "Mathematics", "Physics"]),
                        random.choice(["Bachelor", "Master", "Engineer", "Licence"]),
                        round(random.uniform(2.1, 4.0), 2),
                        random.choice(["full-time", "part-time"]),
                        uni_start,
                        uni_grad,
                        maybe_null(f"https://certificates.example/uni/{p.id}", 0.5),
                        random.random() < 0.78,
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


def create_criminal_records(cur, people: Dict[int, PersonState]) -> None:
    adults = [p for p in people.values() if years_old(p.dob, TODAY) > 20]
    rows = []
    case_no = 200000

    for p in adults:
        pcrime = random.uniform(0.03, 0.07)
        if random.random() > pcrime:
            continue

        start_year = max(1920, p.dob.year + 20)
        occ = random_date(date(start_year, 1, 1), TODAY)
        filing = random_date(occ, TODAY)

        rows.append(
            (
                p.id,
                f"CR-{case_no}",
                random.random() > 0.2,
                random.choice(["traffic offense", "theft", "fraud", "public disturbance", "property damage", "tax evasion"]),
                random.choice(["pending", "closed", "convicted", "dismissed", "under review"]),
                FAKE.sentence(nb_words=random.randint(8, 16)),
                datetime.combine(occ, datetime.min.time(), tzinfo=timezone.utc),
                datetime.combine(filing, datetime.min.time(), tzinfo=timezone.utc),
                round(random.uniform(0, 250000), 2),
                maybe_null(FAKE.sentence(nb_words=10), 0.5),
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

        # Generate UPDATE audit entries in criminal_records_log as well.
        cur.execute(
            """
            UPDATE criminal_records
            SET disposition = CASE
                WHEN disposition = 'pending' THEN 'under review'
                ELSE disposition
            END
            WHERE id IN (
                SELECT id FROM criminal_records ORDER BY random() LIMIT 120
            )
            """
        )


def ensure_criminal_log_not_empty(cur) -> None:
    cur.execute("SELECT COUNT(*) FROM criminal_records_log")
    if cur.fetchone()[0] > 0:
        return

    # Fallback for DB instances where trigger is not installed yet.
    cur.execute(
        """
        INSERT INTO criminal_records_log (
            criminal_record_id,
            operation,
            changed_by_user_id,
            new_person_id,
            new_case_number,
            new_status,
            new_violation_type,
            new_disposition,
            new_description,
            new_occurrence_date,
            new_filing_date,
            new_fine_amount,
            new_sentence_details,
            new_location_details,
            new_is_expunged
        )
        SELECT
            c.id,
            'INSERT',
            NULL,
            c.person_id,
            c.case_number,
            c.status,
            c.violation_type,
            c.disposition,
            c.description,
            c.occurrence_date,
            c.filing_date,
            c.fine_amount,
            c.sentence_details,
            c.location_details,
            c.is_expunged
        FROM criminal_records c
        ORDER BY c.id
        LIMIT 500
        """
    )


def create_assets(cur, people: Dict[int, PersonState]) -> None:
    living_adults = [p for p in people.values() if p.is_alive and years_old(p.dob, TODAY) >= 18]
    target = int(len(living_adults) * 0.60)
    selected = random.sample(living_adults, target) if target > 0 else []

    rows = []
    reg_seq = 10000
    for p in selected:
        count = 1 if random.random() < 0.78 else random.randint(2, 3)
        for _ in range(count):
            rows.append(
                (
                    p.id,
                    random.choice(["car", "land", "house", "apartment", "shop", "motorbike"]),
                    f"REG-{reg_seq}",
                    datetime.combine(random_date(max(date(1920, 1, 1), p.dob + timedelta(days=18 * 365)), TODAY), datetime.min.time(), tzinfo=timezone.utc),
                    round(random.uniform(90000, 9_000_000), 2),
                )
            )
            reg_seq += 1

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


def create_passports(cur, people: Dict[int, PersonState], next_passport: int) -> int:
    living = [p for p in people.values() if p.is_alive and years_old(p.dob, TODAY) >= 16]
    rows = []

    for p in living:
        if random.random() > 0.68:
            continue

        issue = random_date(max(date(1920, 1, 1), p.dob + timedelta(days=16 * 365)), TODAY)
        expiry = issue + timedelta(days=random.choice([5 * 365, 10 * 365]))

        # 10-digit unique passport number.
        rows.append((p.id, str(next_passport), issue, expiry, True))
        next_passport += 1

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

    return next_passport


def create_employment_and_salary_audit(cur, people: Dict[int, PersonState]) -> None:
    workforce = [p for p in people.values() if p.is_alive and 22 <= years_old(p.dob, TODAY) <= 65]
    rows = []

    for p in workforce:
        if random.random() > 0.78:
            continue

        start = random_date(max(date(1940, 1, 1), p.dob + timedelta(days=22 * 365)), TODAY)
        rows.append(
            (
                p.id,
                random.randint(1, 1200),
                random.choice(["Software Engineer", "Nurse", "Teacher", "Accountant", "Civil Engineer", "Doctor", "Project Manager", "Police Officer", "Data Analyst", "HR Specialist"]),
                random.choice(["IT", "Health", "Finance", "Education", "Operations", "Legal", "Public Service"]),
                random.choice(["full-time", "part-time", "contract", "temporary"]),
                round(random.uniform(32000, 520000), 2),
                True,
                start,
                None,
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

    emp_ids = [r[0] for r in cur.fetchall()]
    update_n = int(len(emp_ids) * 0.30)
    to_update = random.sample(emp_ids, update_n) if update_n > 0 else []

    if to_update:
        cur.execute(
            """
            UPDATE employment
            SET salary = salary * (1 + (random() * 0.20)::numeric)
            WHERE id = ANY(%s)
            """,
            (to_update,),
        )


def ensure_salary_audit_not_empty(cur) -> None:
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
        LIMIT GREATEST(1, (SELECT COUNT(*) * 0.30 FROM employment)::int)
        """
    )


def ensure_birth_records_for_all(cur, next_birth_cert: int, hospital_ids: Sequence[int]) -> int:
    cur.execute(
        """
        SELECT p.id, p.date_of_birth, p.dad_id, p.mom_id
        FROM person p
        LEFT JOIN birth_records b ON b.child_id = p.id
        WHERE b.child_id IS NULL
        ORDER BY p.id
        """
    )
    missing = cur.fetchall()
    if not missing:
        return next_birth_cert

    cur.execute("SELECT id, husband_id, wife_id FROM marriage")
    marriage_map = {(h, w): mid for mid, h, w in cur.fetchall()}

    rows = []
    for pid, dob, dad_id, mom_id in missing:
        marriage_id = None
        if dad_id is not None and mom_id is not None:
            marriage_id = marriage_map.get((dad_id, mom_id))

        rows.append(
            (
                next_birth_cert,
                pid,
                marriage_id,
                random.choice(["CHU Oran", "CHU Bab El Oued", "Mustapha Pacha Hospital", "EHS Mother and Child", "Regional General Hospital"]),
                f"Dr. {FAKE.last_name()}",
                round(random.uniform(2.2, 4.7), 2),
                datetime.combine(dob, datetime.min.time(), tzinfo=timezone.utc) + timedelta(hours=random.randint(0, 23), minutes=random.randint(0, 59)),
                random.choice(WILAYA_CODES),
                random.choice(COMMUNE_CODES),
                random.randint(6, 10),
            )
        )
        next_birth_cert += 1

    execute_values(
        cur,
        """
        INSERT INTO birth_records (
            birth_certificate_no, child_id, marriage_id,
            hospital_name, doctor_name, birth_weight_kg,
            birth_date_time, wilaya_code, commune_code, apgar_score
        ) VALUES %s
        """,
        rows,
        page_size=1000,
    )

    if hospital_ids:
        cur.execute(
            """
            UPDATE birth_records_log
            SET changed_by_user_id = %s
            WHERE changed_by_user_id IS NULL
            """,
            (random.choice(hospital_ids),),
        )

    return next_birth_cert


def top_up_population_targets(
    cur,
    people: Dict[int, PersonState],
    next_nid: int,
    next_birth_cert: int,
    hospital_ids: Sequence[int],
    notary_ids: Sequence[int],
    target_total: int = TARGET_TOTAL_PERSONS,
    target_living: int = TARGET_LIVING_MIN,
) -> Tuple[int, int]:
    total_now = len(people)
    living_now = sum(1 for p in people.values() if p.is_alive)

    while total_now < target_total or living_now < target_living:
        remaining_total = max(0, target_total - total_now)
        remaining_living = max(0, target_living - living_now)
        remaining = max(remaining_total, remaining_living)
        if remaining <= 0:
            break

        # One household typically contributes 2 adults + 2..5 children.
        family_count = min(12000, max(800, remaining // 5))

        adult_rows = []
        family_meta: List[Tuple[date, date]] = []

        for _ in range(family_count):
            husband_dob = random_date(date(1945, 1, 1), date(2000, 12, 31))
            husband_age_2024 = years_old(husband_dob, TODAY)

            # 0..5 years age gap (husband older).
            gap = random.randint(0, 5)
            wife_age_2024 = max(20, husband_age_2024 - gap)
            wife_birth_year = TODAY.year - wife_age_2024
            wife_dob = random_date(date(wife_birth_year, 1, 1), date(wife_birth_year, 12, 31))

            h_first = FAKE.first_name_male()
            w_first = FAKE.first_name_female()

            adult_rows.append(
                (
                    next_nid,
                    h_first,
                    FAKE.last_name(),
                    maybe_null(f"{slug(h_first)}.{next_nid}@mail.dz", 0.95),
                    husband_dob,
                    None,
                    True,
                    None,
                    None,
                    "single",
                )
            )
            next_nid += 1

            adult_rows.append(
                (
                    next_nid,
                    w_first,
                    FAKE.last_name(),
                    maybe_null(f"{slug(w_first)}.{next_nid}@mail.dz", 0.95),
                    wife_dob,
                    None,
                    False,
                    None,
                    None,
                    "single",
                )
            )
            next_nid += 1

            family_meta.append((husband_dob, wife_dob))

        inserted_adults = insert_people(cur, adult_rows)
        if not inserted_adults:
            break

        # Pair adults by insertion order: husband row then wife row.
        adult_pairs = []
        for i in range(0, len(inserted_adults), 2):
            husband = inserted_adults[i]
            wife = inserted_adults[i + 1]
            husband_id, _, husband_dob, _, _ = husband
            wife_id, _, wife_dob, _, _ = wife

            people[husband_id] = PersonState(id=husband_id, gender=True, dob=husband_dob, dad_id=None, mom_id=None)
            people[wife_id] = PersonState(id=wife_id, gender=False, dob=wife_dob, dad_id=None, mom_id=None)
            adult_pairs.append((husband_id, wife_id, husband_dob, wife_dob))

        total_now += len(inserted_adults)
        living_now += len(inserted_adults)

        witness_pool = [p.id for p in people.values() if p.is_alive and years_old(p.dob, TODAY) >= 18]

        marriage_rows = []
        for husband_id, wife_id, husband_dob, wife_dob in adult_pairs:
            min_marriage_date = max(
                husband_dob + timedelta(days=20 * 365),
                wife_dob + timedelta(days=20 * 365),
                date(1960, 1, 1),
            )
            marriage_date = random_date(min_marriage_date, TODAY)

            candidate_witnesses = [pid for pid in witness_pool if pid not in (husband_id, wife_id)]
            random.shuffle(candidate_witnesses)
            w1 = candidate_witnesses[0] if candidate_witnesses else None
            w2 = candidate_witnesses[1] if len(candidate_witnesses) > 1 else None

            marriage_rows.append(
                (
                    husband_id,
                    wife_id,
                    datetime.combine(marriage_date, datetime.min.time(), tzinfo=timezone.utc),
                    True,
                    None,
                    None,
                    w1,
                    w2,
                    round(random.uniform(10000, 900000), 2),
                    random.choice(notary_ids),
                )
            )

        cur.execute("SELECT set_config('app.current_user_id', %s, false)", (str(random.choice(notary_ids)),))
        execute_values(
            cur,
            """
            INSERT INTO marriage (
                husband_id, wife_id, marriage_date, valid,
                end_marriage_time, end_reason,
                witness_1_id, witness_2_id, dowry_amount, notary_id
            ) VALUES %s
            RETURNING id, husband_id, wife_id, marriage_date
            """,
            marriage_rows,
            page_size=1000,
        )
        inserted_marriages = cur.fetchall()

        child_rows = []
        child_birth_meta: List[Tuple[int, datetime]] = []
        child_medical_rows = []

        for marriage_id, husband_id, wife_id, marriage_date in inserted_marriages:
            marriage_day = marriage_date.date() if isinstance(marriage_date, datetime) else marriage_date
            child_count = draw_children_count_for_year(marriage_day.year)

            for _ in range(child_count):
                dob_start = marriage_day + timedelta(days=260)
                dob_end = TODAY
                if dob_end <= dob_start:
                    continue

                child_dob = random_date(dob_start, dob_end)
                is_male = random.random() < 0.51
                first = FAKE.first_name_male() if is_male else FAKE.first_name_female()

                child_rows.append(
                    (
                        next_nid,
                        first,
                        FAKE.last_name(),
                        maybe_null(f"{slug(first)}.{next_nid}@mail.dz", 0.995),
                        child_dob,
                        None,
                        is_male,
                        husband_id,
                        wife_id,
                        "single",
                    )
                )

                birth_dt = datetime.combine(child_dob, datetime.min.time(), tzinfo=timezone.utc) + timedelta(
                    hours=random.randint(0, 23), minutes=random.randint(0, 59)
                )
                child_birth_meta.append((marriage_id, birth_dt))
                child_medical_rows.append(
                    (
                        None,
                        choose_blood_type(),
                        round(random.uniform(48, 56), 1),
                        round(random.uniform(2.4, 4.5), 1),
                        False,
                        None,
                        child_dob,
                    )
                )
                next_nid += 1

        if child_rows:
            inserted_children = insert_people(cur, child_rows)

            birth_rows = []
            fixed_medicals = []

            for idx, (pid, gender, dob, dad_id, mom_id) in enumerate(inserted_children):
                people[pid] = PersonState(id=pid, gender=gender, dob=dob, dad_id=dad_id, mom_id=mom_id)

                marriage_id, birth_dt = child_birth_meta[idx]
                birth_rows.append(
                    (
                        next_birth_cert,
                        pid,
                        marriage_id,
                        random.choice(["CHU Oran", "CHU Bab El Oued", "Mustapha Pacha Hospital", "EHS Mother and Child", "Regional General Hospital"]),
                        f"Dr. {FAKE.last_name()}",
                        round(random.uniform(2.2, 4.7), 2),
                        birth_dt,
                        random.choice(WILAYA_CODES),
                        random.choice(COMMUNE_CODES),
                        random.randint(6, 10),
                    )
                )
                next_birth_cert += 1

                medical_tuple = list(child_medical_rows[idx])
                medical_tuple[0] = pid
                fixed_medicals.append(tuple(medical_tuple))

            cur.execute("SELECT set_config('app.current_user_id', %s, false)", (str(random.choice(hospital_ids)),))
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

            execute_values(
                cur,
                """
                INSERT INTO medical_records (
                    person_id, blood_type, height_cm, weight_kg,
                    smoker, chronic_conditions, last_checkup_date
                ) VALUES %s
                ON CONFLICT DO NOTHING
                """,
                fixed_medicals,
                page_size=1000,
            )

            total_now += len(inserted_children)
            living_now += len(inserted_children)

    if hospital_ids:
        cur.execute(
            """
            UPDATE birth_records_log
            SET changed_by_user_id = %s
            WHERE changed_by_user_id IS NULL
            """,
            (random.choice(hospital_ids),),
        )

    return next_nid, next_birth_cert


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


def validate_death_trigger_effects(cur) -> None:
    # Ensure no deceased person has active employment or active marriage.
    cur.execute(
        """
        SELECT COUNT(*)
        FROM death_records d
        JOIN employment e ON e.person_id = d.person_id
        WHERE e.is_active = true
        """
    )
    active_jobs_dead = cur.fetchone()[0]

    cur.execute(
        """
        SELECT COUNT(*)
        FROM death_records d
        JOIN marriage m ON (m.husband_id = d.person_id OR m.wife_id = d.person_id)
        WHERE m.valid = true
        """
    )
    active_marriages_dead = cur.fetchone()[0]

    if active_jobs_dead > 0 or active_marriages_dead > 0:
        raise RuntimeError(
            "Death trigger verification failed: "
            f"active_jobs_dead={active_jobs_dead}, active_marriages_dead={active_marriages_dead}"
        )


def assert_population_constraints(cur, target_total: int, target_living: int) -> None:
    cur.execute("SELECT COUNT(*) FROM person")
    total_pop = cur.fetchone()[0]

    cur.execute(
        """
        SELECT COUNT(*)
        FROM person p
        LEFT JOIN death_records d ON d.person_id = p.id
        WHERE d.person_id IS NULL
        """
    )
    living_pop = cur.fetchone()[0]

    if total_pop < target_total:
        raise RuntimeError(f"Population target missed: total={total_pop}, expected >= {target_total}")
    if living_pop < target_living:
        raise RuntimeError(f"Living target missed: living={living_pop}, expected >= {target_living}")


def print_counts(cur) -> None:
    tables = [
        "roles",
        "person",
        "users",
        "marriage",
        "marriage_audit",
        "birth_records",
        "birth_records_log",
        "criminal_records_log",
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
                print("Running 1724-2024 population simulation...")

                ensure_required_tables(cur)
                truncate_all(cur)

                role_map = ensure_roles(cur)
                hospital_ids, notary_ids = create_system_users(cur, role_map)

                if not notary_ids:
                    raise RuntimeError("No notary users created.")

                next_nid = NATIONAL_ID_START
                next_birth_cert = BIRTH_CERT_START
                next_passport = PASSPORT_START

                people, next_nid = create_founders(cur, next_nid)
                active_marriage_for: Dict[int, int] = {}
                marriages: Dict[int, MarriageState] = {}

                generation_stats: List[Tuple[int, int, int]] = []

                for year in range(SIM_START_YEAR, SIM_END_YEAR + 1, GENERATION_STEP):
                    alive_adults = [p.id for p in people.values() if p.is_alive and years_old(p.dob, date(year, 12, 31)) >= 18]

                    cur.execute(
                        "SELECT set_config('app.current_user_id', %s, false)",
                        (str(random.choice(notary_ids)),),
                    )

                    pairs = pick_marriage_pairs(people, active_marriage_for, year)
                    new_marriages = insert_marriages(cur, pairs, notary_ids, alive_adults, year)

                    for m in new_marriages:
                        marriages[m.id] = m
                        active_marriage_for[m.husband_id] = m.id
                        active_marriage_for[m.wife_id] = m.id

                    cur.execute(
                        "SELECT set_config('app.current_user_id', %s, false)",
                        (str(random.choice(hospital_ids)),),
                    )

                    next_nid, next_birth_cert, child_ids = insert_children_birth_medical(
                        cur,
                        new_marriages,
                        people,
                        next_nid,
                        next_birth_cert,
                        year,
                        hospital_ids,
                    )

                    apply_mortality(cur, people, year, hospital_ids)

                    # Refresh active marriage map from DB truth after death trigger effects.
                    active_marriage_for.clear()
                    cur.execute("SELECT id, husband_id, wife_id FROM marriage WHERE valid = true")
                    for mid, hid, wid in cur.fetchall():
                        active_marriage_for[hid] = mid
                        active_marriage_for[wid] = mid

                    generation_stats.append((year, len(new_marriages), len(child_ids)))

                next_nid, next_birth_cert = top_up_population_targets(
                    cur,
                    people,
                    next_nid,
                    next_birth_cert,
                    hospital_ids,
                    notary_ids,
                    target_total=TARGET_TOTAL_PERSONS,
                    target_living=TARGET_LIVING_MIN,
                )

                next_birth_cert = ensure_birth_records_for_all(cur, next_birth_cert, hospital_ids)
                create_missing_medicals(cur)
                create_citizen_users(cur, role_map, people)
                apply_divorce_phase(cur)
                create_education(cur, people)
                create_criminal_records(cur, people)
                ensure_criminal_log_not_empty(cur)
                create_assets(cur, people)
                next_passport = create_passports(cur, people, next_passport)
                create_employment_and_salary_audit(cur, people)
                ensure_salary_audit_not_empty(cur)

                # Add mortality once more after employment creation to verify trigger closes active jobs.
                apply_mortality(cur, people, SIM_END_YEAR, hospital_ids)

                populate_act_number_tracker(cur)
                validate_death_trigger_effects(cur)
                assert_population_constraints(cur, TARGET_TOTAL_PERSONS, TARGET_LIVING_MIN)

                print_counts(cur)

                print("\n=== Generation Stats ===")
                for year, marriages_n, births_n in generation_stats:
                    print(f"year={year} marriages={marriages_n} births={births_n}")

                print("\nDone. Full realistic 300-year simulation completed.")
                print("Default seeded user password: password")

    except Exception as exc:
        print("Seeding failed:", exc, file=sys.stderr)
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    main()
