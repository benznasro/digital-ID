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

    let token ;
    if (user.role==='hospital') {
      let result= await pool.query(
        `SELECT  wilaya_code ,commune_code
        FROM users 
        where username= $1 `,
        [username]
      )
      result =result.rows[0];
      const {wilaya_code,commune_code}=result;
      user.wilaya_code=wilaya_code;
      user.commune_code=commune_code;

      token = jwt.sign(
        {
          id: user.id,
          role: user.role,
          person_id: user.person_id ?? null,
          wilaya_code: user.wilaya_code,
          commune_code:user.commune_code
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

    }else{
      token = jwt.sign(
        {
          id: user.id,
          role: user.role,
          person_id: user.person_id ?? null,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
    }

    res.json({ token });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
