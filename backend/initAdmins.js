const pool = require('./db');
const bcrypt = require('bcryptjs');

async function init() {
    try {
        const createTableQuery = `
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role ENUM('ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'ADMIN',
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

        await pool.execute(createTableQuery);
        console.log('Created admins table');

        await pool.execute('DELETE FROM admins');
        console.log('Cleared existing admins');

        const [rows] = await pool.query('SELECT * FROM admins');
        if (rows.length === 0) {
            const p1 = await bcrypt.hash('superadmin123', 10);
            const pMeen = await bcrypt.hash('meen123', 10);
            const pBee = await bcrypt.hash('bee123', 10);
            const pJum = await bcrypt.hash('jum123', 10);
            const pJew = await bcrypt.hash('jew123', 10);

            await pool.execute('INSERT INTO admins (username, password, name, role) VALUES (?, ?, ?, ?)', ['superadmin', p1, 'Super Admin', 'SUPER_ADMIN']);
            await pool.execute('INSERT INTO admins (username, password, name, role) VALUES (?, ?, ?, ?)', ['meen', pMeen, 'มีน', 'ADMIN']);
            await pool.execute('INSERT INTO admins (username, password, name, role) VALUES (?, ?, ?, ?)', ['bee', pBee, 'บี', 'ADMIN']);
            await pool.execute('INSERT INTO admins (username, password, name, role) VALUES (?, ?, ?, ?)', ['jum', pJum, 'จุ๋ม', 'ADMIN']);
            await pool.execute('INSERT INTO admins (username, password, name, role) VALUES (?, ?, ?, ?)', ['jew', pJew, 'จิ๋ว', 'ADMIN']);
            console.log('Inserted default admins (Super Admin, มีน, บี, จุ๋ม, จิ๋ว)');
        } else {
            console.log('Admins already exist');
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

init();
