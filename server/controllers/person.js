import pool from '../db.js';
import {generateNin}  from '../utils/nin.js';
import {get_marriage_id} from '../utils/marriage.js';

//get 
export const getPersonById=async(req,res)=>{
  try {
    const {id} =req.params;
    const result= await pool.query(`SELECT * FROM person WHERE id =${id}`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const getUserCount = async (req, res) => {
  try {
    const result = await pool.query("SELECT count(*) FROM person");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const getSelectedUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      "SELECT * FROM person ORDER BY id LIMIT $1 OFFSET $2 ",
      [limit, offset]
    );

    res.json({
      page,
      limit,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllInfo =async (req ,res)=>{
  try {
    
    const result = await pool.query(`SELECT * from person LIMIT 100`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const getMyInfo =async (req ,res)=>{
  try {
    
    const result = await pool.query(`SELECT * from person where id=${req.user.person_id}`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

//servs

export const createBirth  =async (req ,res)=>{
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


