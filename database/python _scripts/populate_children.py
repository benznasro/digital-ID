"""
Generate synthetic family data in PostgreSQL.

- Clears all related tables (person, marriage, etc.)
- Creates 10,000 root ancestors (no parents) with family names
- Then creates marriages with probabilities and children per marriage (0–10)
- Children are linked to both parents and to their marriage / birth record
- Finally, Faker assigns real-looking first and last names

Run from the project root (after installing Faker and psycopg2):
    pip install Faker psycopg2
    python "database\\python _scripts\\populate_children.py"
"""

import sys
import random
from datetime import date, timedelta

import psycopg2
from psycopg2.extras import DictCursor, execute_batch
from faker import Faker


DATABASE = {
    "host": "localhost",
    "port": 5432,
    "dbname": "digital_id",      
    "user": "postgres",       
    "password": "ilovecats",    
}


SQL_RESET_AND_SETUP = """
TRUNCATE TABLE
    birth_records,
    death_records,
    salary_audit,
    employment,
    assets,
    passports,
    marriage,
    person
RESTART IDENTITY CASCADE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_class
        WHERE relkind = 'S' AND relname = 'national_id_seq'
    ) THEN
        CREATE SEQUENCE national_id_seq START 1000000000;
    ELSE
        ALTER SEQUENCE national_id_seq RESTART WITH 1000000000;
    END IF;
END;
$$;

CREATE TEMP TABLE tmp_generation (
    generation int,
    person_id bigint
) ON COMMIT DROP;

WITH inserted_roots AS (
    INSERT INTO person (
        national_id,
        first_name,
        last_name,
        email,
        date_of_birth,
        phone_number,
        gender,
        dad_id,
        mom_id
    )
    SELECT
        nextval('national_id_seq') AS national_id,
        'Gen1_' || gs::text        AS first_name,
        'Family_' || lpad(gs::text, 5, '0') AS last_name,
        NULL AS email,
        DATE '1900-01-01' + ((gs - 1) % 365) AS date_of_birth,
        NULL AS phone_number,
        (random() < 0.5) AS gender,
        NULL AS dad_id,
        NULL AS mom_id
    FROM generate_series(1, 10000) AS gs
    RETURNING id
)
INSERT INTO tmp_generation (generation, person_id)
SELECT 1, id FROM inserted_roots;
"""


def assign_faker_last_names_for_roots(conn: psycopg2.extensions.connection) -> None:
    
    fake = Faker()
    with conn.cursor() as cur:
        cur.execute("SELECT person_id FROM tmp_generation WHERE generation = 1")
        rows = cur.fetchall()

    updates = []
    for (person_id,) in rows:
        last = fake.last_name()
        updates.append((last, person_id))

    with conn.cursor() as cur:
        execute_batch(
            cur,
            "UPDATE person SET last_name = %s WHERE id = %s",
            updates,
            page_size=1000,
        )


