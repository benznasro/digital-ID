import pool from '../../db.js';

const toPositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const toIsoDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
};

export const getEducationById = async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid education id' });

    const result = await pool.query('SELECT * FROM education WHERE id = $1', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Education record not found' });

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyEducation = async (req, res) => {
  try {
    const personId = toPositiveInt(req.user.person_id);
    if (!personId) return res.status(400).json({ error: 'No linked person profile for this user' });

    const result = await pool.query(
      'SELECT * FROM education WHERE person_id = $1 ORDER BY start_date DESC NULLS LAST, id DESC',
      [personId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllEducation = async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM education ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSelectedEducation = async (req, res) => {
  try {
    const page = toPositiveInt(req.query.page) || 1;
    const limit = Math.min(toPositiveInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const result = await pool.query('SELECT * FROM education ORDER BY id DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ page, limit, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createEducation = async (req, res) => {
  try {
    const personId = toPositiveInt(req.body.personId);
    const universityName = (req.body.universityName || '').trim();
    const major = (req.body.major || '').trim();
    const degreeType = (req.body.degreeType || '').trim() || null;
    const gpa = req.body.gpa !== undefined ? Number(req.body.gpa) : null;
    const studyMode = (req.body.studyMode || '').trim() || null;
    const startDate = toIsoDate(req.body.startDate);
    const graduationDate = toIsoDate(req.body.graduationDate);
    const certificateUrl = (req.body.certificateUrl || '').trim() || null;
    const isVerified = req.body.isVerified === true;

    if (!personId || !universityName || !major) {
      return res.status(400).json({ error: 'personId, universityName and major are required' });
    }

    const result = await pool.query(
      `INSERT INTO education (
        person_id, university_name, major, degree_type, gpa,
        study_mode, start_date, graduation_date, certificate_url, is_verified
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [personId, universityName, major, degreeType, gpa, studyMode, startDate, graduationDate, certificateUrl, isVerified]
    );

    res.status(201).json({ message: 'Education record created successfully', education: result.rows[0] });
  } catch (error) {
    if (error.code === '23503') return res.status(400).json({ error: 'Invalid person id' });
    res.status(500).json({ error: error.message });
  }
};

export const updateEducation = async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid education id' });

    const allowed = {
      universityName: 'university_name',
      major: 'major',
      degreeType: 'degree_type',
      gpa: 'gpa',
      studyMode: 'study_mode',
      startDate: 'start_date',
      graduationDate: 'graduation_date',
      certificateUrl: 'certificate_url',
      isVerified: 'is_verified',
    };

    const fields = [];
    const values = [id];

    Object.entries(allowed).forEach(([inputKey, dbCol]) => {
      if (!(inputKey in req.body)) return;
      let val = req.body[inputKey];
      if (inputKey === 'startDate' || inputKey === 'graduationDate') val = toIsoDate(val);
      fields.push(`${dbCol} = $${values.length + 1}`);
      values.push(val);
    });

    if (!fields.length) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const result = await pool.query(
      `UPDATE education SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Education record not found' });
    res.json({ message: 'Education record updated successfully', education: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
