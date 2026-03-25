import jwt from "jsonwebtoken";
import pool from "../db.js";

export const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token)
    return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};


export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role))
      return res.status(403).json({ error: "Access denied" });
    next();
  };
};

export const refresh = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const { rows } = await pool.query(
      `SELECT users.*, roles.name as role
       FROM users
       JOIN roles ON roles.id = users.role_id
       WHERE users.id = $1 AND users.refresh_token = $2`,
      [decoded.id, refreshToken]
    );

    if (rows.length === 0) {
      await pool.query(`UPDATE users SET refresh_token = NULL WHERE id = $1`, [decoded.id]);
      return res.status(403).json({ error: 'Token reuse detected — please login again' });
    }

    const user = rows[0];
    const base = {
      id: user.id,
      username: user.username,
      role: user.role,
      person_id: user.person_id ?? null,
    };
    if (user.role !== 'citizen') {
      base.wilaya_code = user.wilaya_code;
      base.commune_code = user.commune_code;
    }

    const newAccessToken  = jwt.sign(base, process.env.JWT_SECRET, { expiresIn: '15m' });
    const newRefreshToken = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    await pool.query(
      `UPDATE users SET refresh_token = $1 WHERE id = $2`,
      [newRefreshToken, user.id]
    );

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });

  } catch (error) {
    res.status(403).json({ error: 'Refresh token expired or invalid' });
  }
};

export const logout = async (req, res) => {
  await pool.query(`UPDATE users SET refresh_token = NULL WHERE id = $1`, [req.user.id]);
  res.json({ message: 'Logged out successfully' });
};