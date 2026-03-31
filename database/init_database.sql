-- DROP SCHEMA public;

CREATE SCHEMA IF NOT EXISTS public AUTHORIZATION pg_database_owner;

COMMENT ON SCHEMA public IS 'standard public schema';

-- Bootstrap trigger functions so trigger creation works on first pass.
-- Full implementations are defined later and will replace these stubs.

CREATE OR REPLACE FUNCTION public.inherit_father_last_name()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_person_death()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.block_dead_employment()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.audit_salary_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_max_wives()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_incest_prevention()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_marriage_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_passport_overlap()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_birth_record_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_criminal_record_changes()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

-- DROP SEQUENCE public.assets_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.assets_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.assets_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.assets_id_seq TO postgres;

-- DROP SEQUENCE public.assets_id_seq1;

CREATE SEQUENCE IF NOT EXISTS public.assets_id_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.assets_id_seq1 OWNER TO postgres;
GRANT ALL ON SEQUENCE public.assets_id_seq1 TO postgres;

-- DROP SEQUENCE public.birth_records_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.birth_records_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.birth_records_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.birth_records_id_seq TO postgres;

-- DROP SEQUENCE public.birth_records_id_seq1;

CREATE SEQUENCE IF NOT EXISTS public.birth_records_id_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.birth_records_id_seq1 OWNER TO postgres;
GRANT ALL ON SEQUENCE public.birth_records_id_seq1 TO postgres;

-- DROP SEQUENCE public.birth_records_log_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.birth_records_log_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.birth_records_log_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.birth_records_log_id_seq TO postgres;

-- DROP SEQUENCE public.birth_records_log_id_seq1;

CREATE SEQUENCE IF NOT EXISTS public.birth_records_log_id_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.birth_records_log_id_seq1 OWNER TO postgres;
GRANT ALL ON SEQUENCE public.birth_records_log_id_seq1 TO postgres;

-- DROP SEQUENCE public.criminal_records_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.criminal_records_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.criminal_records_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.criminal_records_id_seq TO postgres;

-- DROP SEQUENCE public.criminal_records_id_seq1;

CREATE SEQUENCE IF NOT EXISTS public.criminal_records_id_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.criminal_records_id_seq1 OWNER TO postgres;
GRANT ALL ON SEQUENCE public.criminal_records_id_seq1 TO postgres;

-- DROP SEQUENCE public.death_records_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.death_records_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.death_records_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.death_records_id_seq TO postgres;

-- DROP SEQUENCE public.death_records_id_seq1;

CREATE SEQUENCE IF NOT EXISTS public.death_records_id_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.death_records_id_seq1 OWNER TO postgres;
GRANT ALL ON SEQUENCE public.death_records_id_seq1 TO postgres;

-- DROP SEQUENCE public.education_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.education_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.education_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.education_id_seq TO postgres;

-- DROP SEQUENCE public.education_id_seq1;

CREATE SEQUENCE IF NOT EXISTS public.education_id_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.education_id_seq1 OWNER TO postgres;
GRANT ALL ON SEQUENCE public.education_id_seq1 TO postgres;

-- DROP SEQUENCE public.employment_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.employment_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.employment_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.employment_id_seq TO postgres;

-- DROP SEQUENCE public.employment_id_seq1;

CREATE SEQUENCE IF NOT EXISTS public.employment_id_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.employment_id_seq1 OWNER TO postgres;
GRANT ALL ON SEQUENCE public.employment_id_seq1 TO postgres;

-- DROP SEQUENCE public.marriage_audit_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.marriage_audit_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.marriage_audit_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.marriage_audit_id_seq TO postgres;

-- DROP SEQUENCE public.marriage_audit_id_seq1;

CREATE SEQUENCE IF NOT EXISTS public.marriage_audit_id_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.marriage_audit_id_seq1 OWNER TO postgres;
GRANT ALL ON SEQUENCE public.marriage_audit_id_seq1 TO postgres;

-- DROP SEQUENCE public.marriage_contract_no_seq;

CREATE SEQUENCE IF NOT EXISTS public.marriage_contract_no_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.marriage_contract_no_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.marriage_contract_no_seq TO postgres;

-- DROP SEQUENCE public.marriage_contract_no_seq1;

CREATE SEQUENCE IF NOT EXISTS public.marriage_contract_no_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.marriage_contract_no_seq1 OWNER TO postgres;
GRANT ALL ON SEQUENCE public.marriage_contract_no_seq1 TO postgres;

-- DROP SEQUENCE public.marriage_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.marriage_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.marriage_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.marriage_id_seq TO postgres;

-- DROP SEQUENCE public.marriage_id_seq1;

CREATE SEQUENCE IF NOT EXISTS public.marriage_id_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.marriage_id_seq1 OWNER TO postgres;
GRANT ALL ON SEQUENCE public.marriage_id_seq1 TO postgres;

-- DROP SEQUENCE public.medical_records_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.medical_records_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.medical_records_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.medical_records_id_seq TO postgres;

-- DROP SEQUENCE public.medical_records_id_seq1;

CREATE SEQUENCE IF NOT EXISTS public.medical_records_id_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.medical_records_id_seq1 OWNER TO postgres;
GRANT ALL ON SEQUENCE public.medical_records_id_seq1 TO postgres;

-- DROP SEQUENCE public.national_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.national_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1000000000
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.national_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.national_id_seq TO postgres;

-- DROP SEQUENCE public.passports_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.passports_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.passports_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.passports_id_seq TO postgres;

-- DROP SEQUENCE public.person_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.person_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.person_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.person_id_seq TO postgres;

-- DROP SEQUENCE public.person_id_seq1;

CREATE SEQUENCE IF NOT EXISTS public.person_id_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.person_id_seq1 OWNER TO postgres;
GRANT ALL ON SEQUENCE public.person_id_seq1 TO postgres;

-- DROP SEQUENCE public.roles_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.roles_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.roles_id_seq TO postgres;

