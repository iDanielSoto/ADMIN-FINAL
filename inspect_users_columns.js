import { pool } from '../../../api/src/config/db.js';

async function inspectUsersColumns() {
    try {
        console.log('Inspecting usuarios columns...');
        const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'usuarios'");
        console.log(JSON.stringify(res.rows.map(r => r.column_name), null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

inspectUsersColumns();
