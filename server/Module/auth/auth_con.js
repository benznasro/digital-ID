import pool from "../../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await pool.query(
      `SELECT users.*, roles.name as role 
       FROM users 
       JOIN roles ON users.role_id = roles.id
       WHERE username = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = result.rows[0];

    const isMatched = await bcrypt.compare(password, user.password);
    if (!isMatched) {
      return res.status(401).json({ error: "Wrong password" });
    }

    const base = {
      id: user.id,
      username:user.username,
      role: user.role,
      person_id: user.person_id ?? null,
    };

    if (user.role === 'hospital') {
      base.wilaya_code = user.wilaya_code;
      base.commune_code = user.commune_code;
    }


    const accessToken  = jwt.sign(base, process.env.JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    await pool.query(
    `UPDATE users SET refresh_token = $1 WHERE id = $2`,
    [refreshToken, user.id]
    );

    res.json({ accessToken,refreshToken});

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};