-- DROP SEQUENCE public.roles_id_seq1;

CREATE SEQUENCE IF NOT EXISTS public.roles_id_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.roles_id_seq1 OWNER TO postgres;
GRANT ALL ON SEQUENCE public.roles_id_seq1 TO postgres;

-- DROP SEQUENCE public.salary_audit_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.salary_audit_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.salary_audit_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.salary_audit_id_seq TO postgres;

-- DROP SEQUENCE public.salary_audit_id_seq1;

CREATE SEQUENCE IF NOT EXISTS public.salary_audit_id_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.salary_audit_id_seq1 OWNER TO postgres;
GRANT ALL ON SEQUENCE public.salary_audit_id_seq1 TO postgres;

-- DROP SEQUENCE public.users_id_seq;

CREATE SEQUENCE IF NOT EXISTS public.users_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.users_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.users_id_seq TO postgres;

-- DROP SEQUENCE public.users_id_seq1;

CREATE SEQUENCE IF NOT EXISTS public.users_id_seq1
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.users_id_seq1 OWNER TO postgres;
GRANT ALL ON SEQUENCE public.users_id_seq1 TO postgres;
-- public.act_number_tracker definition

-- Drop table

-- DROP TABLE public.act_number_tracker;

CREATE TABLE IF NOT EXISTS public.act_number_tracker ( wilaya_code bpchar(2) NOT NULL, commune_code bpchar(4) NOT NULL, birth_year bpchar(2) NOT NULL, last_act_no int4 DEFAULT 0 NOT NULL, CONSTRAINT act_number_tracker_pkey PRIMARY KEY (wilaya_code, commune_code, birth_year));

-- Permissions

ALTER TABLE public.act_number_tracker OWNER TO postgres;
GRANT ALL ON TABLE public.act_number_tracker TO postgres;


-- public.roles definition

-- Drop table

-- DROP TABLE public.roles;

CREATE TABLE IF NOT EXISTS public.roles ( id serial4 NOT NULL, "name" varchar(50) NOT NULL, CONSTRAINT roles_name_key UNIQUE (name), CONSTRAINT roles_pkey PRIMARY KEY (id));

-- Permissions

ALTER TABLE public.roles OWNER TO postgres;
GRANT ALL ON TABLE public.roles TO postgres;


-- public.person definition

-- Drop table

-- DROP TABLE public.person;

CREATE TABLE IF NOT EXISTS public.person ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, national_id int8 NOT NULL, first_name varchar(255) NOT NULL, last_name varchar(255) NOT NULL, email varchar(255) NULL, date_of_birth date NOT NULL, phone_number varchar(20) NULL, gender bool NOT NULL, dad_id int8 NULL, mom_id int8 NULL, marital_status varchar(20) DEFAULT 'single'::character varying NOT NULL, CONSTRAINT check_lineage CHECK (((id <> dad_id) AND (id <> mom_id) AND (dad_id <> mom_id))), CONSTRAINT person_email_key UNIQUE (email), CONSTRAINT person_national_id_key UNIQUE (national_id), CONSTRAINT person_pkey PRIMARY KEY (id), CONSTRAINT person_dad_id_fkey FOREIGN KEY (dad_id) REFERENCES public.person(id), CONSTRAINT person_mom_id_fkey FOREIGN KEY (mom_id) REFERENCES public.person(id));

-- Table Triggers

DROP TRIGGER IF EXISTS trg_inherit_father_last_name ON public.person;
create trigger trg_inherit_father_last_name before
insert
    on
    public.person for each row execute function inherit_father_last_name();

-- Permissions

ALTER TABLE public.person OWNER TO postgres;
GRANT ALL ON TABLE public.person TO postgres;


-- public.users definition

-- Drop table

-- DROP TABLE public.users;

CREATE TABLE IF NOT EXISTS public.users ( id serial4 NOT NULL, username varchar(100) NOT NULL, "password" varchar(255) NOT NULL, role_id int4 DEFAULT 1 NULL, person_id int8 NULL, created_at timestamptz DEFAULT now() NULL, wilaya_code bpchar(2) NULL, commune_code bpchar(4) NULL, refresh_token text NULL, CONSTRAINT users_person_id_key UNIQUE (person_id), CONSTRAINT users_pkey PRIMARY KEY (id), CONSTRAINT users_username_key UNIQUE (username), CONSTRAINT users_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.person(id), CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id));
CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users USING btree (role_id);

-- Permissions

ALTER TABLE public.users OWNER TO postgres;
GRANT ALL ON TABLE public.users TO postgres;


-- public.assets definition

-- Drop table

-- DROP TABLE public.assets;

CREATE TABLE IF NOT EXISTS public.assets ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, owner_id int8 NOT NULL, asset_type varchar(100) NULL, registration_number varchar(255) NULL, date_owned timestamptz DEFAULT now() NULL, estimated_value numeric(15, 2) NULL, CONSTRAINT assets_pkey PRIMARY KEY (id), CONSTRAINT assets_registration_number_key UNIQUE (registration_number), CONSTRAINT assets_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.person(id));

-- Permissions

ALTER TABLE public.assets OWNER TO postgres;
GRANT ALL ON TABLE public.assets TO postgres;


-- public.birth_records_log definition

-- Drop table

-- DROP TABLE public.birth_records_log;

