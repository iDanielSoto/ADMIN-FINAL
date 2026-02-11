import { pool } from '../../../api/src/config/db.js';

async function inspectDB() {
    try {
        console.log('Inspeccionando tablas...');

        // 1. Check empleados table structure and data
        console.log('\n--- Tabla EMPLEADOS ---');
        const resEmpleados = await pool.query('SELECT * FROM empleados LIMIT 5');
        console.log('Filas (limit 5):', resEmpleados.rows);

        const resEmpColumns = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'empleados'");
        console.log('Columnas:', resEmpColumns.rows.map(c => `${c.column_name} (${c.data_type})`));

        // 2. Check usuarios table structure and data with USU00005
        console.log('\n--- Tabla USUARIOS (USU00005) ---');
        const resUsuarios = await pool.query("SELECT * FROM usuarios WHERE id = 'USU00005'");
        console.log('Usuario USU00005:', resUsuarios.rows);

        // 3. Check avisos_empleados constraints
        console.log('\n--- Constraints Avisos Empleados ---');
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
        console.log('Foreign Keys:', resConstraints.rows);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

inspectDB();
