require('dotenv').config(); // 🌟 ดึงข้อมูลจากไฟล์ .env มาใช้
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,         
  user: process.env.DB_USER,         
  password: process.env.DB_PASSWORD, 
  database: process.env.DB_NAME,     
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,

  // 🔥 เพิ่ม 3 บรรทัดนี้เพื่อแก้ปัญหา ECONNRESET
  enableKeepAlive: true,           // เปิดใช้งานการส่งสัญญาณรักษาการเชื่อมต่อ
  keepAliveInitialDelay: 10000,    // เริ่มส่งสัญญาณหลังจากนิ่งไป 10 วินาที
  connectTimeout: 20000            // กำหนดเวลาดึงข้อมูลสูงสุด 20 วินาที ถ้าเกินให้ตัดใจ
});

// ทดสอบการเชื่อมต่อ
pool.getConnection()
  .then(connection => {
    console.log('✅ เชื่อมต่อ Database สำเร็จแล้ว! (Keep-Alive Enabled)');
    connection.release();
  })
  .catch(err => {
    console.error('❌ เชื่อมต่อ Database ไม่สำเร็จ:', err.message);
  });

module.exports = pool;