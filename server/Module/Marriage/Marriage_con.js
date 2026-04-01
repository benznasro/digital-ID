import pool from '../../db.js';


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
        const result = await pool.query(`
            SELECT
                *
            FROM marriage m

            WHERE m.husband_id = $1 OR m.wife_id = $1

            ORDER BY m.marriage_date DESC
        `, [req.user.id]);

        res.status(200).json(result.rows);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
    
};
