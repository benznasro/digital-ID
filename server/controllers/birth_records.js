import pool from '../db.js';

export const getAllbirth_record= async (req ,res)=>{
  try {
    const result=await pool.query(`SELECT * from birth_records LIMIT 200`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const getMybirth_record= async (req ,res)=>{
  try {
    const result=await pool.query(`SELECT * from birth_records where child_id =${req.user.person_id}`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

