import pool from '../../db.js';
import {generateNin}  from '../../utils/nin.js';
import {get_marriage_id} from '../../utils/marriage.js';

//servs

export const create_Birth  =async (req ,res)=>{
  const {first_name,gender,doctor_name,birth_weight_kg,date_of_birth,husband_id,wife_id,blood_type,height_cm,apgar_score}=req.body;
  const { commune_code, wilaya_code, username: hospital_name } = req.user;
  const client = await pool.connect();
  try {
    const marriage_id =await get_marriage_id(husband_id,wife_id);
    const {nin,Birth_Certificate_No} = await generateNin(wilaya_code,commune_code,gender, new Date(date_of_birth));

    await client.query('BEGIN');

    //add to person table


    const result_person = await pool.query(
      `INSERT INTO person (
        national_id,
        last_name,
        first_name,
        date_of_birth,
        gender,
        dad_id,
        mom_id
      )
      VALUES (
        $1, $2, $3, $4, $5, $6 ,$7
      )
      RETURNING *`,
      [
        nin,
        'unkown',
        first_name ?? null,
        date_of_birth,
        gender,
        husband_id ?? null,
        wife_id ?? null,
      ]
    );
  
    //add to birth_records table

    const result= await pool.query(
      `INSERT INTO birth_records 
          (birth_certificate_no, child_id, marriage_id, hospital_name, doctor_name, birth_weight_kg, birth_datetime, wilaya_code, commune_code,apgar_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,10$)
       RETURNING *`,
      [BigInt(Birth_Certificate_No), result_person.rows[0].id, marriage_id, hospital_name, doctor_name, birth_weight_kg, date_of_birth, wilaya_code, commune_code,apgar_score]
    );

    //add to medical_records table

    const result_health =await pool.query(
      `INSERT INTO medical_records 
      (person_id,blood_type,height_cm,weight_kg,last_checkup_date)
      VALUES ($1,$2,$3,$4)
      RETURNING * `,
      [result_person.rows[0].id,blood_type,height_cm,birth_weight_kg,date_of_birth]
    );

    await client.query('COMMIT');

    res.status(201).json({
      person: result_person.rows[0],
      birth_record: result.rows[0],
      medical_record: result_health.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');

    if (error.message.includes("No active marriage")) {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }finally{
    client.release();
  }
}

//serves 
//update medical record and return status and respond

export const update_Medical_Record = async (req, res) => {
  const { personId, updates } = req.body;

  if (!personId || !updates) {
    return res.status(400).json({ error: 'personId and updates are required' });
  }

  const allowed = [
    'blood_type',
    'height_cm',
    'weight_kg',
    'smoker',
    'chronic_conditions',
    'last_checkup_date',
  ];

  const fields = Object.entries(updates)
    .filter(([key, val]) => allowed.includes(key) && val !== undefined);

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const set = fields.map(([key], i) => `${key} = $${i + 2}`).join(', ');
  const values = [personId, ...fields.map(([, val]) => val)];

  try {
    const result = await pool.query(
      `UPDATE medical_records SET ${set} WHERE person_id = $1`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: `No medical record found for person_id = ${personId}` });
    }

    res.status(200).json({ message: 'Medical record updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const add_Death_Record = async (req, res) => {
  const {
    personId,
    deathDate,
    placeOfDeath,
    causeOfDeath,
    doctorId,
    icd10Code,
    kinContactId,
    notifiedNextOfKin,
    hospitalUserId,
  } = req.body;

  if (!personId || !deathDate) {
    return res.status(400).json({ error: 'personId and deathDate are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO death_records (
        person_id,
        death_date,
        place_of_death,
        cause_of_death,
        doctor_id,
        icd_10_code,
        kin_contact_id,
        notified_next_of_kin,
        hospital_user_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        personId,
        deathDate,
        placeOfDeath       ?? null,
        causeOfDeath       ?? null,
        doctorId           ?? null,
        icd10Code          ?? null,
        kinContactId       ?? null,
        notifiedNextOfKin  ?? false,
        hospitalUserId     ?? null,
      ]
    );

    res.status(201).json({ message: 'Death record added successfully' });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: `Death record already exists for person_id = ${personId}` });
    }
    if (error.code === '23503') {
      return res.status(400).json({ error: 'Invalid reference — check doctorId, kinContactId, or hospitalUserId' });
    }
    res.status(500).json({ error: error.message });
  }
};

export const get_My_AuditLogs = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                bl.id,
                bl.birth_record_id,
                bl.operation,
                bl.changed_at,
                ch.gander,
                ch.first_name,
                ch.last_name,
                -- old values
                bl.old_birth_certificate_no,
                bl.old_child_id,
                bl.old_doctor_name,
                bl.old_birth_weight_kg,
                bl.old_birth_date_time,
                bl.old_marriage_id,

                -- new values
                bl.new_birth_certificate_no,
                bl.new_child_id,
                bl.new_doctor_name,
                bl.new_birth_weight_kg,
                bl.new_birth_date_time,
                bl.new_marriage_id,


            FROM birth_records_log bl
            LEFT JOIN marriage m  ON m.id  = bl.marriage_id
            LEFT JOIN person   ch  ON ch.id  = bl.child_id
            

            WHERE bl.changed_by_user_id = $1

            ORDER BY bl.changed_at DESC
        `, [req.user.id]);

        res.status(200).json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};