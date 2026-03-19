--data base mcd
--https://drawsql.app/teams/fijla/diagrams/digital-id

-- DROP SCHEMA public;

CREATE SCHEMA public AUTHORIZATION pg_database_owner;

COMMENT ON SCHEMA public IS 'standard public schema';

-- DROP SEQUENCE public.assets_id_seq;

CREATE SEQUENCE public.assets_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.assets_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.assets_id_seq TO postgres;

-- DROP SEQUENCE public.birth_records_id_seq;

CREATE SEQUENCE public.birth_records_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.birth_records_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.birth_records_id_seq TO postgres;

-- DROP SEQUENCE public.death_records_id_seq;

CREATE SEQUENCE public.death_records_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.death_records_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.death_records_id_seq TO postgres;

-- DROP SEQUENCE public.employment_id_seq;

CREATE SEQUENCE public.employment_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.employment_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.employment_id_seq TO postgres;

-- DROP SEQUENCE public.marriage_contract_no_seq;

CREATE SEQUENCE public.marriage_contract_no_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.marriage_contract_no_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.marriage_contract_no_seq TO postgres;

-- DROP SEQUENCE public.marriage_id_seq;

CREATE SEQUENCE public.marriage_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.marriage_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.marriage_id_seq TO postgres;

-- DROP SEQUENCE public.medical_records_id_seq;

CREATE SEQUENCE public.medical_records_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.medical_records_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.medical_records_id_seq TO postgres;

-- DROP SEQUENCE public.national_id_seq;

CREATE SEQUENCE public.national_id_seq
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

CREATE SEQUENCE public.passports_id_seq
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

CREATE SEQUENCE public.person_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.person_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.person_id_seq TO postgres;

-- DROP SEQUENCE public.roles_id_seq;

CREATE SEQUENCE public.roles_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.roles_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.roles_id_seq TO postgres;

-- DROP SEQUENCE public.salary_audit_id_seq;

CREATE SEQUENCE public.salary_audit_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.salary_audit_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.salary_audit_id_seq TO postgres;

-- DROP SEQUENCE public.users_id_seq;

CREATE SEQUENCE public.users_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.users_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.users_id_seq TO postgres;
-- public.act_number_tracker definition

-- Drop table

-- DROP TABLE public.act_number_tracker;

CREATE TABLE public.act_number_tracker ( wilaya_code bpchar(2) NOT NULL, commune_code bpchar(4) NOT NULL, birth_year bpchar(2) NOT NULL, last_act_no int4 DEFAULT 0 NOT NULL, CONSTRAINT act_number_tracker_pkey PRIMARY KEY (wilaya_code, commune_code, birth_year));

-- Permissions

ALTER TABLE public.act_number_tracker OWNER TO postgres;
GRANT ALL ON TABLE public.act_number_tracker TO postgres;


-- public.roles definition

-- Drop table

-- DROP TABLE public.roles;

CREATE TABLE public.roles ( id serial4 NOT NULL, "name" varchar(50) NOT NULL, CONSTRAINT roles_name_key UNIQUE (name), CONSTRAINT roles_pkey PRIMARY KEY (id));

-- Permissions

ALTER TABLE public.roles OWNER TO postgres;
GRANT ALL ON TABLE public.roles TO postgres;


-- public.person definition

-- Drop table

-- DROP TABLE public.person;

CREATE TABLE public.person ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, national_id int8 NOT NULL, first_name varchar(255) NOT NULL, last_name varchar(255) NOT NULL, email varchar(255) NULL, date_of_birth date NOT NULL, phone_number varchar(20) NULL, gender bool NOT NULL, dad_id int8 NULL, mom_id int8 NULL, marital_status varchar(20) DEFAULT 'single'::character varying NOT NULL, CONSTRAINT check_lineage CHECK (((id <> dad_id) AND (id <> mom_id) AND (dad_id <> mom_id))), CONSTRAINT person_email_key UNIQUE (email), CONSTRAINT person_national_id_key UNIQUE (national_id), CONSTRAINT person_pkey PRIMARY KEY (id), CONSTRAINT person_dad_id_fkey FOREIGN KEY (dad_id) REFERENCES public.person(id), CONSTRAINT person_mom_id_fkey FOREIGN KEY (mom_id) REFERENCES public.person(id));

