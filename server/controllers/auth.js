import pool from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const login=async (req ,res)=>{
  try {

    const {username,password}=req.body;

    const result = await pool.query(
      `SELECT users.* ,roles.name as role 
      FROM users 
      join roles on users.role_id = roles.id
      where username= $1 `,
      [username]
    )

    if (result.rows.length===0) {
      return res.status(404).json({ error: "User not found" });
    }
    const user= result.rows[0];
    const ismatched=await bcrypt.compare(password,user.password);
    if (!ismatched) {
      return res.status(401).json({ error: "Wrong password" });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        person_id: user.person_id ?? null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