CREATE TABLE IF NOT EXISTS public.birth_records_log ( id bigserial NOT NULL, birth_record_id int8 NULL, operation varchar(10) NULL, changed_at timestamptz DEFAULT now() NULL, changed_by varchar(100) DEFAULT CURRENT_USER NULL, changed_by_user_id int8 NULL, old_birth_certificate_no int8 NULL, old_child_id int8 NULL, old_doctor_name varchar(255) NULL, old_birth_weight_kg numeric(4, 2) NULL, new_birth_certificate_no int8 NULL, new_child_id int8 NULL, new_doctor_name varchar(255) NULL, new_birth_weight_kg numeric(4, 2) NULL, old_birth_date_time timestamptz NULL, new_birth_date_time timestamptz NULL, old_marriage_id int8 NULL, new_marriage_id int8 NULL, CONSTRAINT birth_records_log_pkey PRIMARY KEY (id), CONSTRAINT birth_records_log_changed_by_user_id_fkey FOREIGN KEY (changed_by_user_id) REFERENCES public.users(id));
CREATE INDEX IF NOT EXISTS idx_birth_records_log_changed_user_time ON public.birth_records_log USING btree (changed_by_user_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_birth_records_log_record_time ON public.birth_records_log USING btree (birth_record_id, changed_at DESC);

-- Permissions

ALTER TABLE public.birth_records_log OWNER TO postgres;
GRANT ALL ON TABLE public.birth_records_log TO postgres;


-- public.criminal_records definition

-- Drop table

-- DROP TABLE public.criminal_records;

CREATE TABLE IF NOT EXISTS public.criminal_records ( id bigserial NOT NULL, person_id int8 NOT NULL, case_number varchar(50) NOT NULL, status bool DEFAULT true NULL, violation_type text NOT NULL, disposition varchar(100) NULL, description text NULL, occurrence_date timestamptz NULL, filing_date timestamptz DEFAULT CURRENT_TIMESTAMP NULL, fine_amount numeric(12, 2) DEFAULT 0.00 NULL, sentence_details text NULL, location_details text NULL, is_expunged bool DEFAULT false NULL, CONSTRAINT criminal_records_case_number_key UNIQUE (case_number), CONSTRAINT criminal_records_pkey PRIMARY KEY (id), CONSTRAINT fk_person FOREIGN KEY (person_id) REFERENCES public.person(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS idx_criminal_case_number ON public.criminal_records USING btree (case_number);
CREATE INDEX IF NOT EXISTS idx_criminal_person_id ON public.criminal_records USING btree (person_id);

-- Table Triggers

DROP TRIGGER IF EXISTS trg_criminal_records_audit ON public.criminal_records;
create trigger trg_criminal_records_audit after
insert
    or
delete
    or
update
    on
    public.criminal_records for each row execute function log_criminal_record_changes();

-- Permissions

ALTER TABLE public.criminal_records OWNER TO postgres;
GRANT ALL ON TABLE public.criminal_records TO postgres;


-- public.criminal_records_log definition

-- Drop table

-- DROP TABLE public.criminal_records_log;

CREATE TABLE IF NOT EXISTS public.criminal_records_log ( id bigserial NOT NULL, criminal_record_id int8 NULL, operation varchar(10) NULL, changed_at timestamptz DEFAULT now() NULL, changed_by varchar(100) DEFAULT CURRENT_USER NULL, changed_by_user_id int8 NULL, old_person_id int8 NULL, old_case_number varchar(50) NULL, old_status bool NULL, old_violation_type text NULL, old_disposition varchar(100) NULL, old_description text NULL, old_occurrence_date timestamptz NULL, old_filing_date timestamptz NULL, old_fine_amount numeric(12, 2) NULL, old_sentence_details text NULL, old_location_details text NULL, old_is_expunged bool NULL, new_person_id int8 NULL, new_case_number varchar(50) NULL, new_status bool NULL, new_violation_type text NULL, new_disposition varchar(100) NULL, new_description text NULL, new_occurrence_date timestamptz NULL, new_filing_date timestamptz NULL, new_fine_amount numeric(12, 2) NULL, new_sentence_details text NULL, new_location_details text NULL, new_is_expunged bool NULL, CONSTRAINT criminal_records_log_pkey PRIMARY KEY (id), CONSTRAINT criminal_records_log_changed_by_user_id_fkey FOREIGN KEY (changed_by_user_id) REFERENCES public.users(id));
CREATE INDEX IF NOT EXISTS idx_criminal_records_log_changed_user_time ON public.criminal_records_log USING btree (changed_by_user_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_criminal_records_log_record_time ON public.criminal_records_log USING btree (criminal_record_id, changed_at DESC);

-- Permissions

ALTER TABLE public.criminal_records_log OWNER TO postgres;
GRANT ALL ON TABLE public.criminal_records_log TO postgres;


-- public.death_records definition

-- Drop table

-- DROP TABLE public.death_records;

CREATE TABLE IF NOT EXISTS public.death_records ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, person_id int8 NOT NULL, death_date timestamptz NOT NULL, place_of_death varchar(255) NULL, cause_of_death text NULL, doctor_id int8 NULL, icd_10_code varchar(10) NULL, kin_contact_id int8 NULL, notified_next_of_kin bool DEFAULT false NULL, hospital_user_id int4 NULL, CONSTRAINT death_records_person_id_key UNIQUE (person_id), CONSTRAINT death_records_pkey PRIMARY KEY (id), CONSTRAINT death_records_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.person(id), CONSTRAINT death_records_hospital_user_id_fkey FOREIGN KEY (hospital_user_id) REFERENCES public.users(id), CONSTRAINT death_records_kin_contact_id_fkey FOREIGN KEY (kin_contact_id) REFERENCES public.person(id), CONSTRAINT death_records_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.person(id));
CREATE INDEX IF NOT EXISTS idx_death_records_hospital_user_id ON public.death_records USING btree (hospital_user_id);

-- Table Triggers

DROP TRIGGER IF EXISTS trg_on_dath_deactivate_all ON public.death_records;
create trigger trg_on_dath_deactivate_all after
insert
    on
    public.death_records for each row execute function handle_person_death();

-- Permissions

ALTER TABLE public.death_records OWNER TO postgres;
GRANT ALL ON TABLE public.death_records TO postgres;


-- public.education definition

-- Drop table

-- DROP TABLE public.education;

CREATE TABLE IF NOT EXISTS public.education ( id bigserial NOT NULL, person_id int8 NOT NULL, university_name varchar(255) NOT NULL, major varchar(150) NOT NULL, degree_type varchar(50) NULL, gpa numeric(4, 2) NULL, study_mode varchar(50) NULL, start_date date NULL, graduation_date date NULL, certificate_url varchar(255) NULL, is_verified bool DEFAULT false NULL, created_at timestamptz DEFAULT CURRENT_TIMESTAMP NULL, CONSTRAINT education_pkey PRIMARY KEY (id), CONSTRAINT fk_person_education FOREIGN KEY (person_id) REFERENCES public.person(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS idx_education_degree ON public.education USING btree (degree_type);
CREATE INDEX IF NOT EXISTS idx_education_person_id ON public.education USING btree (person_id);

-- Permissions

ALTER TABLE public.education OWNER TO postgres;
GRANT ALL ON TABLE public.education TO postgres;


-- public.employment definition

-- Drop table

-- DROP TABLE public.employment;

CREATE TABLE IF NOT EXISTS public.employment ( id bigserial NOT NULL, person_id int8 NOT NULL, company_id int8 NOT NULL, job_title varchar(150) NOT NULL, department varchar(100) NULL, employment_type varchar(50) NULL, salary numeric(15, 2) DEFAULT 0.00 NULL, is_active bool DEFAULT true NULL, start_date date NOT NULL, end_date date NULL, manager_id int8 NULL, work_location varchar(255) NULL, CONSTRAINT employment_pkey PRIMARY KEY (id), CONSTRAINT fk_manager FOREIGN KEY (manager_id) REFERENCES public.person(id) ON DELETE SET NULL, CONSTRAINT fk_person_employment FOREIGN KEY (person_id) REFERENCES public.person(id) ON DELETE CASCADE);
CREATE INDEX IF NOT EXISTS idx_employment_active ON public.employment USING btree (is_active);
CREATE INDEX IF NOT EXISTS idx_employment_company_id ON public.employment USING btree (company_id);
CREATE INDEX IF NOT EXISTS idx_employment_person_id ON public.employment USING btree (person_id);

-- Table Triggers

DROP TRIGGER IF EXISTS trg_check_death_before_job ON public.employment;
create trigger trg_check_death_before_job before
insert
    on
    public.employment for each row execute function block_dead_employment();
DROP TRIGGER IF EXISTS trg_salary_audit ON public.employment;
create trigger trg_salary_audit after
update
    of salary on
    public.employment for each row execute function audit_salary_changes();

-- Permissions

ALTER TABLE public.employment OWNER TO postgres;
GRANT ALL ON TABLE public.employment TO postgres;


-- public.marriage definition

-- Drop table

-- DROP TABLE public.marriage;

CREATE TABLE IF NOT EXISTS public.marriage ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, contract_no int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, husband_id int8 NOT NULL, wife_id int8 NOT NULL, marriage_date timestamptz NOT NULL, "valid" bool DEFAULT true NULL, end_marriage_time timestamptz NULL, end_reason varchar(50) NULL, witness_1_id int8 NULL, witness_2_id int8 NULL, dowry_amount numeric(12, 2) NULL, notary_id int8 NULL, CONSTRAINT check_not_self_marriage CHECK ((husband_id <> wife_id)), CONSTRAINT marriage_contract_no_key UNIQUE (contract_no), CONSTRAINT marriage_end_reason_check CHECK (((end_reason)::text = ANY (ARRAY[('divorce'::character varying)::text, ('death'::character varying)::text, ('annulment'::character varying)::text, ('Khula'::character varying)::text]))), CONSTRAINT marriage_pkey PRIMARY KEY (id), CONSTRAINT marriage_husband_id_fkey FOREIGN KEY (husband_id) REFERENCES public.person(id), CONSTRAINT marriage_notary_id_fkey FOREIGN KEY (notary_id) REFERENCES public.users(id), CONSTRAINT marriage_wife_id_fkey FOREIGN KEY (wife_id) REFERENCES public.person(id), CONSTRAINT marriage_witness_1_id_fkey FOREIGN KEY (witness_1_id) REFERENCES public.person(id), CONSTRAINT marriage_witness_2_id_fkey FOREIGN KEY (witness_2_id) REFERENCES public.person(id));
CREATE INDEX IF NOT EXISTS idx_marriage_husband_valid ON public.marriage USING btree (husband_id) WHERE (valid = true);
CREATE INDEX IF NOT EXISTS idx_marriage_wife_valid ON public.marriage USING btree (wife_id) WHERE (valid = true);
CREATE UNIQUE INDEX IF NOT EXISTS idx_single_active_husband ON public.marriage USING btree (wife_id) WHERE (valid = true);

-- Table Triggers

DROP TRIGGER IF EXISTS trg_limit_wives ON public.marriage;
create trigger trg_limit_wives before
insert
    on
    public.marriage for each row execute function check_max_wives();
DROP TRIGGER IF EXISTS trg_prevent_incest ON public.marriage;
create trigger trg_prevent_incest before
insert
    on
    public.marriage for each row execute function check_incest_prevention();
DROP TRIGGER IF EXISTS trg_marriage_audit ON public.marriage;
create trigger trg_marriage_audit after
insert
    or
delete
    or
update
    on
    public.marriage for each row execute function log_marriage_changes();

-- Permissions

ALTER TABLE public.marriage OWNER TO postgres;
GRANT ALL ON TABLE public.marriage TO postgres;


-- public.marriage_audit definition

-- Drop table

-- DROP TABLE public.marriage_audit;

CREATE TABLE IF NOT EXISTS public.marriage_audit ( id bigserial NOT NULL, marriage_id int8 NULL, operation varchar(10) NULL, changed_at timestamptz DEFAULT now() NULL, changed_by varchar(100) DEFAULT CURRENT_USER NULL, old_husband_id int8 NULL, old_wife_id int8 NULL, old_marriage_date timestamptz NULL, old_valid bool NULL, old_end_reason varchar(50) NULL, old_end_marriage_time timestamp NULL, new_husband_id int8 NULL, new_wife_id int8 NULL, new_marriage_date timestamptz NULL, new_valid bool NULL, new_end_reason varchar(50) NULL, new_end_marriage_time timestamp NULL, changed_by_user_id int8 NULL, CONSTRAINT marriage_audit_pkey PRIMARY KEY (id), CONSTRAINT marriage_audit_changed_by_user_id_fkey FOREIGN KEY (changed_by_user_id) REFERENCES public.users(id));
CREATE INDEX IF NOT EXISTS idx_marriage_audit_changed_user_time ON public.marriage_audit USING btree (changed_by_user_id, changed_at DESC);

-- Permissions

ALTER TABLE public.marriage_audit OWNER TO postgres;
GRANT ALL ON TABLE public.marriage_audit TO postgres;


-- public.medical_records definition

-- Drop table

-- DROP TABLE public.medical_records;

CREATE TABLE IF NOT EXISTS public.medical_records ( id bigserial NOT NULL, person_id int8 NOT NULL, blood_type varchar(3) NULL, height_cm numeric(4, 1) NULL, weight_kg numeric(5, 1) NULL, smoker bool NULL, chronic_conditions text NULL, last_checkup_date date NULL, CONSTRAINT medical_records_pkey PRIMARY KEY (id), CONSTRAINT medical_records_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.person(id));

-- Permissions

ALTER TABLE public.medical_records OWNER TO postgres;
GRANT ALL ON TABLE public.medical_records TO postgres;


-- public.passports definition

-- Drop table

-- DROP TABLE public.passports;

CREATE TABLE IF NOT EXISTS public.passports ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, person_id int8 NOT NULL, passport_number varchar(20) NOT NULL, issue_date date NULL, expiry_date date NULL, is_active bool DEFAULT true NULL, CONSTRAINT passports_passport_number_key UNIQUE (passport_number), CONSTRAINT passports_pkey PRIMARY KEY (id), CONSTRAINT passports_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.person(id));
CREATE INDEX IF NOT EXISTS idx_passports_person_active ON public.passports USING btree (person_id) WHERE (is_active = true);

-- Table Triggers

DROP TRIGGER IF EXISTS trg_no_passport_overlap ON public.passports;
create trigger trg_no_passport_overlap before
insert
    on
    public.passports for each row execute function check_passport_overlap();

-- Permissions

ALTER TABLE public.passports OWNER TO postgres;
GRANT ALL ON TABLE public.passports TO postgres;


-- public.salary_audit definition

-- Drop table

-- DROP TABLE public.salary_audit;

CREATE TABLE IF NOT EXISTS public.salary_audit ( id serial4 NOT NULL, employment_id int8 NULL, old_salary numeric(15, 2) NULL, new_salary numeric(15, 2) NULL, changed_at timestamptz DEFAULT now() NULL, changed_by_user varchar(100) DEFAULT CURRENT_USER NULL, CONSTRAINT salary_audit_pkey PRIMARY KEY (id), CONSTRAINT salary_audit_employment_id_fkey FOREIGN KEY (employment_id) REFERENCES public.employment(id) ON DELETE CASCADE);

-- Permissions

ALTER TABLE public.salary_audit OWNER TO postgres;
GRANT ALL ON TABLE public.salary_audit TO postgres;


-- public.birth_records definition

-- Drop table

-- DROP TABLE public.birth_records;

CREATE TABLE IF NOT EXISTS public.birth_records ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, birth_certificate_no int8 NOT NULL, child_id int8 NOT NULL, marriage_id int8 NULL, hospital_name varchar(255) NULL, doctor_name varchar(255) NULL, birth_weight_kg numeric(4, 2) NULL, birth_date_time timestamptz NOT NULL, wilaya_code bpchar(2) NULL, commune_code bpchar(4) NULL, apgar_score int2 NULL, CONSTRAINT birth_records_birth_certificate_no_key UNIQUE (birth_certificate_no), CONSTRAINT birth_records_child_id_key UNIQUE (child_id), CONSTRAINT birth_records_pkey PRIMARY KEY (id), CONSTRAINT birth_records_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.person(id), CONSTRAINT birth_records_marriage_id_fkey FOREIGN KEY (marriage_id) REFERENCES public.marriage(id));
CREATE INDEX IF NOT EXISTS idx_birth_records_marriage_id ON public.birth_records USING btree (marriage_id);

-- Table Triggers

DROP TRIGGER IF EXISTS trg_birth_records_audit ON public.birth_records;
create trigger trg_birth_records_audit after
insert
    or
delete
    or
update
    on
    public.birth_records for each row execute function log_birth_record_changes();

-- Permissions

ALTER TABLE public.birth_records OWNER TO postgres;
GRANT ALL ON TABLE public.birth_records TO postgres;



-- DROP FUNCTION public.add_divorce(int8, timestamptz, varchar);

CREATE OR REPLACE FUNCTION public.add_divorce(p_marriage_id bigint, p_end_date timestamp with time zone, p_end_reason character varying DEFAULT 'divorce'::character varying)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN

    IF NOT EXISTS (SELECT 1 FROM marriage WHERE id = p_marriage_id) THEN
        RAISE EXCEPTION 'Marriage not found'
            USING ERRCODE = 'P0001';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM marriage WHERE id = p_marriage_id AND valid = true) THEN
        RAISE EXCEPTION 'Marriage already dissolved'
            USING ERRCODE = 'P0002';
    END IF;

    UPDATE marriage
    SET valid             = false,
        end_marriage_time = p_end_date,
        end_reason        = p_end_reason
    WHERE id = p_marriage_id;

    UPDATE person SET marital_status = 'divorced'
    WHERE id IN (
        SELECT husband_id FROM marriage WHERE id = p_marriage_id
        UNION
        SELECT wife_id    FROM marriage WHERE id = p_marriage_id
    );

END;
$function$
;

-- Permissions

ALTER FUNCTION public.add_divorce(int8, timestamptz, varchar) OWNER TO postgres;
GRANT ALL ON FUNCTION public.add_divorce(int8, timestamptz, varchar) TO public;
GRANT ALL ON FUNCTION public.add_divorce(int8, timestamptz, varchar) TO postgres;

-- DROP FUNCTION public.add_marriage(int8, int8, timestamptz, numeric, int8, int8, int8);

CREATE OR REPLACE FUNCTION public.add_marriage(p_husband_id bigint, p_wife_id bigint, p_marriage_date timestamp with time zone, p_dowry_amount numeric DEFAULT NULL::numeric, p_witness_1_id bigint DEFAULT NULL::bigint, p_witness_2_id bigint DEFAULT NULL::bigint, p_notary_id bigint DEFAULT NULL::bigint)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN

  
    IF EXISTS (SELECT 1 FROM death_records WHERE person_id = p_husband_id) THEN
        RAISE EXCEPTION 'Husband is deceased' USING ERRCODE = 'P0003';
    END IF;

    IF EXISTS (SELECT 1 FROM death_records WHERE person_id = p_wife_id) THEN
        RAISE EXCEPTION 'Wife is deceased' USING ERRCODE = 'P0004';
    END IF;


    IF (SELECT date_of_birth FROM person WHERE id = p_husband_id)
        > (p_marriage_date::date - interval '18 years') THEN
        RAISE EXCEPTION 'Husband is under 18' USING ERRCODE = 'P0005';
    END IF;

    IF (SELECT date_of_birth FROM person WHERE id = p_wife_id)
        > (p_marriage_date::date - interval '18 years') THEN
        RAISE EXCEPTION 'Wife is under 18' USING ERRCODE = 'P0006';
    END IF;

    IF EXISTS (SELECT 1 FROM marriage WHERE wife_id = p_wife_id AND valid = true) THEN
        RAISE EXCEPTION 'Wife is already married' USING ERRCODE = 'P0007';
    END IF;

    IF p_witness_1_id IS NOT NULL AND
       EXISTS (SELECT 1 FROM death_records WHERE person_id = p_witness_1_id) THEN
        RAISE EXCEPTION 'Witness 1 is deceased' USING ERRCODE = 'P0009';
    END IF;

    IF p_witness_2_id IS NOT NULL AND
       EXISTS (SELECT 1 FROM death_records WHERE person_id = p_witness_2_id) THEN
        RAISE EXCEPTION 'Witness 2 is deceased' USING ERRCODE = 'P0010';
    END IF;

   
    IF p_witness_1_id IS NOT NULL AND
       (SELECT date_of_birth FROM person WHERE id = p_witness_1_id)
        > (p_marriage_date::date - interval '18 years') THEN
        RAISE EXCEPTION 'Witness 1 is under 18' USING ERRCODE = 'P0011';
    END IF;

    IF p_witness_2_id IS NOT NULL AND
       (SELECT date_of_birth FROM person WHERE id = p_witness_2_id)
        > (p_marriage_date::date - interval '18 years') THEN
        RAISE EXCEPTION 'Witness 2 is under 18' USING ERRCODE = 'P0012';
    END IF;

   
    UPDATE person SET marital_status = 'married'
    WHERE id = p_husband_id OR id = p_wife_id;


    INSERT INTO marriage (
        husband_id, wife_id, marriage_date,
        dowry_amount, witness_1_id, witness_2_id,
        notary_id, valid
    ) VALUES (
        p_husband_id, p_wife_id, p_marriage_date,
        p_dowry_amount, p_witness_1_id, p_witness_2_id,
        p_notary_id, true
    );

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'Invalid reference — check husband, wife, witness, or notary IDs'
            USING ERRCODE = 'P0008';
END;
$function$
;

-- Permissions

ALTER FUNCTION public.add_marriage(int8, int8, timestamptz, numeric, int8, int8, int8) OWNER TO postgres;
GRANT ALL ON FUNCTION public.add_marriage(int8, int8, timestamptz, numeric, int8, int8, int8) TO public;
GRANT ALL ON FUNCTION public.add_marriage(int8, int8, timestamptz, numeric, int8, int8, int8) TO postgres;

-- DROP FUNCTION public.audit_salary_changes();

CREATE OR REPLACE FUNCTION public.audit_salary_changes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin 
	
	insert into salary_audit (employment_id, old_salary, new_salary, changed_by_user)
	values (old.id,old.salary,new.salary,current_user);
	
return new;
end;
$function$
;

-- Permissions

ALTER FUNCTION public.audit_salary_changes() OWNER TO postgres;
GRANT ALL ON FUNCTION public.audit_salary_changes() TO public;
GRANT ALL ON FUNCTION public.audit_salary_changes() TO postgres;

-- DROP FUNCTION public.block_dead_employment();

CREATE OR REPLACE FUNCTION public.block_dead_employment()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF EXISTS (SELECT 1 FROM death_records WHERE person_id = NEW.person_id) THEN
        RAISE EXCEPTION 'this person is already dead';
    END IF;
    RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.block_dead_employment() OWNER TO postgres;
GRANT ALL ON FUNCTION public.block_dead_employment() TO public;
GRANT ALL ON FUNCTION public.block_dead_employment() TO postgres;

-- DROP FUNCTION public.check_incest_prevention();

CREATE OR REPLACE FUNCTION public.check_incest_prevention()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
declare 
	w_dad bigint ;w_mom bigint;
	h_dad bigint ;h_mom bigint;
begin 
	select dad_id,mom_id into h_dad ,h_mom from person where id = new.husband_id;
	select dad_id,mom_id into w_dad ,w_mom from person where id = new.wife_id;

	if(h_dad = w_dad and h_dad is not null) or (h_mom = w_mom and h_mom is not null) then
		raise exception 'incest is not allowd';
		
	END if;

	return new;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.check_incest_prevention() OWNER TO postgres;
GRANT ALL ON FUNCTION public.check_incest_prevention() TO public;
GRANT ALL ON FUNCTION public.check_incest_prevention() TO postgres;

-- DROP FUNCTION public.check_max_wives();

CREATE OR REPLACE FUNCTION public.check_max_wives()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF (SELECT count(*) FROM marriage WHERE husband_id = NEW.husband_id AND valid = true) >= 4 THEN
        RAISE EXCEPTION 'alredy have 4 wifes';
    END IF;
    RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.check_max_wives() OWNER TO postgres;
GRANT ALL ON FUNCTION public.check_max_wives() TO public;
GRANT ALL ON FUNCTION public.check_max_wives() TO postgres;

-- DROP FUNCTION public.check_passport_overlap();

CREATE OR REPLACE FUNCTION public.check_passport_overlap()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin 
	if (
	select count(*) from passports 
	where person_id=new.person_id 
	and is_active=true
	)>0 then
	raise exception 'alredy have an active passport';
	end if;
	return new;
end;
$function$
;

-- Permissions

ALTER FUNCTION public.check_passport_overlap() OWNER TO postgres;
GRANT ALL ON FUNCTION public.check_passport_overlap() TO public;
GRANT ALL ON FUNCTION public.check_passport_overlap() TO postgres;

-- DROP FUNCTION public.get_next_act_number(bpchar, bpchar, bpchar);

CREATE OR REPLACE FUNCTION public.get_next_act_number(p_wilaya character, p_commune character, p_year character)
 RETURNS integer
 LANGUAGE plpgsql
AS $function$
DECLARE
    next_act INT;
BEGIN
    -- first try to increment existing row
    UPDATE act_number_tracker
    SET last_act_no = last_act_no + 1
    WHERE wilaya_code  = p_wilaya
      AND commune_code = p_commune
      AND birth_year   = p_year
    RETURNING last_act_no INTO next_act;

    -- if no row was found, create a new one starting from 1
    IF NOT FOUND THEN
        INSERT INTO act_number_tracker (wilaya_code, commune_code, birth_year, last_act_no)
        VALUES (p_wilaya, p_commune, p_year, 1)
        RETURNING last_act_no INTO next_act;
    END IF;

    RETURN next_act;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.get_next_act_number(bpchar, bpchar, bpchar) OWNER TO postgres;
GRANT ALL ON FUNCTION public.get_next_act_number(bpchar, bpchar, bpchar) TO public;
GRANT ALL ON FUNCTION public.get_next_act_number(bpchar, bpchar, bpchar) TO postgres;

-- DROP FUNCTION public.handle_person_death();

CREATE OR REPLACE FUNCTION public.handle_person_death()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN  
    -- deactivate passports
    UPDATE passports 
    SET is_active = false
    WHERE person_id = NEW.person_id;
		
        -- mark deceased person status
        UPDATE person
        SET marital_status = 'deceased'
        WHERE id = NEW.person_id;

        -- mark the still-living spouse as widowed when marriage ends by death
        UPDATE person p
        SET marital_status = 'widowed'
        WHERE p.id IN (
            SELECT CASE
                             WHEN m.husband_id = NEW.person_id THEN m.wife_id
                             ELSE m.husband_id
                         END
            FROM marriage m
            WHERE (m.husband_id = NEW.person_id OR m.wife_id = NEW.person_id)
                AND m.valid = true
        )
        AND NOT EXISTS (
            SELECT 1 FROM death_records d
            WHERE d.person_id = p.id
        );

    -- close any active marriage
    UPDATE marriage
    SET valid = false,
        end_marriage_time = NEW.death_date,
        end_reason = 'death'
    WHERE (husband_id = NEW.person_id OR wife_id = NEW.person_id)
      AND valid = true;
	
    -- deactivate employment
    UPDATE employment 
    SET is_active = false
    WHERE person_id = NEW.person_id
      AND is_active = true;
	
    RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.handle_person_death() OWNER TO postgres;
GRANT ALL ON FUNCTION public.handle_person_death() TO public;
GRANT ALL ON FUNCTION public.handle_person_death() TO postgres;

-- DROP FUNCTION public.inherit_father_last_name();

CREATE OR REPLACE FUNCTION public.inherit_father_last_name()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    father_last_name varchar(255);
BEGIN
    IF NEW.dad_id IS NOT NULL THEN
        SELECT last_name INTO father_last_name
        FROM person
        WHERE id = NEW.dad_id;

        NEW.last_name := father_last_name;
    END IF;

    RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.inherit_father_last_name() OWNER TO postgres;
GRANT ALL ON FUNCTION public.inherit_father_last_name() TO public;
GRANT ALL ON FUNCTION public.inherit_father_last_name() TO postgres;

-- DROP FUNCTION public.log_birth_record_changes();

CREATE OR REPLACE FUNCTION public.log_birth_record_changes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_user_id bigint;
BEGIN
    -- Get current app user
    BEGIN
        v_user_id := current_setting('app.current_user_id')::bigint;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL; 
    END;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO birth_records_log (
            birth_record_id, operation, changed_by_user_id,
            new_birth_certificate_no, new_child_id, new_doctor_name, 
            new_birth_weight_kg, new_marriage_id, new_birth_date_time
        ) VALUES (
            NEW.id, 'INSERT', v_user_id,
            NEW.birth_certificate_no, NEW.child_id, NEW.doctor_name, 
            NEW.birth_weight_kg, NEW.marriage_id, NEW.birth_date_time
        );
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO birth_records_log (
            birth_record_id, operation, changed_by_user_id,
            old_birth_certificate_no, old_child_id, old_doctor_name, old_birth_weight_kg, old_marriage_id, old_birth_date_time,
            new_birth_certificate_no, new_child_id, new_doctor_name, new_birth_weight_kg, new_marriage_id, new_birth_date_time
        ) VALUES (
            NEW.id, 'UPDATE', v_user_id,
            OLD.birth_certificate_no, OLD.child_id, OLD.doctor_name, OLD.birth_weight_kg, OLD.marriage_id, OLD.birth_date_time,
            NEW.birth_certificate_no, NEW.child_id, NEW.doctor_name, NEW.birth_weight_kg, NEW.marriage_id, NEW.birth_date_time
        );
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO birth_records_log (
            birth_record_id, operation, changed_by_user_id,
            old_birth_certificate_no, old_child_id, old_doctor_name, old_birth_weight_kg, old_marriage_id, old_birth_date_time
        ) VALUES (
            OLD.id, 'DELETE', v_user_id,
            OLD.birth_certificate_no, OLD.child_id, OLD.doctor_name, OLD.birth_weight_kg, OLD.marriage_id, OLD.birth_date_time
        );
    END IF;
    RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.log_birth_record_changes() OWNER TO postgres;
GRANT ALL ON FUNCTION public.log_birth_record_changes() TO public;
GRANT ALL ON FUNCTION public.log_birth_record_changes() TO postgres;

-- DROP FUNCTION public.log_criminal_record_changes();

CREATE OR REPLACE FUNCTION public.log_criminal_record_changes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_user_id bigint;
BEGIN
    BEGIN
        v_user_id := current_setting('app.current_user_id')::bigint;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF TG_OP = 'INSERT' THEN
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
        ) VALUES (
            NEW.id,
            'INSERT',
            v_user_id,
            NEW.person_id,
            NEW.case_number,
            NEW.status,
            NEW.violation_type,
            NEW.disposition,
            NEW.description,
            NEW.occurrence_date,
            NEW.filing_date,
            NEW.fine_amount,
            NEW.sentence_details,
            NEW.location_details,
            NEW.is_expunged
        );

    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO criminal_records_log (
            criminal_record_id,
            operation,
            changed_by_user_id,
            old_person_id,
            old_case_number,
            old_status,
            old_violation_type,
            old_disposition,
            old_description,
            old_occurrence_date,
            old_filing_date,
            old_fine_amount,
            old_sentence_details,
            old_location_details,
            old_is_expunged,
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
        ) VALUES (
            NEW.id,
            'UPDATE',
            v_user_id,
            OLD.person_id,
            OLD.case_number,
            OLD.status,
            OLD.violation_type,
            OLD.disposition,
            OLD.description,
            OLD.occurrence_date,
            OLD.filing_date,
            OLD.fine_amount,
            OLD.sentence_details,
            OLD.location_details,
            OLD.is_expunged,
            NEW.person_id,
            NEW.case_number,
            NEW.status,
            NEW.violation_type,
            NEW.disposition,
            NEW.description,
            NEW.occurrence_date,
            NEW.filing_date,
            NEW.fine_amount,
            NEW.sentence_details,
            NEW.location_details,
            NEW.is_expunged
        );

    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO criminal_records_log (
            criminal_record_id,
            operation,
            changed_by_user_id,
            old_person_id,
            old_case_number,
            old_status,
            old_violation_type,
            old_disposition,
            old_description,
            old_occurrence_date,
            old_filing_date,
            old_fine_amount,
            old_sentence_details,
            old_location_details,
            old_is_expunged
        ) VALUES (
            OLD.id,
            'DELETE',
            v_user_id,
            OLD.person_id,
            OLD.case_number,
            OLD.status,
            OLD.violation_type,
            OLD.disposition,
            OLD.description,
            OLD.occurrence_date,
            OLD.filing_date,
            OLD.fine_amount,
            OLD.sentence_details,
            OLD.location_details,
            OLD.is_expunged
        );
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.log_criminal_record_changes() OWNER TO postgres;
GRANT ALL ON FUNCTION public.log_criminal_record_changes() TO public;
GRANT ALL ON FUNCTION public.log_criminal_record_changes() TO postgres;