-- Table Triggers

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

CREATE TABLE public.users ( id serial4 NOT NULL, username varchar(100) NOT NULL, "password" varchar(255) NOT NULL, role_id int4 DEFAULT 1 NULL, person_id int8 NULL, created_at timestamptz DEFAULT now() NULL, wilaya_code bpchar(2) NULL, commune_code bpchar(4) NULL, refresh_token text NULL, CONSTRAINT users_person_id_key UNIQUE (person_id), CONSTRAINT users_pkey PRIMARY KEY (id), CONSTRAINT users_username_key UNIQUE (username), CONSTRAINT users_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.person(id), CONSTRAINT users_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id));

-- Permissions

ALTER TABLE public.users OWNER TO postgres;
GRANT ALL ON TABLE public.users TO postgres;


-- public.assets definition

-- Drop table

-- DROP TABLE public.assets;

CREATE TABLE public.assets ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, owner_id int8 NOT NULL, asset_type varchar(100) NULL, registration_number varchar(255) NULL, date_owned timestamptz DEFAULT now() NULL, estimated_value numeric(15, 2) NULL, CONSTRAINT assets_pkey PRIMARY KEY (id), CONSTRAINT assets_registration_number_key UNIQUE (registration_number), CONSTRAINT assets_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.person(id));

-- Permissions

ALTER TABLE public.assets OWNER TO postgres;
GRANT ALL ON TABLE public.assets TO postgres;


-- public.death_records definition

-- Drop table

-- DROP TABLE public.death_records;

CREATE TABLE public.death_records ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, person_id int8 NOT NULL, death_date timestamptz NOT NULL, place_of_death varchar(255) NULL, cause_of_death text NULL, doctor_id int8 NULL, icd_10_code varchar(10) NULL, kin_contact_id int8 NULL, notified_next_of_kin bool DEFAULT false NULL, hospital_user_id int4 NULL, CONSTRAINT death_records_person_id_key UNIQUE (person_id), CONSTRAINT death_records_pkey PRIMARY KEY (id), CONSTRAINT death_records_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.person(id), CONSTRAINT death_records_hospital_user_id_fkey FOREIGN KEY (hospital_user_id) REFERENCES public.users(id), CONSTRAINT death_records_kin_contact_id_fkey FOREIGN KEY (kin_contact_id) REFERENCES public.person(id), CONSTRAINT death_records_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.person(id));

-- Table Triggers

create trigger trg_on_dath_deactivate_all after
insert
    on
    public.death_records for each row execute function handle_person_death();

-- Permissions

ALTER TABLE public.death_records OWNER TO postgres;
GRANT ALL ON TABLE public.death_records TO postgres;


-- public.employment definition

-- Drop table

-- DROP TABLE public.employment;

CREATE TABLE public.employment ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, person_id int8 NOT NULL, job_title varchar(255) NULL, salary numeric(15, 2) NULL, start_date date NULL, is_active bool DEFAULT true NULL, company_id int8 NULL, CONSTRAINT employment_pkey PRIMARY KEY (id), CONSTRAINT employment_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.person(id));

-- Table Triggers

create trigger trg_check_death_before_job before
insert
    on
    public.employment for each row execute function block_dead_employment();
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

