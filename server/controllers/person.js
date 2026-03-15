import pool from '../db.js';

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

export const getAllUsers = async (req, res) => {
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



