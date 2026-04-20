/**
 * 🔧 Migration Script: สร้างตาราง categories และเพิ่มข้อมูลเริ่มต้น
 * รันด้วย: node backend/createCategoriesTable.js
 */

require('dotenv').config({ path: __dirname + '/.env' });
const mysql = require('mysql2/promise');

const INITIAL_CATEGORIES = [
  { name: 'สินค้าขายดี', icon: 'TrendingUp', color: 'bg-rose-50 border-rose-200' },
  { name: 'สินค้าโปรโมชั่น', icon: 'Percent', color: 'bg-red-50 border-red-200' },
  { name: 'ของเล่นเด็ก', icon: 'Gamepad2', color: 'bg-purple-50 border-purple-200' },
  { name: 'อุปกรณ์กีฬา', icon: 'Activity', color: 'bg-green-50 border-green-200' },
  { name: 'อุปกรณ์ทำความสะอาด', icon: 'Sparkles', color: 'bg-cyan-50 border-cyan-200' },
  { name: 'เครื่องครัว', icon: 'CookingPot', color: 'bg-orange-50 border-orange-200' },
  { name: 'อุปกรณ์แคมปิ้ง', icon: 'Tent', color: 'bg-emerald-50 border-emerald-200' },
  { name: 'พลาสติก', icon: 'Box', color: 'bg-blue-400 border-blue-200' },
  { name: 'อุปกรณ์ไฟฟ้า', icon: 'Zap', color: 'bg-yellow-50 border-yellow-200' },
  { name: 'เครื่องใช้ไฟฟ้า', icon: 'Plug', color: 'bg-yellow-100 border-yellow-300' },
  { name: 'อุปกรณ์สัตว์เลี้ยง', icon: 'PawPrint', color: 'bg-amber-50 border-amber-200' },
  { name: 'เครื่องมือช่าง', icon: 'Hammer', color: 'bg-slate-200 border-slate-300' },
  { name: 'สินค้าเทศกาล', icon: 'Gift', color: 'bg-pink-50 border-pink-200' },
  { name: 'เซรามิค', icon: 'Coffee', color: 'bg-stone-50 border-stone-200' },
  { name: 'อุปกรณ์ขายสินค้า', icon: 'Store', color: 'bg-indigo-50 border-indigo-200' },
  { name: 'ของใช้ในบ้าน', icon: 'Armchair', color: 'bg-teal-50 border-teal-200' },
  { name: 'กิ๊ฟช็อป', icon: 'Heart', color: 'bg-pink-100 border-pink-300' },
  { name: 'เครื่องบูชา', icon: 'Flame', color: 'bg-red-50 border-red-200' },
  { name: 'เครื่องเขียน', icon: 'Pencil', color: 'bg-sky-50 border-sky-200' },
  { name: 'อุปกรณ์ไอที', icon: 'Laptop', color: 'bg-slate-100 border-slate-300' },
  { name: 'เบ็ดเตล็ด', icon: 'MoreHorizontal', color: 'bg-gray-100 border-gray-200' },
];

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'linecommerce',
    });

    console.log('🔗 Connected to database:', process.env.DB_NAME);

    // 1. สร้างตาราง categories
    const createTableSql = `
        CREATE TABLE IF NOT EXISTS categories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            icon VARCHAR(100) DEFAULT 'Box',
            color VARCHAR(100) DEFAULT 'bg-slate-50 border-slate-200',
            displayOrder INT DEFAULT 0,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    try {
        await connection.execute(createTableSql);
        console.log('✅ Table "categories" is ready.');
    } catch (err) {
        console.error('❌ Error creating table:', err.message);
        process.exit(1);
    }

    // 2. ตรวจสอบว่ามีข้อมูลหรือยัง
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    if (rows[0].count === 0) {
        console.log('📦 Populating initial categories...');
        for (let i = 0; i < INITIAL_CATEGORIES.length; i++) {
            const cat = INITIAL_CATEGORIES[i];
            try {
                await connection.execute(
                    'INSERT INTO categories (name, icon, color, displayOrder) VALUES (?, ?, ?, ?)',
                    [cat.name, cat.icon, cat.color, i]
                );
            } catch (err) {
                console.error(`  ❌ Error inserting ${cat.name}:`, err.message);
            }
        }
        console.log(`✅ Table populated with ${INITIAL_CATEGORIES.length} categories.`);
    } else {
        console.log('⏭️ Table already has data. Skipping population.');
    }

    await connection.end();
    console.log('\n🎉 Category migration done!');
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
});
