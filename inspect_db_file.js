import { pool } from '../../../api/src/config/db.js';
import fs from 'fs';

async function inspectDB() {
    let output = '';
    const log = (msg) => { output += JSON.stringify(msg, null, 2) + '\n'; };

    try {
        log('Inspeccionando tablas...');

        // 1. Check empleados table structure
        log('--- Tabla EMPLEADOS Structure ---');
        const resEmpColumns = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'empleados'");
        log(resEmpColumns.rows);

        // 2. Check content of empleados for USU00005
        log('--- Buscando USU00005 en empleados ---');
        // Check if it exists as ID
        const resId = await pool.query("SELECT * FROM empleados WHERE id = 'USU00005'");
        log({ search_by_id: resId.rows });

        // Check if it exists as usuario_id (assuming column exists)
        try {
            const resUserId = await pool.query("SELECT * FROM empleados WHERE usuario_id = 'USU00005'");
            log({ search_by_usuario_id: resUserId.rows });
        } catch (e) {
            log({ error_search_by_usuario_id: e.message });
        }


        // 3. Check avisos_empleados constraints
        log('--- Constraints Avisos Empleados ---');
        const resConstraints = await pool.query(`
            SELECT
                tc.constraint_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.table_name = 'avisos_empleados' AND tc.constraint_type = 'FOREIGN KEY';
        `);
        log(resConstraints.rows);

    } catch (error) {
        log({ Error: error.message });
    } finally {
        await pool.end();
        fs.writeFileSync('db_inspection.txt', output);
        console.log('Done');
    }
}

inspectDB();
