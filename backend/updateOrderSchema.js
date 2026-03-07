const pool = require('./db');

async function migrate() {
    try {
        // Add managedBy column
        await pool.execute('ALTER TABLE orders ADD COLUMN managedBy VARCHAR(50) DEFAULT NULL');
        console.log('Added managedBy to orders table');
        process.exit(0);
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('Column managedBy already exists');
            process.exit(0);
        } else {
            console.error(err);
            process.exit(1);
        }
    }
}

migrate();
