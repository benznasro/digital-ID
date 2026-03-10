--data base mcd
--https://drawsql.app/teams/fijla/diagrams/digital-id

-- DROP SCHEMA public;

CREATE SCHEMA public AUTHORIZATION pg_database_owner;

-- DROP SEQUENCE public.assets_id_seq;

CREATE SEQUENCE public.assets_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.birth_records_id_seq;

CREATE SEQUENCE public.birth_records_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.death_records_id_seq;

CREATE SEQUENCE public.death_records_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.employment_id_seq;

CREATE SEQUENCE public.employment_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.marriage_contract_no_seq;

CREATE SEQUENCE public.marriage_contract_no_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.marriage_id_seq;

CREATE SEQUENCE public.marriage_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.passports_id_seq;

CREATE SEQUENCE public.passports_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.person_id_seq;

CREATE SEQUENCE public.person_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 9223372036854775807
	START 1
	CACHE 1
	NO CYCLE;
-- DROP SEQUENCE public.salary_audit_id_seq;

CREATE SEQUENCE public.salary_audit_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;-- public.person definition

-- Drop table

-- DROP TABLE public.person;

CREATE TABLE public.person (
	id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	national_id int8 NOT NULL,
	first_name varchar(255) NOT NULL,
	last_name varchar(255) NOT NULL,
	email varchar(255) NULL,
	date_of_birth date NOT NULL,
	phone_number varchar(20) NULL,
	gender bool NOT NULL,
	dad_id int8 NULL,
	mom_id int8 NULL,
	CONSTRAINT check_lineage CHECK (((id <> dad_id) AND (id <> mom_id) AND (dad_id <> mom_id))),
	CONSTRAINT person_email_key UNIQUE (email),
	CONSTRAINT person_national_id_key UNIQUE (national_id),
	CONSTRAINT person_pkey PRIMARY KEY (id),
	CONSTRAINT person_dad_id_fkey FOREIGN KEY (dad_id) REFERENCES public.person(id),
	CONSTRAINT person_mom_id_fkey FOREIGN KEY (mom_id) REFERENCES public.person(id)
);


-- public.assets definition

-- Drop table

-- DROP TABLE public.assets;

CREATE TABLE public.assets (
	id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	owner_id int8 NOT NULL,
	asset_type varchar(100) NULL,
	registration_number varchar(255) NULL,
	date_owned timestamptz DEFAULT now() NULL,
	estimated_value numeric(15, 2) NULL,
	CONSTRAINT assets_pkey PRIMARY KEY (id),
	CONSTRAINT assets_registration_number_key UNIQUE (registration_number),
	CONSTRAINT assets_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.person(id)
);


-- public.death_records definition

-- Drop table

-- DROP TABLE public.death_records;

CREATE TABLE public.death_records (
	id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	person_id int8 NOT NULL,
	death_date timestamptz NOT NULL,
	place_of_death varchar(255) NULL,
	cause_of_death text NULL,
	CONSTRAINT death_records_person_id_key UNIQUE (person_id),
	CONSTRAINT death_records_pkey PRIMARY KEY (id),
	CONSTRAINT death_records_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.person(id)
);

-- Table Triggers

create trigger trg_on_dath_deactivate_all after
insert
    on
    public.death_records for each row execute function handle_person_death();


-- public.employment definition

-- Drop table

-- DROP TABLE public.employment;

CREATE TABLE public.employment (
	id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	person_id int8 NOT NULL,
	job_title varchar(255) NULL,
	salary numeric(15, 2) NULL,
	start_date date NULL,
	is_active bool DEFAULT true NULL,
	company_id int8 NULL,
	CONSTRAINT employment_pkey PRIMARY KEY (id),
	CONSTRAINT employment_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.person(id)
);

-- Table Triggers

create trigger trg_check_death_before_job before
insert
    on
    public.employment for each row execute function block_dead_employment();
create trigger trg_salary_audit after
update
    of salary on
    public.employment for each row execute function audit_salary_changes();


-- public.marriage definition

-- Drop table

-- DROP TABLE public.marriage;

