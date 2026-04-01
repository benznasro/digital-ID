import pool from '../../db.js';

const toPositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const personBaseFields = `
  p.id,
  p.national_id,
  p.first_name,
  p.last_name,
  p.email,
  p.date_of_birth,
  p.phone_number,
  p.gender,
  p.dad_id,
  p.mom_id,
  p.marital_status,
  CASE WHEN f.id IS NULL THEN NULL ELSE f.first_name || ' ' || f.last_name END AS father_name,
  CASE WHEN m.id IS NULL THEN NULL ELSE m.first_name || ' ' || m.last_name END AS mother_name
`;

const hideParentIds = (person) => {
  if (!person) return person;
  delete person.dad_id;
  delete person.mom_id;
  return person;
};


//get 
export const getPersonById=async(req,res)=>{
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid person id' });
    }

    const result = await pool.query(
      `SELECT ${personBaseFields}
       FROM person p
       LEFT JOIN person f ON f.id = p.dad_id
       LEFT JOIN person m ON m.id = p.mom_id
       WHERE p.id = $1`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Person not found' });
    }

    res.json(hideParentIds(result.rows[0]));
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
      `SELECT ${personBaseFields}
       FROM person p
       LEFT JOIN person f ON f.id = p.dad_id
       LEFT JOIN person m ON m.id = p.mom_id
       ORDER BY p.id
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      page,
      limit,
      data: result.rows.map(hideParentIds),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllInfo =async (req ,res)=>{
  try {
    
    const result = await pool.query(
      `SELECT ${personBaseFields}
       FROM person p
       LEFT JOIN person f ON f.id = p.dad_id
       LEFT JOIN person m ON m.id = p.mom_id
       ORDER BY p.id
       LIMIT 100`
    );
    res.json(result.rows.map(hideParentIds));
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

    const result = await pool.query(
      `SELECT ${personBaseFields}
       FROM person p
       LEFT JOIN person f ON f.id = p.dad_id
       LEFT JOIN person m ON m.id = p.mom_id
       WHERE p.id = $1`,
      [personId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Person profile not found' });
    }

    const person = hideParentIds(result.rows[0]);
    delete person.id;
    res.json(person);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