def create_marriages_and_children(conn: psycopg2.extensions.connection) -> None:
    """
    Create marriages and children based on existing adults in person.

    - ~70% of adult males get married at least once
    - ~10% of married males get more than one wife (up to 4 total)
    - Each marriage has 0–10 children with the existing probability distribution
    - Children are added to person (linked to mom/dad) and to birth_records
    - marital_status is updated for husbands and wives
    """
    today = date(2024, 1, 1)

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, date_of_birth, gender, last_name
            FROM person
            """
        )
        rows = cur.fetchall()

    males = []
    females = []
    for person_id, dob, gender, last_name in rows:
        if dob is None:
            continue
        age_years = (today - dob).days / 365.25
        if age_years < 18:
            continue
        if gender is True:
            males.append((person_id, dob, last_name))
        elif gender is False:
            females.append((person_id, dob, last_name))

    random.shuffle(males)
    random.shuffle(females)

    female_index = 0
    marriages_created = 0
    divorce_candidates = []  # (marriage_id, husband_id, wife_id, marriage_date, last_child_dob)

    with conn.cursor() as cur:
        # reset marital_status to 'single' for everyone (requires the column to exist)
        try:
            cur.execute("UPDATE person SET marital_status = 'single'")
        except psycopg2.Error:
            # column might not exist yet; ignore in that case
            conn.rollback()
            with conn:
                pass

        for husband_id, h_dob, h_last in males:
            if female_index >= len(females):
                break

            # 70% chance this male gets married at all
            if random.random() >= 0.7:
                continue

            # 10% of married males get multiple wives (up to 4)
            if random.random() < 0.1:
                max_wives = min(4, len(females) - female_index)
                wives_count = random.randint(1, max_wives) if max_wives > 0 else 0
            else:
                wives_count = 1

            for _ in range(wives_count):
                if female_index >= len(females):
                    break

                wife_id, w_dob, w_last = females[female_index]
                female_index += 1

                # approximate marriage_date: when both are at least 20
                min_year = max(h_dob.year, w_dob.year) + 20
                marriage_date = date(min_year, 1, 1) + timedelta(
                    days=random.randint(0, 365)
                )

                cur.execute(
                    """
                    INSERT INTO marriage (husband_id, wife_id, marriage_date, valid)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id
                    """,
                    (husband_id, wife_id, marriage_date, True),
                )
                marriage_id = cur.fetchone()[0]
                marriages_created += 1

                # update marital_status for spouses if column exists
                try:
                    cur.execute(
                        """
                        UPDATE person
                        SET marital_status = 'married'
                        WHERE id = %s OR id = %s
                        """,
                        (husband_id, wife_id),
                    )
                except psycopg2.Error:
                    conn.rollback()
                    with conn:
                        pass

                # decide children count for this marriage
                r = random.random()
                if r < 0.10:
                    children_count = 0
                elif r < 0.35:
                    children_count = 1
                elif r < 0.60:
                    children_count = 2
                elif r < 0.80:
                    children_count = 3
                elif r < 0.90:
                    children_count = 4
                elif r < 0.96:
                    children_count = 5
                elif r < 0.985:
                    children_count = 6
                elif r < 0.995:
                    children_count = 7
                elif r < 0.998:
                    children_count = 8
                elif r < 0.999:
                    children_count = 9
                else:
                    children_count = 10

                last_child_dob = None

                for _ in range(children_count):
                    # child birth between ~9 months and 20 years after marriage
                    days_after = 270 + random.randint(0, 20 * 365)
                    child_dob = marriage_date + timedelta(days=days_after)

                    # insert child into person
                    cur.execute(
                        """
                        INSERT INTO person (
                            national_id,
                            first_name,
                            last_name,
                            email,
                            date_of_birth,
                            phone_number,
                            gender,
                            dad_id,
                            mom_id,
                            marital_status
                        )
                        VALUES (
                            nextval('national_id_seq'),
                            %s,
                            %s,
                            NULL,
                            %s,
                            NULL,
                            %s,
                            %s,
                            %s,
                            'single'
                        )
                        RETURNING id
                        """,
                        (
                            "Child",
                            h_last,  # inherit father's family name
                            child_dob,
                            random.random() < 0.5,
                            husband_id,
                            wife_id,
                        ),
                    )
                    child_id = cur.fetchone()[0]

                    # keep track of last child's birth for realistic divorce timing
                    if last_child_dob is None or child_dob > last_child_dob:
                        last_child_dob = child_dob

                    # insert birth record for this child
                    cur.execute(
                        """
                        INSERT INTO birth_records (
                            birth_certificate_no,
                            child_id,
                            marriage_id,
                            hospital_name,
                            doctor_name,
                            birth_weight_kg,
                            birth_datetime
                        )
                        VALUES (
                            5000000000 + floor(random() * 1000000000)::bigint,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s,
                            %s
                        )
                        """,
                        (
                            child_id,
                            marriage_id,
                            "General Hospital",
                            "Dr. Generated",
                            round(3.0 + random.random() * 1.5, 2),
                            child_dob,
                        ),
                    )

                divorce_candidates.append(
                    (marriage_id, husband_id, wife_id, marriage_date, last_child_dob)
                )

    # After all marriages and children are created, add realistic divorces
    divorce_rate = 0.2  # 20% of marriages end in divorce
    with conn.cursor() as cur:
        for (
            marriage_id,
            husband_id,
            wife_id,
            marriage_date,
            last_child_dob,
        ) in divorce_candidates:
            if random.random() >= divorce_rate:
                continue

            # base date for divorce: after last child if exists, otherwise after at least 1 year of marriage
            base_date = last_child_dob or (marriage_date + timedelta(days=365))
            # divorce happens 1–10 years after base date
            days_after = random.randint(365, 10 * 365)
            end_date = base_date + timedelta(days=days_after)

            cur.execute(
                """
                UPDATE marriage
                SET valid = false,
                    end_marriage_time = %s,
                    end_reason = 'divorce'
                WHERE id = %s
                """,
                (end_date, marriage_id),
            )

            # update spouses' marital_status to divorced (if column exists)
            try:
                cur.execute(
                    """
                    UPDATE person
                    SET marital_status = 'divorced'
                    WHERE id = %s OR id = %s
                    """,
                    (husband_id, wife_id),
                )
            except psycopg2.Error:
                conn.rollback()
                with conn:
                    pass

    print(f"Created {marriages_created} marriages with children (with some divorces).")


def create_deaths(conn: psycopg2.extensions.connection) -> None:
    """
    Create realistic death_records for older people and some random others.
    Triggers on death_records will deactivate passports/employment and close marriages.
    """
    fake = Faker()
    today = date(2024, 1, 1)

    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT id, date_of_birth
            FROM person
            WHERE date_of_birth IS NOT NULL
            """
        )
        people = cur.fetchall()

    with conn.cursor() as cur:
        for person_id, dob in people:
            age_years = (today - dob).days / 365.25

            # age-based probability of being dead
            if age_years < 40:
                p_dead = 0.02
            elif age_years < 60:
                p_dead = 0.10
            elif age_years < 80:
                p_dead = 0.30
            else:
                p_dead = 0.80

            if random.random() >= p_dead:
                continue

            # choose a realistic death date
            # can't be before age 18, and must be before "today"
            min_death = max(dob + timedelta(days=18 * 365), dob + timedelta(days=int(age_years * 0.6) * 365))
            max_death = today - timedelta(days=random.randint(0, 365))
            if min_death >= max_death:
                continue

            span_days = (max_death - min_death).days
            death_date = min_death + timedelta(days=random.randint(0, span_days))

            place = fake.city()
            cause = random.choice(
                [
                    "heart disease",
                    "stroke",
                    "cancer",
                    "respiratory illness",
                    "accident",
                    "natural causes",
                ]
            )

            cur.execute(
                """
                INSERT INTO death_records (
                    person_id,
                    death_date,
                    place_of_death,
                    cause_of_death
                )
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (person_id) DO NOTHING
                """,
                (person_id, death_date, place, cause),
            )

    print("Created death_records for older and randomly selected people.")


