import pool from '../../db.js';

const toPositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const getAssetById = async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid asset id' });

    const result = await pool.query('SELECT * FROM assets WHERE id = $1', [id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Asset not found' });

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyAssets = async (req, res) => {
  try {
    const personId = toPositiveInt(req.user.person_id);
    if (!personId) return res.status(400).json({ error: 'No linked person profile for this user' });

    const result = await pool.query('SELECT * FROM assets WHERE owner_id = $1 ORDER BY id DESC', [personId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAllAssets = async (_req, res) => {
  try {
    const result = await pool.query('SELECT * FROM assets ORDER BY id DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSelectedAssets = async (req, res) => {
  try {
    const page = toPositiveInt(req.query.page) || 1;
    const limit = Math.min(toPositiveInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const result = await pool.query('SELECT * FROM assets ORDER BY id DESC LIMIT $1 OFFSET $2', [limit, offset]);
    res.json({ page, limit, data: result.rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createAsset = async (req, res) => {
  try {
    const ownerId = toPositiveInt(req.body.ownerId);
    const assetType = (req.body.assetType || '').trim() || null;
    const registrationNumber = (req.body.registrationNumber || '').trim() || null;
    const dateOwned = req.body.dateOwned || null;
    const estimatedValue = req.body.estimatedValue !== undefined ? Number(req.body.estimatedValue) : null;

    if (!ownerId) {
      return res.status(400).json({ error: 'ownerId is required' });
    }

    const result = await pool.query(
      `INSERT INTO assets (owner_id, asset_type, registration_number, date_owned, estimated_value)
       VALUES ($1, $2, $3, COALESCE($4, now()), $5)
       RETURNING *`,
      [ownerId, assetType, registrationNumber, dateOwned, estimatedValue]
    );

    res.status(201).json({ message: 'Asset created successfully', asset: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Registration number already exists' });
    if (error.code === '23503') return res.status(400).json({ error: 'Invalid owner id' });
    res.status(500).json({ error: error.message });
  }
};

export const updateAsset = async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid asset id' });

    const allowed = {
      assetType: 'asset_type',
      registrationNumber: 'registration_number',
      dateOwned: 'date_owned',
      estimatedValue: 'estimated_value',
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
      `UPDATE assets SET ${fields.join(', ')} WHERE id = $1 RETURNING *`,
      values
    );

    if (!result.rows.length) return res.status(404).json({ error: 'Asset not found' });

    res.json({ message: 'Asset updated successfully', asset: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'Registration number already exists' });
    res.status(500).json({ error: error.message });
  }
};
