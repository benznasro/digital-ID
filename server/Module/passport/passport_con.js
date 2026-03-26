import pool from '../../db.js';

const toPositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const toIsoDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

export const getPassportById = async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid passport id' });
    }

    const result = await pool.query('SELECT * FROM passports WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Passport not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyPassports = async (req, res) => {
  try {
    const personId = toPositiveInt(req.user.person_id);
    if (!personId) {
      return res.status(400).json({ error: 'No linked person profile for this user' });
    }

    const result = await pool.query(
      'SELECT * FROM passports WHERE person_id = $1 ORDER BY issue_date DESC NULLS LAST, id DESC',
      [personId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllPassports = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM passports ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSelectedPassports = async (req, res) => {
  try {
    const page = toPositiveInt(req.query.page) || 1;
    const limitRaw = toPositiveInt(req.query.limit) || 20;
    const limit = Math.min(limitRaw, 100);
    const offset = (page - 1) * limit;

    const result = await pool.query(
      'SELECT * FROM passports ORDER BY id DESC LIMIT $1 OFFSET $2',
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

export const issuePassport = async (req, res) => {
  try {
    const personId = toPositiveInt(req.body.personId);
    const passportNumber = (req.body.passportNumber || '').trim();
    const issueDate = toIsoDate(req.body.issueDate);
    const expiryDate = toIsoDate(req.body.expiryDate);

    if (!personId || !passportNumber || !issueDate || !expiryDate) {
      return res.status(400).json({ error: 'personId, passportNumber, issueDate, and expiryDate are required' });
    }

    if (issueDate >= expiryDate) {
      return res.status(400).json({ error: 'expiryDate must be after issueDate' });
    }

    const personCheck = await pool.query('SELECT id FROM person WHERE id = $1', [personId]);
    if (personCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Person not found' });
    }

    const result = await pool.query(
      `INSERT INTO passports (person_id, passport_number, issue_date, expiry_date, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [personId, passportNumber, issueDate, expiryDate]
    );

    res.status(201).json({
      message: 'Passport issued successfully',
      passport: result.rows[0],
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Passport number already exists' });
    }

    if (String(error.message || '').toLowerCase().includes('active passport')) {
      return res.status(409).json({ error: 'Person already has an active passport' });
    }

    res.status(500).json({ error: error.message });
  }
};

export const deactivatePassport = async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid passport id' });
    }

    const result = await pool.query(
      `UPDATE passports
       SET is_active = false
       WHERE id = $1 AND is_active = true
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Active passport not found' });
    }

    res.json({ message: 'Passport deactivated successfully', passport: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
