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


//serves 
//update medical record and return status and respond

export const updateMedicalRecord = async (req, res) => {
  const { personId, updates } = req.body;

  if (!personId || !updates) {
    return res.status(400).json({ error: 'personId and updates are required' });
  }

  const allowed = [
    'blood_type',
    'height_cm',
    'weight_kg',
    'smoker',
    'chronic_conditions',
    'last_checkup_date',
  ];

  const fields = Object.entries(updates)
    .filter(([key, val]) => allowed.includes(key) && val !== undefined);

  if (fields.length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const set = fields.map(([key], i) => `${key} = $${i + 2}`).join(', ');
  const values = [personId, ...fields.map(([, val]) => val)];

  try {
    const result = await pool.query(
      `UPDATE medical_records SET ${set} WHERE person_id = $1`,
      values
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: `No medical record found for person_id = ${personId}` });
    }

    res.status(200).json({ message: 'Medical record updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};