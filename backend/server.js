const express = require('express');
const cors = require('cors');
const pool = require('./db');
const fs = require('fs');
const path = require('path');
const line = require('@line/bot-sdk');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_linecommerce';

const app = express();
const PORT = process.env.PORT || 5000;

// =========================================================
// 🟢 1. ตั้งค่า LINE Messaging API & Middleware
// =========================================================
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || 's4iF24BZkyPHdmfIyOSAYFq5UnjHagkDOGKfiwu7bouY5sEDMpSiXISHaNOzN2nj4IYjFCii2880amIOtC4o+iAu+FJpkg2tQD90kQqqeas1DGRubPLT6fuqTIGou7A7DFPVykAhMFceBIf1PepsKwdB04t89/1O/w1cDnyilFU=',
  channelSecret: process.env.LINE_CHANNEL_SECRET || 'aacb68a48a5137d86d987420d017aa4f'
};
const lineClient = new line.messagingApi.MessagingApiClient(lineConfig);
const middleware = line.middleware(lineConfig);

// =========================================================
// 🌐 API: Webhook สำหรับแจ้งเตือนและรับ Group ID ของ LINE Group
// =========================================================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
}));

// 🟢 Middleware ตัวนี้จะ parse body ของ API อื่นๆ
app.use(express.json());

app.post('/api/webhook', (req, res) => {
  try {
    const events = req.body.events;
    if (events && events.length > 0) {
      events.forEach(event => {
        // เมื่อบอทถูกเชิญเข้ากลุ่ม หรือมีคนพิมพ์ข้อความในกลุ่ม
        if (event.source && (event.source.type === 'group' || event.source.type === 'room')) {
          const groupId = event.source.groupId || event.source.roomId;
          console.log(`\n===========================================`);
          console.log(`🎯 LINE BOT ถูกเชิญเข้ากลุ่ม!`);
          console.log(`📌 ให้ก็อปปี้ Group ID ด้านล่างนี้ ไปใส่ในไฟล์ .env`);
          console.log(`ADMIN_LINE_GROUP_ID=${groupId}`);
          console.log(`===========================================\n`);
        } else {
          console.log(`[DEBUG] Received LINE event, but not a group invite. Type: ${event.source?.type}`);
        }
      });
    } else {
      console.log(`[DEBUG] Webhook hit but no events found array:`, req.body);
    }
    // ตอบกลับ 200 OK ให้ LINE ทราบว่าได้รับ Webhook แล้ว
    res.status(200).send('OK');
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(500).end();
  }
});

