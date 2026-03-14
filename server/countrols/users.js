import pool from '../db.js';

export const getUserCount = async (req, res) => {
  try {
    const result = await pool.query("SELECT count(*) FROM person");
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}