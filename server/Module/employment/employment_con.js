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

export const getEmploymentById = async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid employment id' });

    const result = await pool.query('SELECT * FROM employment WHERE id = $1', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Employment record not found' });

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyEmployment = async (req, res) => {
  try {
    const personId = toPositiveInt(req.user.person_id);
    if (!personId) return res.status(400).json({ error: 'No linked person profile for this user' });

    const result = await pool.query(
      'SELECT * FROM employment WHERE person_id = $1 ORDER BY start_date DESC NULLS LAST, id DESC',
      [personId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllEmployment = async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employment ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSelectedEmployment = async (req, res) => {
  try {
    const page = toPositiveInt(req.query.page) || 1;
    const limit = Math.min(toPositiveInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const result = await pool.query('SELECT * FROM employment ORDER BY id DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ page, limit, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createEmployment = async (req, res) => {
  try {
    const personId = toPositiveInt(req.body.personId);
    const companyId = toPositiveInt(req.body.companyId);
    const managerId = req.body.managerId ? toPositiveInt(req.body.managerId) : null;
    const jobTitle = (req.body.jobTitle || '').trim();
    const department = (req.body.department || '').trim() || null;
    const employmentType = (req.body.employmentType || '').trim() || null;
    const salary = Number(req.body.salary);
    const isActive = req.body.isActive !== false;
    const startDate = toIsoDate(req.body.startDate);
    const endDate = toIsoDate(req.body.endDate);
    const workLocation = (req.body.workLocation || '').trim() || null;

    if (!personId || !companyId || !jobTitle || !startDate || Number.isNaN(salary)) {
      return res.status(400).json({ error: 'personId, companyId, jobTitle, startDate and salary are required' });
    }

    const result = await pool.query(
      `INSERT INTO employment (
        person_id, company_id, job_title, department, employment_type,
        salary, is_active, start_date, end_date, manager_id, work_location
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING *`,
      [personId, companyId, jobTitle, department, employmentType, salary, isActive, startDate, endDate, managerId, workLocation]
    );

    res.status(201).json({ message: 'Employment record created successfully', employment: result.rows[0] });
  } catch (error) {
    if (error.code === '23503') return res.status(400).json({ error: 'Invalid reference id (person or manager)' });
    res.status(500).json({ error: error.message });
  }
};

export const updateEmployment = async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid employment id' });

    const allowed = {
      jobTitle: 'job_title',
      department: 'department',
      employmentType: 'employment_type',
      salary: 'salary',
      isActive: 'is_active',
      startDate: 'start_date',
      endDate: 'end_date',
      managerId: 'manager_id',
      workLocation: 'work_location',
    };

    const fields = [];
    const values = [id];

    Object.entries(allowed).forEach(([inputKey, dbCol]) => {
      if (!(inputKey in req.body)) return;
      let val = req.body[inputKey];
      if (inputKey === 'startDate' || inputKey === 'endDate') val = toIsoDate(val);
      if (inputKey === 'managerId' && val !== null) val = toPositiveInt(val);
      fields.push(`${dbCol} = $${values.length + 1}`);
      values.push(val);
    });

    if (!fields.length) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const result = await pool.query(
      `UPDATE employment
       SET ${fields.join(', ')}
       WHERE id = $1
       RETURNING *`,
      values
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Employment record not found' });
    res.json({ message: 'Employment record updated successfully', employment: result.rows[0] });
  } catch (error) {
    if (error.code === '23503') return res.status(400).json({ error: 'Invalid reference id' });
    res.status(500).json({ error: error.message });
  }
};
