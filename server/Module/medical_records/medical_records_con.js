import pool from '../../db.js';

export const get_Medical_record_by_id = async(req,res)=>{
   try {
    const {id} =req.params;
    const result= await pool.query(`SELECT * FROM medical_records WHERE id =${id}`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const get_Selected_Medical_records=async(req,res)=>{
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      "SELECT * FROM medical_records ORDER BY id LIMIT $1 OFFSET $2 ",
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
}


export const get_All_Medical_records= async (req ,res)=>{
  try {
    const result=await pool.query(`SELECT * from medical_records where LIMIT 200`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const get_My_Medical_record= async (req ,res)=>{
  try {
    const result = await pool.query(
      `SELECT
         m.blood_type,
         m.height_cm,
         m.weight_kg,
         m.smoker,
         m.chronic_conditions,
         m.last_checkup_date,
         p.first_name || ' ' || p.last_name AS person_name
       FROM medical_records m
       JOIN person p ON p.id = m.person_id
       WHERE m.person_id = $1
       ORDER BY m.last_checkup_date DESC NULLS LAST
       LIMIT 1`,
      [req.user.person_id]
    );
    res.json(result.rows[0] ?? null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