// =========================================================
// 🔐 API: Authentication
// =========================================================

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);

    if (rows.length === 0) {
      return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { username, oldPassword, newPassword } = req.body;

    const [rows] = await pool.query('SELECT * FROM admins WHERE username = ?', [username]);
    if (rows.length === 0) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });

    const admin = rows[0];
    const isMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isMatch) return res.status(400).json({ error: 'รหัสผ่านเดิมไม่ถูกต้อง' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.execute('UPDATE admins SET password = ? WHERE id = ?', [hashed, admin.id]);

    res.json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================
// 👥 API: จัดการผู้ใช้งาน (Admins) สำหรับ Super Admin
// =========================================================

app.get('/api/admins', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, username, name, role FROM admins');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admins', async (req, res) => {
  try {
    const { username, password, name, role, lineUserId } = req.body;

    // ตรวจสอบว่า username ซ้ำหรือไม่
    const [existing] = await pool.query('SELECT id FROM admins WHERE username = ?', [username]);
    if (existing.length > 0) return res.status(400).json({ error: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.execute(
      'INSERT INTO admins (username, password, name, role, lineUserId) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, name, role || 'ADMIN', lineUserId || null]
    );

    res.status(201).json({ success: true, message: 'เพิ่มผู้ดูแลระบบสำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admins/:id', async (req, res) => {
  try {
    // ป้องกันไม่ให้ลบ Super Admin หลัก (id=1 หรือ role=SUPER_ADMIN)
    const [admin] = await pool.query('SELECT role FROM admins WHERE id = ?', [req.params.id]);
    if (admin.length > 0 && admin[0].role === 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'ไม่สามารถลบ Super Admin ได้' });
    }

    await pool.execute('DELETE FROM admins WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'ลบผู้ดูแลระบบสำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admins/:id', async (req, res) => {
  try {
    const { lineUserId } = req.body;
    await pool.execute('UPDATE admins SET lineUserId = ? WHERE id = ?', [lineUserId || null, req.params.id]);
    res.json({ success: true, message: 'อัปเดต LINE ของผู้ดูแลระบบสำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// อัปเดตชื่อแสดงผลของแอดมิน (สำหรับหน้า Profile)
app.patch('/api/admins/:id/profile', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'กรุณาระบุชื่อ' });
    await pool.execute('UPDATE admins SET name = ? WHERE id = ?', [name.trim(), req.params.id]);
    res.json({ success: true, message: 'อัปเดตชื่อสำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// (Webhook function ถูกย้ายไปด้านบนเพื่อไม่ให้ติดปัญหา express.json parse body)

// =========================================================
// 📱 LINE Login OAuth2: เชื่อมต่อบัญชี LINE ของแอดมินผ่าน OAuth
// =========================================================
app.post('/api/admins/line-callback', async (req, res) => {
  try {
    const { code, adminId } = req.body;
    const channelId = process.env.LINE_LOGIN_CHANNEL_ID;
    const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET;
    const redirectUri = `${req.headers.origin || 'http://localhost:5173'}/admin/line-callback`;

    // 1. แลกเปลี่ยน Code เป็น Access Token
    const tokenRes = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: channelId,
        client_secret: channelSecret
      })
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.status(400).json({ error: 'ไม่สามารถดึง Access Token ได้', detail: tokenData });
    }

    // 2. ดึงข้อมูลโปรไฟล์ LINE
    const profileRes = await fetch('https://api.line.me/v2/profile', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const profile = await profileRes.json();
    if (!profile.userId) {
      return res.status(400).json({ error: 'ไม่สามารถดึงโปรไฟล์ LINE ได้' });
    }

    // 3. บันทึก lineUserId เข้าไปในตาราง admins
    await pool.execute('UPDATE admins SET lineUserId = ? WHERE id = ?', [profile.userId, adminId]);

    res.json({ success: true, lineUserId: profile.userId, displayName: profile.displayName });
  } catch (err) {
    console.error('❌ LINE Login Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// =========================================================
// 🛒 3. API: จัดการออเดอร์ (Orders)
// =========================================================

// ดึงออเดอร์ทั้งหมด (GET)
app.get('/api/orders', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM orders ORDER BY timestamp DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ลบออเดอร์ถาวร (DELETE)
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.execute('DELETE FROM orders WHERE id = ?', [id]);
    res.json({ success: true, message: 'ลบออเดอร์สำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ลูกค้าค้นหาออเดอร์ของตัวเอง (GET)
app.get('/api/orders/track', async (req, res) => {
  try {
    const { lineUserId, orderId, contact } = req.query;

    if (lineUserId) {
      // 1. ค้นหาด้วย LINE ID (ดึงมาทั้งหมดของคนนี้)
      const [rows] = await pool.query('SELECT * FROM orders WHERE customerLineUserId = ? ORDER BY timestamp DESC', [lineUserId]);
      return res.json({ success: true, orders: rows });
    } else if (orderId && contact) {
      // 2. ค้นหาด้วย Order ID คู่กับเบอร์โทร (เพื่อความปลอดภัย)
      const [rows] = await pool.query('SELECT * FROM orders WHERE id = ? AND customerContact = ?', [orderId, contact]);
      return res.json({ success: true, orders: rows });
    } else {
      return res.status(400).json({ error: 'กรุณาระบุ LINE ID หรือ OrderID+เบอร์โทร' });
    }
  } catch (err) {
    console.error("Track Order Error:", err);
    res.status(500).json({ error: err.message });
  }
});

// บันทึกออเดอร์ใหม่ & แจ้งเตือน LINE (POST)
app.post('/api/orders', async (req, res) => {
  try {
    const { customerName, customerContact, address, deliveryMethod, status, totalAmount, items, timestamp, customerLineUserId, customerLineDisplayName, customerLinePictureUrl } = req.body;

    // 1. สร้าง ID ใหม่: ORD + DD-MM + - + Sequence
    const nowLocal = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    const dd = String(nowLocal.getDate()).padStart(2, '0');
    const mm = String(nowLocal.getMonth() + 1).padStart(2, '0');
    const prefix = `ORD${dd}-${mm}-`;

    const [rows] = await pool.query(`SELECT id FROM orders WHERE id LIKE ? ORDER BY id DESC LIMIT 1`, [`${prefix}%`]);
    let seq = 1;
    if (rows.length > 0) {
      const lastId = rows[0].id; // e.g. ORD04-03-01
      const parts = lastId.split('-');
      if (parts.length === 3 && !isNaN(parts[2])) {
        seq = parseInt(parts[2], 10) + 1;
      }
    }
    const generatedId = `${prefix}${String(seq).padStart(2, '0')}`;

    // 2. บันทึกลง Database
    const sql = `INSERT INTO orders (id, customerName, customerContact, address, deliveryMethod, status, totalAmount, items, timestamp, customerLineUserId, customerLineDisplayName, customerLinePictureUrl) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [generatedId, customerName, customerContact, address, deliveryMethod || 'DELIVERY', status || 'PENDING', totalAmount, JSON.stringify(items), new Date(timestamp || Date.now()), customerLineUserId || null, customerLineDisplayName || null, customerLinePictureUrl || null];

    await pool.execute(sql, values);

    // 2. เตรียมข้อความแจ้งเตือน (ใช้ชื่อ messageText ให้ชัดเจน)
    const orderItemsText = items.map(item => `- ${item.productName || item.name} (${item.quantity} ชิ้น)`).join('\n');

    // URL สำหรับกดเข้าดูออเดอร์ในระบบหลังบ้าน
    const adminUrl = process.env.VITE_API_URL
      ? `${process.env.VITE_API_URL}/admin/orders`
      : `http://localhost:5173/admin/orders`;

    const messageText = `📢 มี Order เข้าแล้วนะะ ตรวจสอบให้หน่อย!\n` +
      `--------------------------\n` +
      `👤 ลูกค้า: ${customerName}${customerLineDisplayName ? ` (ชื่อไลน์: ${customerLineDisplayName})` : ''}\n` +
      `📞 เบอร์ติดต่อ: ${customerContact}\n` +
      `💰 ยอดรวม: ${totalAmount.toLocaleString()} บาท\n` +
      `🏠 ที่อยู่: ${address}\n\n` +
      `📦 รายการสินค้า:\n` +
      `${orderItemsText}\n` +
      `--------------------------\n` +
      `🔗 ดูออเดอร์: ${adminUrl}`;

    try {
      const groupID = process.env.ADMIN_LINE_GROUP_ID;


      // 🌟 ถ้าระบุ ADMIN_LINE_GROUP_ID ใน .env ให้ส่งเข้ากลุ่มแทน
      if (groupID && groupID.trim().length > 0) {
        await lineClient.pushMessage({
          to: groupID,
          messages: [{ type: 'text', text: messageText }]
        });
        console.log(`✅ LINE Notification Sent to Group! (${groupID})`);
      } else {
        // 🌟 ถ้ายืนยันไม่มี Group ID -> ส่งแยกรายบุคคลตามเดิม
        const [adminRows] = await pool.query('SELECT lineUserId FROM admins WHERE lineUserId IS NOT NULL AND lineUserId != ""');
        const dbAdmins = adminRows.map(row => row.lineUserId);

        const envAdmins = process.env.ADMIN_LINE_USER_IDS
          ? process.env.ADMIN_LINE_USER_IDS.split(',').map(id => id.trim()).filter(id => id.length > 0)
          : [];

        // ใช้ Set ในการตัด User ID ที่ซ้ำกันออก
        const adminUserIds = [...new Set([...dbAdmins, ...envAdmins])];

        if (adminUserIds.length > 0) {
          let successCount = 0;
          for (const uid of adminUserIds) {
            try {
              await lineClient.pushMessage({
                to: uid,
                messages: [{
                  type: 'text',
                  text: messageText
                }]
              });
              successCount++;
            } catch (e) {
              console.error(`❌ Failed to send LINE message to ${uid}:`, e.body?.message || e.message);
            }
          }
          console.log(`✅ LINE Notification Sent to Admins! (${successCount}/${adminUserIds.length} users)`);
        } else {
          console.log("⚠️ ไม่มีแอดมินคนไหนตั้งค่า LINE User ID ไว้หน้าเว็บ หรือในไฟล์ .env (ระบบจึงบันทึกออเดอร์แต่ไม่ส่งแชท LINE)");
        }
      }
    } catch (lineError) {
      // 🌟 แก้ไขตรงนี้: ใช้ lineError แทน message ที่ไม่มีอยู่จริง
      console.error("❌ LINE Error Details:", lineError.body || lineError);
    }

    // ✅ ส่ง Response กลับไปหาหน้าเว็บ "แค่ครั้งเดียว" ตรงนี้
    return res.status(201).json({ success: true, message: 'บันทึกออเดอร์และแจ้งเตือนสำเร็จ', id: generatedId });

  } catch (err) {
    console.error("Order Error:", err);
    // 🌟 ถ้าส่ง res ไปแล้ว (เช่น error เกิดหลังจากบันทึก DB) จะไม่ส่งซ้ำ
    if (!res.headersSent) {
      return res.status(500).json({ error: err.message });
    }
  }
});
// อัปเดตสถานะออเดอร์ (PUT)
app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status, managedBy } = req.body;

    // Fetch current order status to track transitions
    const [orders] = await pool.query('SELECT status, items FROM orders WHERE id = ?', [req.params.id]);
    if (orders.length === 0) return res.status(404).json({ error: 'Order not found' });

    const currentStatus = orders[0].status;
    const items = typeof orders[0].items === 'string' ? JSON.parse(orders[0].items) : orders[0].items;

    // Deduct stock if transitioning to CONFIRMED
    if (currentStatus === 'PENDING' && status === 'CONFIRMED') {
      for (const item of items) {
        await pool.execute('UPDATE products SET stock = GREATEST(stock - ?, 0) WHERE id = ?', [item.quantity, item.productId]);
      }
    }

    let sql = 'UPDATE orders SET status = ?';
    let values = [status];
    if (managedBy) {
      sql += ', managedBy = ?';
      values.push(managedBy);
    }
    sql += ' WHERE id = ?';
    values.push(req.params.id);

    await pool.execute(sql, values);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// อัปเดตข้อมูลออเดอร์ (รายการสินค้าและยอดเงิน)
app.put('/api/orders/:id', async (req, res) => {
  try {
    const { items, totalAmount } = req.body;
    await pool.execute('UPDATE orders SET items = ?, totalAmount = ? WHERE id = ?', [items, totalAmount, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// อัปเดตเลขพัสดุ และสถานะจัดส่งสำเร็จ (PUT)
app.put('/api/orders/:id/shipping', async (req, res) => {
  try {
    const { trackingNumber, courier, status } = req.body;
    await pool.execute('UPDATE orders SET trackingNumber = ?, courier = ?, status = ? WHERE id = ?', [trackingNumber, courier, status, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// =========================================================
// 📦 4. API: จัดการสินค้า (Products)
// =========================================================

app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM products');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/products', async (req, res) => {
  try {
    const { id, barcode, name, category, retailPrice, wholesalePrice, minWholesaleQty, unitQty, bulkQty, bulkPrice, stock, unit, image, imageId, images, description } = req.body;
    const sql = `INSERT INTO products (id, barcode, name, category, retailPrice, wholesalePrice, minWholesaleQty, unitQty, bulkQty, bulkPrice, stock, unit, image, imageId, images, description) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [id, barcode || null, name, category, retailPrice, wholesalePrice, minWholesaleQty, unitQty || 1, bulkQty || 0, bulkPrice || 0, stock, unit || 'ชิ้น', image || '', imageId || '', JSON.stringify(images || []), description || ''];

    await pool.execute(sql, values);
    res.status(201).json({ success: true, message: 'เพิ่มสินค้าสำเร็จ' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'รหัสสินค้าหรือบาร์โค้ดซ้ำ' });
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการบันทึก' });
  }
});

app.post('/api/products/bulk', async (req, res) => {
  try {
    const { products } = req.body; // array of products
    let added = 0;

    for (const p of products) {
      const sql = `INSERT INTO products (id, barcode, name, category, retailPrice, wholesalePrice, minWholesaleQty, unitQty, bulkQty, bulkPrice, stock, unit, image, imageId, images, description) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                   ON DUPLICATE KEY UPDATE 
                   barcode=VALUES(barcode), name=VALUES(name), category=VALUES(category), retailPrice=VALUES(retailPrice), 
                   wholesalePrice=VALUES(wholesalePrice), minWholesaleQty=VALUES(minWholesaleQty), unitQty=VALUES(unitQty), 
                   bulkQty=VALUES(bulkQty), bulkPrice=VALUES(bulkPrice), stock=VALUES(stock), 
                   unit=VALUES(unit), image=VALUES(image), imageId=VALUES(imageId), images=VALUES(images), description=VALUES(description)`;

      const values = [p.id, p.barcode || null, p.name, p.category, p.retailPrice, p.wholesalePrice, p.minWholesaleQty, p.unitQty || 1, p.bulkQty || 0, p.bulkPrice || 0, p.stock || 0, p.unit || 'ชิ้น', p.image || '', p.imageId || '', JSON.stringify(p.images || []), p.description || ''];

      await pool.execute(sql, values);
      added++;
    }

    res.json({ success: true, message: `อิมพอร์ตสินค้าจำนวน ${added} สำเร็จ!` });
  } catch (error) {
    console.error("Bulk Import Error:", error);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล' });
  }
});

app.put('/api/products', async (req, res) => {
  try {
    const { id, barcode, name, category, retailPrice, wholesalePrice, minWholesaleQty, unitQty, bulkQty, bulkPrice, stock, unit, image, imageId, images, description } = req.body;
    const sql = `UPDATE products SET barcode=?, name=?, category=?, retailPrice=?, wholesalePrice=?, minWholesaleQty=?, unitQty=?, bulkQty=?, bulkPrice=?, stock=?, unit=?, image=?, imageId=?, images=?, description=? WHERE id=?`;
    const values = [barcode || null, name, category, retailPrice, wholesalePrice, minWholesaleQty, unitQty || 1, bulkQty || 0, bulkPrice || 0, stock, unit, image || '', imageId || '', JSON.stringify(images || []), description || '', id];

    await pool.execute(sql, values);
    res.json({ success: true, message: 'แก้ไขสำเร็จ' });
  } catch (error) { res.status(500).json({ error: 'แก้ไขไม่สำเร็จ' }); }
});

app.delete('/api/products', async (req, res) => {
  try {
    const { id } = req.query;
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);
    res.json({ success: true, message: 'ลบสำเร็จ' });
  } catch (error) { res.status(500).json({ error: 'ลบไม่สำเร็จ' }); }
});

// =========================================================
// 📢 5. API: จัดการโปรโมชั่น (Posts)
// =========================================================

app.get('/api/posts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM posts ORDER BY createdAt DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/posts', async (req, res) => {
  try {
    const { id, title, description, linkedProductIds, createdAt, expiresAt, isActive } = req.body;
    const sql = `INSERT INTO posts (id, title, description, linkedProductIds, createdAt, expiresAt, isActive) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      id, title, description || '', JSON.stringify(linkedProductIds || []),
      new Date(createdAt).toISOString().slice(0, 19).replace('T', ' '),
      expiresAt ? new Date(expiresAt).toISOString().slice(0, 19).replace('T', ' ') : null,
      isActive ? 1 : 0
    ];

    await pool.execute(sql, values);
    res.status(201).json({ success: true, message: 'สร้างโพสต์สำเร็จ' });
  } catch (err) { res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสร้างโพสต์' }); }
});

app.put('/api/posts', async (req, res) => {
  try {
    const { id, title, description, linkedProductIds, createdAt, expiresAt, isActive } = req.body;
    const sql = `UPDATE posts SET title=?, description=?, linkedProductIds=?, createdAt=?, expiresAt=?, isActive=? WHERE id=?`;

    const values = [
      title, description || '', JSON.stringify(linkedProductIds || []),
      new Date(createdAt).toISOString().slice(0, 19).replace('T', ' '),
      expiresAt ? new Date(expiresAt).toISOString().slice(0, 19).replace('T', ' ') : null,
      isActive ? 1 : 0, id
    ];

    await pool.execute(sql, values);
    res.json({ success: true, message: 'แก้ไขโพสต์สำเร็จ' });
  } catch (err) { res.status(500).json({ error: 'แก้ไขโพสต์ไม่สำเร็จ' }); }
});

app.delete('/api/posts', async (req, res) => {
  try {
    const { id } = req.query;
    await pool.execute('DELETE FROM posts WHERE id = ?', [id]);
    res.json({ success: true, message: 'ลบโพสต์สำเร็จ' });
  } catch (err) { res.status(500).json({ error: 'ลบโพสต์ไม่สำเร็จ' }); }
});

// =========================================================
// 🌐 6. Route ดักจับการแชร์ลิงก์โปรโมชั่น (OG Tags)
// =========================================================
app.get('/promotions/:id', async (req, res) => {
  const postId = req.params.id;

  try {
    // ดึงข้อมูลโพสต์จากฐานข้อมูลจริงๆ
    const [posts] = await pool.query('SELECT * FROM posts WHERE id = ?', [postId]);

    let postTitle = `Wonghiranshop โปรโมชั่น!`;
    let postDesc = "คลิกเพื่อดูรายการสินค้าลดราคา";
    let coverImage = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=800&auto=format&fit=crop"; // รูป Default

    if (posts.length > 0) {
      postTitle = posts[0].title;
      postDesc = posts[0].description || postDesc;
      // ถ้าในอนาคต post มี image ให้ดึงมาใส่ตรงนี้ เช่น coverImage = posts[0].image || coverImage;
    }

    const indexPath = path.resolve(__dirname, '../dist/index.html');
    let html = fs.readFileSync(indexPath, 'utf8');

    // สอดไส้ข้อมูลลงไป
    html = html.replace(
      '<meta property="og:title" content="Wonghiranshop 20 บาท - โปรโมชั่นลดราคาพิเศษ!" />',
      `<meta property="og:title" content="${postTitle}" />`
    );
    html = html.replace(
      '<meta property="og:description" content="พบกับสินค้าคุณภาพหลากหลายรายการ หมวดหมู่ของใช้ เครื่องครัว ของเล่น ในราคาสุดคุ้ม แวะมาช้อปกันเลย!" />',
      `<meta property="og:description" content="${postDesc}" />`
    );
    html = html.replace(
      '<meta property="og:image" content="https://res.cloudinary.com/.../ใส่ลิงก์รูปภาพโลโก้ร้านที่นี่.jpg" />',
      `<meta property="og:image" content="${coverImage}" />`
    );

    res.send(html);
  } catch (error) {
    console.error("Error replacing OG Tags:", error);
    res.sendFile(path.resolve(__dirname, '../dist/index.html'));
  }
});

// =========================================================
// ⚙️ 7. API: จัดการตั้งค่าระบบ (Settings)
// =========================================================

app.get('/api/settings/:key', async (req, res) => {
  try {
    const key = req.params.key;
    const [rows] = await pool.query('SELECT setting_value FROM settings WHERE setting_key = ?', [key]);

    if (rows.length > 0) {
      // Parse JSON string กลับมาเป็น Object
      const value = JSON.parse(rows[0].setting_value);
      res.json({ success: true, data: value });
    } else {
      res.status(404).json({ error: 'ไม่พบการตั้งค่านี้' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/settings/:key', async (req, res) => {
  try {
    const key = req.params.key;
    const value = JSON.stringify(req.body); // แปลง Object เป็น JSON String ก่อนเก็บ

    // บันทึก/อัปเดต โดยใช้ UPSERT (ON DUPLICATE KEY UPDATE)
    await pool.execute(
      'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      [key, value, value]
    );

    res.json({ success: true, message: 'บันทึกการตั้งค่าสำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =========================================================
// 🚀 8. Backend-only API (Frontend is hosted on Vercel)

// สั่งให้ Server เริ่มทำงาน
app.listen(PORT, () => {
  console.log(`✅ Backend Server รันอยู่บนพอร์ต ${PORT}`);
  console.log(`👉 http://localhost:${PORT}`);
});