CREATE TABLE public.marriage ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, contract_no int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, husband_id int8 NOT NULL, wife_id int8 NOT NULL, marriage_date timestamptz NOT NULL, "valid" bool DEFAULT true NULL, end_marriage_time timestamptz NULL, end_reason varchar(50) NULL, witness_1_id int8 NULL, witness_2_id int8 NULL, dowry_amount numeric(12, 2) NULL, notary_id int8 NULL, CONSTRAINT check_not_self_marriage CHECK ((husband_id <> wife_id)), CONSTRAINT marriage_contract_no_key UNIQUE (contract_no), CONSTRAINT marriage_end_reason_check CHECK (((end_reason)::text = ANY ((ARRAY['divorce'::character varying, 'death'::character varying, 'annulment'::character varying, 'Khula'::character varying])::text[]))), CONSTRAINT marriage_pkey PRIMARY KEY (id), CONSTRAINT marriage_husband_id_fkey FOREIGN KEY (husband_id) REFERENCES public.person(id), CONSTRAINT marriage_notary_id_fkey FOREIGN KEY (notary_id) REFERENCES public.users(id), CONSTRAINT marriage_wife_id_fkey FOREIGN KEY (wife_id) REFERENCES public.person(id), CONSTRAINT marriage_witness_1_id_fkey FOREIGN KEY (witness_1_id) REFERENCES public.person(id), CONSTRAINT marriage_witness_2_id_fkey FOREIGN KEY (witness_2_id) REFERENCES public.person(id));
CREATE UNIQUE INDEX idx_single_active_husband ON public.marriage USING btree (wife_id) WHERE (valid = true);

-- Table Triggers

create trigger trg_limit_wives before
insert
    on
    public.marriage for each row execute function check_max_wives();
create trigger trg_prevent_incest before
insert
    on
    public.marriage for each row execute function check_incest_prevention();

-- Permissions

ALTER TABLE public.marriage OWNER TO postgres;
GRANT ALL ON TABLE public.marriage TO postgres;


-- public.medical_records definition

-- Drop table

-- DROP TABLE public.medical_records;

CREATE TABLE public.medical_records ( id bigserial NOT NULL, person_id int8 NOT NULL, blood_type varchar(3) NULL, height_cm numeric(4, 1) NULL, weight_kg numeric(5, 1) NULL, smoker bool NULL, chronic_conditions text NULL, last_checkup_date date NULL, CONSTRAINT medical_records_pkey PRIMARY KEY (id), CONSTRAINT medical_records_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.person(id));

-- Permissions

ALTER TABLE public.medical_records OWNER TO postgres;
GRANT ALL ON TABLE public.medical_records TO postgres;


-- public.passports definition

-- Drop table

-- DROP TABLE public.passports;

CREATE TABLE public.passports ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, person_id int8 NOT NULL, passport_number varchar(20) NOT NULL, issue_date date NULL, expiry_date date NULL, is_active bool DEFAULT true NULL, CONSTRAINT passports_passport_number_key UNIQUE (passport_number), CONSTRAINT passports_pkey PRIMARY KEY (id), CONSTRAINT passports_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.person(id));

-- Table Triggers

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

CREATE TABLE public.salary_audit ( id serial4 NOT NULL, employment_id int8 NULL, old_salary numeric(15, 2) NULL, new_salary numeric(15, 2) NULL, changed_at timestamptz DEFAULT now() NULL, changed_by_user varchar(100) DEFAULT CURRENT_USER NULL, CONSTRAINT salary_audit_pkey PRIMARY KEY (id), CONSTRAINT salary_audit_employment_id_fkey FOREIGN KEY (employment_id) REFERENCES public.employment(id));

-- Permissions

ALTER TABLE public.salary_audit OWNER TO postgres;
GRANT ALL ON TABLE public.salary_audit TO postgres;


-- public.birth_records definition

-- Drop table

-- DROP TABLE public.birth_records;

