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
  const { dad_id, mom_id, ...rest } = person;
  return rest;
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

export const getPersonRelatedRecords = async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid person id' });
    }

    const personExists = await pool.query('SELECT id FROM person WHERE id = $1', [id]);
    if (!personExists.rows.length) {
      return res.status(404).json({ error: 'Person not found' });
    }

    const [
      passports,
      criminalRecords,
      medicalRecords,
      education,
      employment,
      assets,
      marriage,
      birthRecords,
      deathRecords,
    ] = await Promise.all([
      pool.query(
        'SELECT * FROM passports WHERE person_id = $1 ORDER BY issue_date DESC NULLS LAST, id DESC',
        [id]
      ),
      pool.query(
        'SELECT * FROM criminal_records WHERE person_id = $1 ORDER BY filing_date DESC NULLS LAST, id DESC',
        [id]
      ),
      pool.query('SELECT * FROM medical_records WHERE person_id = $1 ORDER BY id DESC', [id]),
      pool.query(
        'SELECT * FROM education WHERE person_id = $1 ORDER BY start_date DESC NULLS LAST, id DESC',
        [id]
      ),
      pool.query(
        'SELECT * FROM employment WHERE person_id = $1 ORDER BY start_date DESC NULLS LAST, id DESC',
        [id]
      ),
      pool.query('SELECT * FROM assets WHERE owner_id = $1 ORDER BY id DESC', [id]),
      pool.query(
        'SELECT * FROM marriage WHERE husband_id = $1 OR wife_id = $1 ORDER BY marriage_date DESC NULLS LAST, id DESC',
        [id]
      ),
      pool.query('SELECT * FROM birth_records WHERE child_id = $1 ORDER BY birth_date_time DESC NULLS LAST, id DESC', [id]),
      pool.query('SELECT * FROM death_records WHERE person_id = $1 ORDER BY death_date DESC NULLS LAST, id DESC', [id]),
    ]);

    const tables = {
      passports: passports.rows,
      criminal_records: criminalRecords.rows,
      medical_records: medicalRecords.rows,
      education: education.rows,
      employment: employment.rows,
      assets: assets.rows,
      marriage: marriage.rows,
      birth_records: birthRecords.rows,
      death_records: deathRecords.rows,
    };

    const counts = Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, rows.length]));

    return res.json({
      person_id: id,
      tables,
      counts,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
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

export const searchPeopleForGovernment = async (req, res) => {
  try {
    const page = toPositiveInt(req.query.page) || 1;
    const limitRaw = toPositiveInt(req.query.limit) || 25;
    const limit = Math.min(limitRaw, 100);
    const offset = (page - 1) * limit;

    const where = [];
    const params = [];

    const q = (req.query.q || '').trim();
    if (q) {
      params.push(`%${q}%`);
      where.push(`(
        p.first_name ILIKE $${params.length}
        OR p.last_name ILIKE $${params.length}
        OR (p.first_name || ' ' || p.last_name) ILIKE $${params.length}
        OR CAST(p.national_id AS TEXT) ILIKE $${params.length}
        OR COALESCE(p.email, '') ILIKE $${params.length}
        OR COALESCE(p.phone_number, '') ILIKE $${params.length}
      )`);
    }

    const gender = req.query.gender;
    if (gender === 'male' || gender === 'female') {
      params.push(gender === 'male');
      where.push(`p.gender = $${params.length}`);
    }

    const maritalStatus = (req.query.marital_status || '').trim();
    if (maritalStatus) {
      params.push(maritalStatus);
      where.push(`p.marital_status = $${params.length}`);
    }

    const minAge = toPositiveInt(req.query.min_age);
    if (minAge !== null) {
      params.push(minAge);
      where.push(`DATE_PART('year', AGE(CURRENT_DATE, p.date_of_birth)) >= $${params.length}`);
    }

    const maxAge = toPositiveInt(req.query.max_age);
    if (maxAge !== null) {
      params.push(maxAge);
      where.push(`DATE_PART('year', AGE(CURRENT_DATE, p.date_of_birth)) <= $${params.length}`);
    }

    const isAlive = (req.query.is_alive || '').trim().toLowerCase();
    if (isAlive === 'true') {
      where.push(`d.person_id IS NULL`);
    } else if (isAlive === 'false') {
      where.push(`d.person_id IS NOT NULL`);
    }

    const hasPassport = (req.query.has_passport || '').trim().toLowerCase();
    if (hasPassport === 'true') {
      where.push(`ap.person_id IS NOT NULL`);
    } else if (hasPassport === 'false') {
      where.push(`ap.person_id IS NULL`);
    }

    const hasCriminal = (req.query.has_criminal || '').trim().toLowerCase();
    if (hasCriminal === 'true') {
      where.push(`cr.person_id IS NOT NULL`);
    } else if (hasCriminal === 'false') {
      where.push(`cr.person_id IS NULL`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM person p
      LEFT JOIN person f ON f.id = p.dad_id
      LEFT JOIN person m ON m.id = p.mom_id
      LEFT JOIN death_records d ON d.person_id = p.id
      LEFT JOIN (
        SELECT DISTINCT person_id FROM passports WHERE is_active = true
      ) ap ON ap.person_id = p.id
      LEFT JOIN (
        SELECT DISTINCT person_id FROM criminal_records
      ) cr ON cr.person_id = p.id
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, params);
    const total = countResult.rows[0]?.total || 0;

    const sortByMap = {
      id: 'p.id',
      national_id: 'p.national_id',
      first_name: 'p.first_name',
      last_name: 'p.last_name',
      date_of_birth: 'p.date_of_birth',
    };
    const sortBy = sortByMap[req.query.sort_by] || 'p.id';
    const sortDir = String(req.query.sort_dir || 'asc').toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    const dataParams = [...params, limit, offset];
    const dataQuery = `
      SELECT
        ${personBaseFields},
        (d.person_id IS NULL) AS is_alive,
        (ap.person_id IS NOT NULL) AS has_active_passport,
        (cr.person_id IS NOT NULL) AS has_criminal_record
      FROM person p
      LEFT JOIN person f ON f.id = p.dad_id
      LEFT JOIN person m ON m.id = p.mom_id
      LEFT JOIN death_records d ON d.person_id = p.id
      LEFT JOIN (
        SELECT DISTINCT person_id FROM passports WHERE is_active = true
      ) ap ON ap.person_id = p.id
      LEFT JOIN (
        SELECT DISTINCT person_id FROM criminal_records
      ) cr ON cr.person_id = p.id
      ${whereClause}
      ORDER BY ${sortBy} ${sortDir}
      LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}
    `;

    const dataResult = await pool.query(dataQuery, dataParams);

    res.json({
      page,
      limit,
      total,
      total_pages: Math.max(1, Math.ceil(total / limit)),
      data: dataResult.rows.map(hideParentIds),
    });
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
    const { id, ...myInfo } = person;
    return res.json(myInfo);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}


