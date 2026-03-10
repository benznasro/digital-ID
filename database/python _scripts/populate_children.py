"""
Generate a fresh synthetic family tree in PostgreSQL.

- Clears all related tables (person, marriage, etc.).
- Creates 10,000 root ancestors (no parents) with family names.
- Each generation: every person has 0–10 children (very low chance above 7).
- Children inherit the father's family name.
- Repeats for 10 generations.
- Finally, uses Faker to assign real-looking first names.

Run from the project root (after installing Faker and psycopg2):
    pip install Faker psycopg2
    python "database\\python _scripts\\populate_children.py"
"""

import sys

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


SQL_GENERATION_STEP = """
WITH parents AS (
    SELECT person_id
    FROM tmp_generation
    WHERE generation = %(prev_gen)s
),

parent_kids AS (
    SELECT
        p.person_id AS parent_id,
        CASE
            WHEN r < 0.10 THEN 0   -- prob 10 of 100: no children
            WHEN r < 0.35 THEN 1   -- prob 25 of 100: 1 child
            WHEN r < 0.60 THEN 2   -- prob 25 of 100: 2 children
            WHEN r < 0.80 THEN 3   -- prob 20 of 100: 3 children
            WHEN r < 0.90 THEN 4   -- prob 10 of 100: 4 children
            WHEN r < 0.96 THEN 5   -- prob 6 of 100 : 5 children
            WHEN r < 0.985 THEN 6  -- prob 2.5 of 100: 6 children
            WHEN r < 0.995 THEN 7  -- prob 1 of 100 : 7 children
            WHEN r < 0.998 THEN 8  -- prob 0.3 of 100: 8 children
            WHEN r < 0.999 THEN 9  -- prob 0.1 of 100: 9 children
            ELSE 10                -- prob 0.1 of 100: 10 children
        END AS children_count
    FROM parents p
    CROSS JOIN LATERAL (SELECT random() AS r) x
),

raw_children AS (
    SELECT
        pk.parent_id,
        generate_series(1, pk.children_count) AS birth_order
    FROM parent_kids pk
),

children_data AS (
    SELECT
        rc.parent_id,
        rc.birth_order,
        (
            parent.date_of_birth
            + INTERVAL '30 years'
            + (random() * INTERVAL '365 days')
            + (random() * INTERVAL '24 hours')
            + (random() * INTERVAL '60 minutes')
            + (random() * INTERVAL '60 seconds')
        )::date AS child_dob,
        parent.last_name AS family_name
    FROM raw_children rc
    JOIN person parent ON parent.id = rc.parent_id
),

inserted_children AS (
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
        'Gen' || %(gen)s::text || '_' ||
        row_number() OVER (ORDER BY parent_id, birth_order)::text AS first_name,
        family_name AS last_name,
        NULL AS email,
        child_dob AS date_of_birth,
        NULL AS phone_number,
        (random() < 0.5) AS gender,
        parent_id AS dad_id,
        NULL AS mom_id
    FROM children_data
    RETURNING id
)
INSERT INTO tmp_generation (generation, person_id)
SELECT %(gen)s, id FROM inserted_children;
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

                for gen in range(2, 7):
                    cur.execute(
                        SQL_GENERATION_STEP,
                        {"prev_gen": gen - 1, "gen": gen},
                    )
                    print(f"Generated generation {gen}.")

                print("All 7 generations generated, now assigning Faker first names...")
                assign_faker_first_names(conn)
                print("Faker first names assigned to all persons.")
    finally:
        conn.close()


if __name__ == "__main__":
    main()


