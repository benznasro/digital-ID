import pool from '../../db.js';

const toPositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const getCriminalRecordById = async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid criminal record id' });

    const result = await pool.query('SELECT * FROM criminal_records WHERE id = $1', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Criminal record not found' });

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyCriminalRecords = async (req, res) => {
  try {
    const personId = toPositiveInt(req.user.person_id);
    if (!personId) return res.status(400).json({ error: 'No linked person profile for this user' });

    const result = await pool.query(
      `SELECT
         c.case_number,
         c.status,
         c.violation_type,
         c.disposition,
         c.description,
         c.occurrence_date,
         c.filing_date,
         c.fine_amount,
         c.sentence_details,
         c.location_details,
         c.is_expunged,
         p.first_name || ' ' || p.last_name AS person_name
       FROM criminal_records c
       JOIN person p ON p.id = c.person_id
       WHERE c.person_id = $1
       ORDER BY c.filing_date DESC NULLS LAST, c.id DESC`,
      [personId]
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllCriminalRecords = async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM criminal_records ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSelectedCriminalRecords = async (req, res) => {
  try {
    const page = toPositiveInt(req.query.page) || 1;
    const limit = Math.min(toPositiveInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const result = await pool.query('SELECT * FROM criminal_records ORDER BY id DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ page, limit, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createCriminalRecord = async (req, res) => {
  try {
    const personId = toPositiveInt(req.body.personId);
    const caseNumber = (req.body.caseNumber || '').trim();
    const status = req.body.status !== false;
    const violationType = (req.body.violationType || '').trim();
    const disposition = (req.body.disposition || '').trim() || null;
    const description = (req.body.description || '').trim() || null;
    const occurrenceDate = req.body.occurrenceDate || null;
    const filingDate = req.body.filingDate || new Date().toISOString();
    const fineAmount = req.body.fineAmount !== undefined ? Number(req.body.fineAmount) : 0;
    const sentenceDetails = (req.body.sentenceDetails || '').trim() || null;
    const locationDetails = (req.body.locationDetails || '').trim() || null;
    const isExpunged = req.body.isExpunged === true;

    if (!personId || !caseNumber || !violationType) {
      return res.status(400).json({ error: 'personId, caseNumber and violationType are required' });
    }

    const result = await pool.query(
      `INSERT INTO criminal_records (
        person_id, case_number, status, violation_type, disposition,
        description, occurrence_date, filing_date, fine_amount,
        sentence_details, location_details, is_expunged
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING *`,
      [
        personId,
        caseNumber,
        status,
        violationType,
        disposition,
        description,
        occurrenceDate,
        filingDate,
        fineAmount,
        sentenceDetails,
        locationDetails,
        isExpunged,
      ]
    );

    res.status(201).json({ message: 'Criminal record created successfully', record: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Case number already exists' });
    if (error.code === '23503') return res.status(400).json({ error: 'Invalid person id' });
    res.status(500).json({ error: error.message });
  }
};

export const updateCriminalRecord = async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid criminal record id' });

    const allowed = {
      status: 'status',
      violationType: 'violation_type',
      disposition: 'disposition',
      description: 'description',
      occurrenceDate: 'occurrence_date',
      filingDate: 'filing_date',
      fineAmount: 'fine_amount',
      sentenceDetails: 'sentence_details',
      locationDetails: 'location_details',
      isExpunged: 'is_expunged',
    };

    const fields = [];
    const values = [id];

    Object.entries(allowed).forEach(([inputKey, dbCol]) => {
      if (!(inputKey in req.body)) return;
      fields.push(`${dbCol} = $${values.length + 1}`);
      values.push(req.body[inputKey]);
    });

    if (!fields.length) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const result = await pool.query(
      `UPDATE criminal_records
       SET ${fields.join(', ')}
       WHERE id = $1
       RETURNING *`,
      values
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Criminal record not found' });

    res.json({ message: 'Criminal record updated successfully', record: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
