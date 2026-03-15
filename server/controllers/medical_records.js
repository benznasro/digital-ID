import pool from '../db.js';

export const getAllMedical_records= async (req ,res)=>{
  try {
    const result=await pool.query(`SELECT * from medical_records where LIMIT 200`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const getMyMedical_records= async (req ,res)=>{
  try {
    const result=await pool.query(`SELECT * from medical_records where person_id =${req.user.person_id}`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}