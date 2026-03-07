const pool = require('./db');

async function updateDB() {
    console.log('Running migration: Add LINE Profile Columns');
    try {
        await pool.query('ALTER TABLE orders ADD COLUMN customerLineDisplayName VARCHAR(255) NULL');
        console.log('✅ Added customerLineDisplayName to orders table');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ customerLineDisplayName already exists in orders');
        } else {
            console.error('❌ Error adding customerLineDisplayName:', err.message);
        }
    }

    try {
        await pool.query('ALTER TABLE orders ADD COLUMN customerLinePictureUrl TEXT NULL');
        console.log('✅ Added customerLinePictureUrl to orders table');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('⚠️ customerLinePictureUrl already exists in orders');
        } else {
            console.error('❌ Error adding customerLinePictureUrl:', err.message);
        }
    }

    console.log('Migration completed.');
    process.exit(0);
}

updateDB();
