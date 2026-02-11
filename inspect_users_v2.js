import { pool } from '../../../api/src/config/db.js';

async function inspectUsers() {
    try {
        console.log('--- Columns of table usuarios ---');
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'usuarios' ORDER BY ordinal_position");
        console.log(JSON.stringify(res.rows.map(r => r.column_name), null, 2));

        console.log('--- Sample row from usuarios ---');
        const resRow = await pool.query("SELECT * FROM usuarios LIMIT 1");
        console.log(JSON.stringify(resRow.rows[0], null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

inspectUsers();
