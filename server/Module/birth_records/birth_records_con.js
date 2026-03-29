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
    const result=await pool.query(`select * from birth_records where child_id = ${req.user.person_id};`);
    res.json(result.rows[0]);
    console.log(result.rows[0]);
    console.log(req.user.person_id);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  
}

