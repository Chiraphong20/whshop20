/**
 * 🔧 Migration Script: เพิ่ม Column ราคา 1 / ราคา 2 / หน่วย ให้กับตาราง products
 * รันครั้งเดียวด้วย:  node backend/migrateProducts.js
 */

require('dotenv').config({ path: __dirname + '/.env' });
const mysql = require('mysql2/promise');

async function migrate() {
    const pool = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'linecommerce',
    });

    console.log('🔗 Connected to database:', process.env.DB_NAME);

    // รายการ Column ที่ต้องมีใน products
    const alterStatements = [
        // ราคาและหน่วย
        `ALTER TABLE products ADD COLUMN IF NOT EXISTS retailPrice    DECIMAL(10,2) NOT NULL DEFAULT 0`,
        `ALTER TABLE products ADD COLUMN IF NOT EXISTS wholesalePrice DECIMAL(10,2) NOT NULL DEFAULT 0`,
        `ALTER TABLE products ADD COLUMN IF NOT EXISTS minWholesaleQty INT NOT NULL DEFAULT 1`,
        `ALTER TABLE products ADD COLUMN IF NOT EXISTS unitQty        INT NOT NULL DEFAULT 1`,
        `ALTER TABLE products ADD COLUMN IF NOT EXISTS unit           VARCHAR(50)   NOT NULL DEFAULT 'ชิ้น'`,
        // ราคา Step (bulk)
        `ALTER TABLE products ADD COLUMN IF NOT EXISTS bulkQty        INT           NOT NULL DEFAULT 0`,
        `ALTER TABLE products ADD COLUMN IF NOT EXISTS bulkPrice      DECIMAL(10,2) NOT NULL DEFAULT 0`,
        // ข้อมูลทั่วไป
        `ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode        VARCHAR(100)  DEFAULT NULL`,
        `ALTER TABLE products ADD COLUMN IF NOT EXISTS imageId        VARCHAR(200)  NOT NULL DEFAULT ''`,
        `ALTER TABLE products ADD COLUMN IF NOT EXISTS images         JSON`,
        `ALTER TABLE products ADD COLUMN IF NOT EXISTS description    TEXT`,
    ];

    let ok = 0;
    let skip = 0;
    for (const sql of alterStatements) {
        try {
            await pool.execute(sql);
            const col = sql.match(/ADD COLUMN IF NOT EXISTS (\w+)/)?.[1];
            console.log(`  ✅ Column ready: ${col}`);
            ok++;
        } catch (err) {
            // MySQL รุ่นเก่าอาจไม่รองรับ IF NOT EXISTS → ลองตรวจสอบเอง
            if (err.code === 'ER_PARSE_ERROR') {
                // แปลง SQL เป็นแบบไม่มี IF NOT EXISTS แล้วดักจับ error ถ้า column มีอยู่แล้ว
                const fallbackSql = sql.replace(' IF NOT EXISTS', '');
                try {
                    await pool.execute(fallbackSql);
                    const col = fallbackSql.match(/ADD COLUMN (\w+)/)?.[1];
                    console.log(`  ✅ Column added: ${col}`);
                    ok++;
                } catch (err2) {
                    if (err2.code === 'ER_DUP_FIELDNAME') {
                        const col = fallbackSql.match(/ADD COLUMN (\w+)/)?.[1];
                        console.log(`  ⏭️  Column already exists (skipped): ${col}`);
                        skip++;
                    } else {
                        console.error(`  ❌ Error: ${err2.message}`);
                    }
                }
            } else if (err.code === 'ER_DUP_FIELDNAME') {
                const col = sql.match(/ADD COLUMN IF NOT EXISTS (\w+)/)?.[1];
                console.log(`  ⏭️  Column already exists (skipped): ${col}`);
                skip++;
            } else {
                console.error(`  ❌ Unexpected error: ${err.message}`);
            }
        }
    }

    console.log(`\n🎉 Migration done! Added: ${ok}, Skipped: ${skip}`);
    console.log('👉 ตาราง products พร้อมใช้งานแล้วครับ');
    await pool.end();
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
});
