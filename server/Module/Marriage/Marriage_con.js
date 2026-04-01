import pool from '../../db.js';

const toPositiveInt = (value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};


export const new_Marriage = async (req, res) => {
    const { husbandId, wifeId, marriageDate, dowryAmount, witness1Id, witness2Id } = req.body;

    const client = await pool.connect();
    try {
        await client.query('SELECT set_config($1, $2, false)',
            ['app.current_user_id', String(req.user.id)]
        );

        await client.query(
            'SELECT add_marriage($1, $2, $3, $4, $5, $6)',
            [husbandId, wifeId, marriageDate, dowryAmount, witness1Id, witness2Id]
        );

        res.status(200).json({ message: 'Marriage registered successfully' });

    } catch (err) {
        const errors = {
            P0001: [404, 'Husband not found'],
            P0002: [404, 'Wife not found'],
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
        if (matched) return res.status(matched[0]).json({ error: matched[1] });
        res.status(500).json({ error: 'Internal server error' });

    } finally {
        client.release();
    }
};



export const Divorce = async (req, res) => {
    const { marriageId, endDate, endReason } = req.body;

    const client = await pool.connect();
    try {
        await client.query('SELECT set_config($1, $2, false)',
            ['app.current_user_id', String(req.user.id)]
        );
        
        await client.query(
            'SELECT add_divorce($1, $2, $3)',
            [marriageId, endDate, endReason]
        );

        res.status(200).json({ message: 'Divorce registered successfully' });

    } catch (err) {
        if (err.code === 'P0001') return res.status(404).json({ error: 'Marriage not found' });
        if (err.code === 'P0002') return res.status(409).json({ error: 'Marriage already dissolved' });
        res.status(500).json({ error: 'Internal server error' });

    } finally {
        client.release(); 
    }
};


export const get_My_AuditLogs = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                m.contract_no,
                ma.operation,
                ma.changed_at,

                -- old values
                ma.old_valid,
                ma.old_end_reason,
                ma.old_end_marriage_time,

                -- new values
                ma.new_valid,
                ma.new_end_reason,
                ma.new_end_marriage_time,

                -- husband info
                h.first_name || ' ' || h.last_name AS husband_name,

                -- wife info
                w.first_name || ' ' || w.last_name AS wife_name

            FROM marriage_audit ma
            LEFT JOIN marriage m  ON m.id  = ma.marriage_id
            LEFT JOIN person   h  ON h.id  = m.husband_id
            LEFT JOIN person   w  ON w.id  = m.wife_id

            WHERE ma.changed_by_user_id = $1

            ORDER BY ma.changed_at DESC
        `, [req.user.id]);

        res.status(200).json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const get_my_marriage = async (req, res) => {
    try {
        const personId = toPositiveInt(req.user.person_id);
        if (!personId) {
            return res.status(400).json({ error: 'No linked person profile for this user' });
        }

        const result = await pool.query(`
            SELECT
                m.contract_no,
                m.marriage_date,
                m.valid,
                m.end_marriage_time,
                m.end_reason,
                m.dowry_amount,
                h.first_name || ' ' || h.last_name AS husband_name,
                w.first_name || ' ' || w.last_name AS wife_name,
                w1.first_name || ' ' || w1.last_name AS witness_1_name,
                w2.first_name || ' ' || w2.last_name AS witness_2_name,
                np.first_name || ' ' || np.last_name AS notary_name
            FROM marriage m
            LEFT JOIN person h ON h.id = m.husband_id
            LEFT JOIN person w ON w.id = m.wife_id
            LEFT JOIN person w1 ON w1.id = m.witness_1_id
            LEFT JOIN person w2 ON w2.id = m.witness_2_id
            LEFT JOIN users nu ON nu.id = m.notary_id
            LEFT JOIN person np ON np.id = nu.person_id

            WHERE m.husband_id = $1 OR m.wife_id = $1

            ORDER BY m.marriage_date DESC
        `, [personId]);

        res.status(200).json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
    
};