-- DROP FUNCTION public.log_marriage_changes();

CREATE OR REPLACE FUNCTION public.log_marriage_changes()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_user_id bigint;
BEGIN
   
    BEGIN
        v_user_id := current_setting('app.current_user_id')::bigint;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL; 
    END;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO marriage_audit (
            marriage_id, operation, changed_by_user_id,
            new_husband_id, new_wife_id, new_marriage_date,
            new_valid, new_end_reason, new_end_marriage_time
        ) VALUES (
            NEW.id, 'INSERT', v_user_id,
            NEW.husband_id, NEW.wife_id, NEW.marriage_date,
            NEW.valid, NEW.end_reason, NEW.end_marriage_time
        );

    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO marriage_audit (
            marriage_id, operation, changed_by_user_id,
            old_husband_id, old_wife_id, old_marriage_date,
            old_valid, old_end_reason, old_end_marriage_time,
            new_husband_id, new_wife_id, new_marriage_date,
            new_valid, new_end_reason, new_end_marriage_time
        ) VALUES (
            NEW.id, 'UPDATE', v_user_id,
            OLD.husband_id, OLD.wife_id, OLD.marriage_date,
            OLD.valid, OLD.end_reason, OLD.end_marriage_time,
            NEW.husband_id, NEW.wife_id, NEW.marriage_date,
            NEW.valid, NEW.end_reason, NEW.end_marriage_time
        );

    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO marriage_audit (
            marriage_id, operation, changed_by_user_id,
            old_husband_id, old_wife_id, old_marriage_date,
            old_valid, old_end_reason, old_end_marriage_time
        ) VALUES (
            OLD.id, 'DELETE', v_user_id,
            OLD.husband_id, OLD.wife_id, OLD.marriage_date,
            OLD.valid, OLD.end_reason, OLD.end_marriage_time
        );
    END IF;

    RETURN NEW;
END;
$function$
;

-- Permissions

ALTER FUNCTION public.log_marriage_changes() OWNER TO postgres;
GRANT ALL ON FUNCTION public.log_marriage_changes() TO public;
GRANT ALL ON FUNCTION public.log_marriage_changes() TO postgres;


-- Permissions

GRANT ALL ON SCHEMA public TO pg_database_owner;
GRANT USAGE ON SCHEMA public TO public;