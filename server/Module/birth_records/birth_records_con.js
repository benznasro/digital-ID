import pool from '../../db.js';


export const get_Birth_record_By_Id=async(req,res)=>{
  try {
    const {id} =req.params;
    const result= await pool.query(`SELECT * FROM birth_records WHERE id =${id}`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


export const get_Selected_Birth_records=async (req,res)=>{
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      "SELECT * FROM birth_records ORDER BY id LIMIT $1 OFFSET $2 ",
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

export const get_All_Birth_records= async (req ,res)=>{
  try {
    const result=await pool.query(`SELECT * from birth_records`);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const get_My_birth_record= async (req ,res)=>{
  try {
    const result = await pool.query(
      `SELECT
         b.birth_certificate_no,
         b.hospital_name,
         b.doctor_name,
         b.birth_weight_kg,
         b.birth_date_time,
         b.wilaya_code,
         b.commune_code,
         b.apgar_score,
         c.first_name || ' ' || c.last_name AS child_name,
         f.first_name || ' ' || f.last_name AS father_name,
         m.first_name || ' ' || m.last_name AS mother_name
       FROM birth_records b
       JOIN person c ON c.id = b.child_id
       LEFT JOIN person f ON f.id = c.dad_id
       LEFT JOIN person m ON m.id = c.mom_id
       WHERE b.child_id = $1
       ORDER BY b.birth_date_time DESC NULLS LAST
       LIMIT 1`,
      [req.user.person_id]
    );

    res.json(result.rows[0] ?? null);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  
}