CREATE TABLE public.birth_records ( id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL, birth_certificate_no int8 NOT NULL, child_id int8 NOT NULL, marriage_id int8 NULL, hospital_name varchar(255) NULL, doctor_name varchar(255) NULL, birth_weight_kg numeric(4, 2) NULL, birth_datetime timestamptz NOT NULL, wilaya_code bpchar(2) NULL, commune_code bpchar(4) NULL, apgar_score int2 NULL, CONSTRAINT birth_records_birth_certificate_no_key UNIQUE (birth_certificate_no), CONSTRAINT birth_records_child_id_key UNIQUE (child_id), CONSTRAINT birth_records_pkey PRIMARY KEY (id), CONSTRAINT birth_records_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.person(id), CONSTRAINT birth_records_marriage_id_fkey FOREIGN KEY (marriage_id) REFERENCES public.marriage(id));

-- Permissions

ALTER TABLE public.birth_records OWNER TO postgres;
GRANT ALL ON TABLE public.birth_records TO postgres;



-- DROP FUNCTION public.add_divorce(int8, timestamptz, varchar);

CREATE OR REPLACE FUNCTION public.add_divorce(p_marriage_id bigint, p_end_date timestamp with time zone, p_end_reason character varying DEFAULT 'divorce'::character varying)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN

    IF NOT EXISTS (SELECT 1 FROM marriage WHERE id = p_marriage_id AND valid = true) THEN
        RAISE EXCEPTION 'Marriage not found or already dissolved';
    END IF;

    UPDATE marriage
    SET
        valid             = false,
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
GRANT ALL ON FUNCTION public.add_divorce(int8, timestamptz, varchar) TO postgres;

-- DROP FUNCTION public.add_marriage(int8, int8, timestamptz, numeric, int8, int8, int8);

CREATE OR REPLACE FUNCTION public.add_marriage(p_husband_id bigint, p_wife_id bigint, p_marriage_date timestamp with time zone, p_dowry_amount numeric DEFAULT NULL::numeric, p_witness_1_id bigint DEFAULT NULL::bigint, p_witness_2_id bigint DEFAULT NULL::bigint, p_notary_id bigint DEFAULT NULL::bigint)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    
    IF EXISTS (SELECT 1 FROM death_records WHERE person_id = p_husband_id) THEN
        RAISE EXCEPTION 'Husband is deceased';
    END IF;

    IF EXISTS (SELECT 1 FROM death_records WHERE person_id = p_wife_id) THEN
        RAISE EXCEPTION 'Wife is deceased';
    END IF;

    
    IF (SELECT date_of_birth FROM person WHERE id = p_husband_id) > (p_marriage_date::date - interval '18 years') THEN
        RAISE EXCEPTION 'Husband is under 18';
    END IF;

    IF (SELECT date_of_birth FROM person WHERE id = p_wife_id) > (p_marriage_date::date - interval '18 years') THEN
        RAISE EXCEPTION 'Wife is under 18';
    END IF;

   
    IF EXISTS (SELECT 1 FROM marriage WHERE wife_id = p_wife_id AND valid = true) THEN
        RAISE EXCEPTION 'Wife is already married';
    END IF;

    INSERT INTO marriage (
        husband_id,
        wife_id,
        marriage_date,
        dowry_amount,
        witness_1_id,
        witness_2_id,
        notary_id,
        valid
    ) VALUES (
        p_husband_id,
        p_wife_id,
        p_marriage_date,
        p_dowry_amount,
        p_witness_1_id,
        p_witness_2_id,
        p_notary_id,
        true
    );

EXCEPTION
    WHEN foreign_key_violation THEN
        RAISE EXCEPTION 'Invalid reference — check husband_id, wife_id, witness IDs, or notary_id';
END;
$function$
;

-- Permissions

ALTER FUNCTION public.add_marriage(int8, int8, timestamptz, numeric, int8, int8, int8) OWNER TO postgres;
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
GRANT ALL ON FUNCTION public.inherit_father_last_name() TO postgres;


-- Permissions

GRANT ALL ON SCHEMA public TO pg_database_owner;
GRANT USAGE ON SCHEMA public TO public;