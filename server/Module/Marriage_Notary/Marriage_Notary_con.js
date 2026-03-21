import pool from '../../db.js';


export const new_Marriage = async (req, res) => {
  const {
    husbandId,
    wifeId,
    marriageDate,
    dowryAmount,
    witness1Id,
    witness2Id,
  } = req.body;

  const {id:notaryId} =req.user;

  const required = { husbandId, wifeId, marriageDate, dowryAmount, witness1Id, witness2Id, notaryId };
  const missing = Object.entries(required)
    .filter(([, val]) => val === undefined || val === null)
    .map(([key]) => key);

  if (missing.length > 0) {
    return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
  }

  try {
    await pool.query(
      `SELECT add_marriage($1, $2, $3, $4, $5, $6, $7)`,
      [husbandId, wifeId, marriageDate, dowryAmount, witness1Id, witness2Id, notaryId]
    );

    res.status(201).json({ message: 'Marriage record added successfully' });

  } catch (error) {
    const msg = error.message;

    if (msg.includes('Husband is deceased'))      return res.status(400).json({ error: msg });
    if (msg.includes('Wife is deceased'))         return res.status(400).json({ error: msg });
    if (msg.includes('Husband is under 18'))      return res.status(400).json({ error: msg });
    if (msg.includes('Wife is under 18'))         return res.status(400).json({ error: msg });
    if (msg.includes('Wife is already married'))  return res.status(409).json({ error: msg });
    if (msg.includes('alredy have 4 wifes'))      return res.status(409).json({ error: msg });
    if (msg.includes('incest is not allowd'))     return res.status(400).json({ error: msg });
    if (msg.includes('Invalid reference'))        return res.status(400).json({ error: msg });

    res.status(500).json({ error: msg });
  }
};


export const Divorce = async (req, res) => {
  const { marriageId, endDate, endReason } = req.body;

  if (!marriageId || !endDate ) {
    return res.status(400).json({ error: 'marriageId and endDate   are required' });
  }

  const allowedReasons = ['divorce', 'annulment', 'Khula'];
  if (!endReason || !allowedReasons.includes(endReason)) {
    return res.status(400).json({ error: `endReason must be one of: ${allowedReasons.join(', ')}` });
  }

  try {
    await pool.query(
      `SELECT add_divorce($1, $2, $3)`,
      [marriageId, endDate, endReason ]
    );

    res.status(200).json({ message: 'Divorce recorded successfully' });

  } catch (error) {
    const msg = error.message;

    if (msg.includes('Marriage not found or already dissolved')) {
      return res.status(404).json({ error: msg });
    }

    res.status(500).json({ error: msg });
  }
};