import pool from '../../db.js';


export const new_Marriage = async (req, res) => {
    const { husbandId, wifeId, marriageDate, dowryAmount, witness1Id, witness2Id } = req.body;

    try {
      await pool.query(
          'SELECT add_marriage($1, $2, $3, $4, $5, $6)',
          [husbandId, wifeId, marriageDate, dowryAmount, witness1Id, witness2Id]
      );
      res.status(200).json({ message: 'Marriage registered successfully' });
    } catch (err) {
      const errors = {
        P0003: [409, 'Husband is deceased'],
        P0004: [409, 'Wife is deceased'],
        P0005: [409, 'Husband is under 18'],
        P0006: [409, 'Wife is under 18'],
        P0007: [409, 'Wife is already married'],
        P0008: [400, 'Invalid reference — check all IDs'],
        P0009: [409, 'Witness 1 is deceased'],     
        P0010: [409, 'Witness 2 is deceased'],     
        P0011: [409, 'Witness 1 is under 18'],       
        P0012: [409, 'Witness 2 is under 18'],       
      };
      const matched = errors[err.code];
      if (matched) {
          return res.status(matched[0]).json({ error: matched[1] });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
};



export const Divorce = async (req, res) => {
  const { marriageId, endDate, endReason } = req.body;
  try {
      await pool.query(
          'SELECT add_divorce($1, $2, $3)',
          [marriageId, endDate, endReason]
      );
      res.status(200).json({ message: 'Divorce registered successfully' });
  } catch (err) {
      if (err.code === 'P0001') {
          return res.status(404).json({ error: 'Marriage not found' });
      }
      if (err.code === 'P0002') {
          return res.status(409).json({ error: 'Marriage already dissolved' });
      }

      res.status(500).json({ error: 'Internal server error' });
  }
};
