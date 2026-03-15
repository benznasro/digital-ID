import bcrypt from "bcrypt";
import pool from "./db.js";

const hashed = await bcrypt.hash("password123", 10);

await pool.query(`
  INSERT INTO users (username, password, role_id, person_id) VALUES
  ('someone' ,        $1, 1, 15000),
  ('admin',           $1, 5, NULL),
  ('hospital_oran',   $1, 2, NULL),
  ('police_oran',     $1, 3, NULL)
`, [hashed]);

console.log("Done");