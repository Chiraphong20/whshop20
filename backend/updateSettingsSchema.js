require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateSettingsSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_password || process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
    });

    try {
        console.log('🔄 กำลังสร้างตาราง settings...');

        // สร้างตารางถ้ายังไม่มี
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value TEXT NOT NULL,
        description VARCHAR(255)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

        console.log('✅ สร้างตาราง settings สำเร็จ');

        // สร้างข้อมูลเริ่มต้น (seed) สำหรับ payment settings
        const defaultPaymentSettings = {
            bankName: '',
            accountName: '',
            accountNumber: '',
            promptpayQr: ''
        };

        // เช็คว่ามี key 'payment' หรือยัง
        const [rows] = await connection.execute('SELECT setting_key FROM settings WHERE setting_key = ?', ['payment']);

        if (rows.length === 0) {
            await connection.execute(
                'INSERT INTO settings (setting_key, setting_value, description) VALUES (?, ?, ?)',
                ['payment', JSON.stringify(defaultPaymentSettings), 'ข้อมูลบัญชีรับชำระเงิน']
            );
            console.log('✅ เพิ่มข้อมูลเริ่มต้นสำหรับ payment settings สำเร็จ');
        } else {
            console.log('ℹ️ มีข้อมูล payment settings อยู่แล้ว');
        }

    } catch (error) {
        console.error('❌ เกิดข้อผิดพลาด:', error);
    } finally {
        await connection.end();
        console.log('👋 ปิดการเชื่อมต่อ Database');
    }
}

updateSettingsSchema();
