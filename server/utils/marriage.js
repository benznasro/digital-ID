import pool from "../db.js"

export const get_marriage_id = async (h_id, w_id) => {
  const result = await pool.query(
    `SELECT id FROM marriage 
     WHERE husband_id = $1 AND wife_id = $2 AND valid = true`,  
    [h_id, w_id]
  );

  if (result.rows.length === 0) {
    throw new Error("No active marriage found between these two persons");  
  }

  return result.rows[0].id;
};