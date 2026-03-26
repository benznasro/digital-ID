import pool from '../../db.js';

const toPositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};


//get 
export const getPersonById=async(req,res)=>{
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid person id' });
    }

    const result = await pool.query('SELECT * FROM person WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Person not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const getUserCount = async (req, res) => {
  try {
    const result = await pool.query('SELECT count(*)::int AS count FROM person');
    res.json({ count: result.rows[0].count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const getSelectedUsers = async (req, res) => {
  try {
    const page = toPositiveInt(req.query.page) || 1;
    const limitRaw = toPositiveInt(req.query.limit) || 20;
    const limit = Math.min(limitRaw, 100);
    const offset = (page - 1) * limit;

    const result = await pool.query(
      'SELECT * FROM person ORDER BY id LIMIT $1 OFFSET $2',
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
    
    const result = await pool.query('SELECT * FROM person ORDER BY id LIMIT 100');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const getMyInfo =async (req ,res)=>{
  try {
    const personId = toPositiveInt(req.user.person_id);
    if (!personId) {
      return res.status(400).json({ error: 'No linked person profile for this user' });
    }

    const result = await pool.query('SELECT * FROM person WHERE id = $1', [personId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Person profile not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


