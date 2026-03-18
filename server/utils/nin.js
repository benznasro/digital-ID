import pool from '../db.js';

export const generateNin  = async (wilaya_code,commune_code,gender,dob)=>{

  const genderDigit = gender ? '1' : '2';
  const year= String(dob.getFullYear()).slice(-2);
  const wilayaCode = String(wilaya_code).padStart(2, '0');
  const communeCode = String(commune_code).padStart(4, '0');

  const next_chile_no = await pool.query(
    `SELECT get_next_act_number($1, $2, $3) AS act_no`,
    [wilaya_code, commune_code,year]
  );
  const Birth_Certificate_No= next_chile_no.rows[0].act_no;
  const actNumber = String(Birth_Certificate_No).padStart(6, '0');
  const first16 = genderDigit + year + wilayaCode + communeCode + actNumber;
  const controlKey = String(97 - Number(BigInt(first16) % 97n)).padStart(2, '0');
  const nin =first16 + controlKey;
  return {
    nin,
    Birth_Certificate_No
  };
}