def create_medical_records(conn: psycopg2.extensions.connection) -> None:
    """
    Create a simple medical_records table (if needed) and populate
    one record per person with semi-realistic data.
    """
    fake = Faker()
    today = date(2024, 1, 1)

    with conn.cursor() as cur:
        # ensure table exists
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS medical_records (
                id bigserial PRIMARY KEY,
                person_id bigint NOT NULL REFERENCES person(id),
                blood_type varchar(3),
                height_cm numeric(4,1),
                weight_kg numeric(5,1),
                smoker bool,
                chronic_conditions text,
                last_checkup_date date
            )
            """
        )
        cur.execute("TRUNCATE medical_records RESTART IDENTITY;")

        cur.execute(
            """
            SELECT id, gender, date_of_birth
            FROM person
            """
        )
        people = cur.fetchall()

    # approximate realistic global distribution (O+ most common, AB- very rare)
    # we implement simple weights via repetition
    blood_types_weighted = (
        ["O+" ] * 38 +
        ["A+" ] * 34 +
        ["B+" ] * 9  +
        ["AB+"] * 3  +
        ["O-" ] * 7  +
        ["A-" ] * 6  +
        ["B-" ] * 2  +
        ["AB-"] * 1
    )

    records = []
    for person_id, gender, dob in people:
        if dob is not None:
            age_years = (today - dob).days / 365.25
        else:
            age_years = random.randint(0, 90)

        # rough height/weight ranges by gender
        if gender is True:  # male
            height = round(random.uniform(160, 190), 1)
            weight = round(random.uniform(55, 110), 1)
        elif gender is False:  # female
            height = round(random.uniform(150, 180), 1)
            weight = round(random.uniform(45, 95), 1)
        else:
            height = round(random.uniform(150, 185), 1)
            weight = round(random.uniform(45, 105), 1)

        smoker = random.random() < 0.2  # ~20% smokers

        # some simple chronic conditions
        cond_choices = [
            "",
            "hypertension",
            "diabetes type 2",
            "asthma",
            "hyperlipidemia",
            "chronic kidney disease",
        ]
        chronic = ""
        if age_years > 40 and random.random() < 0.4:
            chronic = random.choice(cond_choices[1:])

        last_checkup = today - timedelta(days=random.randint(0, 3 * 365))

        records.append(
            (
                person_id,
                random.choice(blood_types_weighted),
                height,
                weight,
                smoker,
                chronic if chronic else None,
                last_checkup,
            )
        )

    with conn.cursor() as cur:
        execute_batch(
            cur,
            """
            INSERT INTO medical_records (
                person_id,
                blood_type,
                height_cm,
                weight_kg,
                smoker,
                chronic_conditions,
                last_checkup_date
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            records,
            page_size=1000,
        )

    print("Created medical_records for all persons.")


def assign_faker_first_names(conn: psycopg2.extensions.connection) -> None:
    """
    Use Faker to assign real-looking first names to every person,
    respecting the boolean gender column (True/False).
    """
    fake = Faker()
    with conn.cursor() as cur:
        cur.execute("SELECT id, gender FROM person")
        rows = cur.fetchall()

    updates = []
    for person_id, gender in rows:
        if gender is True:
            first = fake.first_name_male()
        elif gender is False:
            first = fake.first_name_female()
        else:
            first = fake.first_name()
        updates.append((first, person_id))

    with conn.cursor() as cur:
        execute_batch(
            cur,
            "UPDATE person SET first_name = %s WHERE id = %s",
            updates,
            page_size=1000,
        )


def main() -> None:
    try:
        conn = psycopg2.connect(**DATABASE)
    except Exception as exc:
        print("Failed to connect to PostgreSQL:", exc, file=sys.stderr)
        sys.exit(1)

    try:
        with conn:
            with conn.cursor(cursor_factory=DictCursor) as cur:
                cur.execute(SQL_RESET_AND_SETUP)
                print("Reset tables and created 10,000 root ancestors (generation 1).")

            assign_faker_last_names_for_roots(conn)
            print("Assigned Faker family names to generation 1.")

            # create marriages and children using Python logic
            create_marriages_and_children(conn)
            print("Created marriages and children.")

            # deaths and medical records
            create_deaths(conn)
            create_medical_records(conn)

            print("Assigning Faker first names to all persons...")
            assign_faker_first_names(conn)
            print("Faker first names assigned to all persons.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()