CREATE TABLE public.marriage (
	id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	contract_no int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	husband_id int8 NOT NULL,
	wife_id int8 NOT NULL,
	marriage_date timestamptz NOT NULL,
	"valid" bool DEFAULT true NULL,
	end_marriage_time timestamp NULL,
	end_reason varchar(50) NULL,
	CONSTRAINT check_not_self_marriage CHECK ((husband_id <> wife_id)),
	CONSTRAINT marriage_contract_no_key UNIQUE (contract_no),
	CONSTRAINT marriage_end_reason_check CHECK (((end_reason)::text = ANY ((ARRAY['divorce'::character varying, 'death'::character varying, 'annulment'::character varying, 'Khula'::character varying])::text[]))),
	CONSTRAINT marriage_pkey PRIMARY KEY (id),
	CONSTRAINT marriage_husband_id_fkey FOREIGN KEY (husband_id) REFERENCES public.person(id),
	CONSTRAINT marriage_wife_id_fkey FOREIGN KEY (wife_id) REFERENCES public.person(id)
);
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


-- public.passports definition

-- Drop table

-- DROP TABLE public.passports;

CREATE TABLE public.passports (
	id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	person_id int8 NOT NULL,
	passport_number varchar(20) NOT NULL,
	issue_date date NULL,
	expiry_date date NULL,
	is_active bool DEFAULT true NULL,
	CONSTRAINT passports_passport_number_key UNIQUE (passport_number),
	CONSTRAINT passports_pkey PRIMARY KEY (id),
	CONSTRAINT passports_person_id_fkey FOREIGN KEY (person_id) REFERENCES public.person(id)
);

-- Table Triggers

create trigger trg_no_passport_overlap before
insert
    on
    public.passports for each row execute function check_passport_overlap();


-- public.salary_audit definition

-- Drop table

-- DROP TABLE public.salary_audit;

CREATE TABLE public.salary_audit (
	id serial4 NOT NULL,
	employment_id int8 NULL,
	old_salary numeric(15, 2) NULL,
	new_salary numeric(15, 2) NULL,
	changed_at timestamptz DEFAULT now() NULL,
	changed_by_user varchar(100) DEFAULT CURRENT_USER NULL,
	CONSTRAINT salary_audit_pkey PRIMARY KEY (id),
	CONSTRAINT salary_audit_employment_id_fkey FOREIGN KEY (employment_id) REFERENCES public.employment(id)
);


-- public.birth_records definition

-- Drop table

-- DROP TABLE public.birth_records;

CREATE TABLE public.birth_records (
	id int8 GENERATED ALWAYS AS IDENTITY( INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START 1 CACHE 1 NO CYCLE) NOT NULL,
	birth_certificate_no int8 NOT NULL,
	child_id int8 NOT NULL,
	marriage_id int8 NULL,
	hospital_name varchar(255) NULL,
	doctor_name varchar(255) NULL,
	birth_weight_kg numeric(4, 2) NULL,
	birth_datetime timestamptz NOT NULL,
	CONSTRAINT birth_records_birth_certificate_no_key UNIQUE (birth_certificate_no),
	CONSTRAINT birth_records_child_id_key UNIQUE (child_id),
	CONSTRAINT birth_records_pkey PRIMARY KEY (id),
	CONSTRAINT birth_records_child_id_fkey FOREIGN KEY (child_id) REFERENCES public.person(id),
	CONSTRAINT birth_records_marriage_id_fkey FOREIGN KEY (marriage_id) REFERENCES public.marriage(id)
);



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

-- DROP FUNCTION public.handle_person_death();

CREATE OR REPLACE FUNCTION public.handle_person_death()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin  
	update passports 
	set is_active = false
	where person_id = new.person_id;
		
	update marrige
	set valid=false,
		end_datetime = NEW.death_date,
		end_reason = 'death'
	where (husband_id = NEW.person_id OR wife_id = NEW.person_id) and valide = true ;
	
	update employment 
	set is_active = false
	WHERE person_id = NEW.person_id and is_active = true;
	
	return new ;
end ;
$function$
;
