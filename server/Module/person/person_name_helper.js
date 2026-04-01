import pool from '../../db.js';

export const getFullNameById = async (personId) => {
  if (!personId) return null;

  const result = await pool.query(
    `SELECT first_name, last_name
     FROM person
     WHERE id = $1 OR national_id = $1
     ORDER BY CASE WHEN id = $1 THEN 0 ELSE 1 END
     LIMIT 1`,
    [personId]
  );

  if (!result.rows.length) return null;
  const row = result.rows[0];
  return `${row.first_name} ${row.last_name}`;
};
