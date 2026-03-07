const pool = require('./db');

async function updateDB() {
    try {
        await pool.query('ALTER TABLE admins ADD COLUMN lineUserId VARCHAR(50) NULL');
        console.log('Admins table updated with lineUserId');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('lineUserId already exists in admins');
        } else {
            console.error(err);
        }
    }

    try {
        await pool.query('ALTER TABLE orders ADD COLUMN customerLineUserId VARCHAR(50) NULL');
        console.log('Orders table updated with customerLineUserId');
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('customerLineUserId already exists in orders');
        } else {
            console.error(err);
        }
    }
    process.exit(0);
}

updateDB();
