import pool from '../db.js';

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
    const result=await pool.query(`SELECT * from medical_records where person_id =${req.user.person_id}`);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}