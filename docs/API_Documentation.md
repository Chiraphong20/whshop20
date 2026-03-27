# เอกสารประกอบ API ของระบบ (API Documentation)

เอกสารนี้รวบรวมข้อมูล API ทั้งหมดที่ถูกเรียกใช้งานในระบบ Backend (อ้างอิงจาก `server.js`) มีการแบ่งหมวดหมู่เพื่อให้อ่านและนำไปพัฒนาต่อได้ง่ายขึ้นครับ

---

## 1. 🔐 Authentication & Admins (การจัดการผู้ดูแลระบบและเข้าสู่ระบบ)

| Method | Endpoint | Description | Request Body / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/login` | เข้าสู่ระบบแอดมิน | `{ username, password }` | `{ token, user }` |
| `POST` | `/api/auth/change-password`| เปลี่ยนรหัสผ่านแอดมิน | `{ username, oldPassword, newPassword }`| `{ success, message }` |
| `GET` | `/api/admins` | ดึงรายชื่อแอดมินทั้งหมด | - | `Array` ของแอดมิน |
| `POST` | `/api/admins` | สร้างแอดมินใหม่ (Super Admin) | `{ username, password, name, role, lineUserId }`| `{ success, message }` |
| `DELETE`| `/api/admins/:id` | ลบแอดมิน (ลบ Super Admin ไม่ได้)| `Params: id` | `{ success, message }` |
| `PATCH` | `/api/admins/:id` | ผูกบัญชี / อัปเดต LINE ID แอดมิน| `Params: id`, `{ lineUserId }` | `{ success, message }` |
| `PATCH` | `/api/admins/:id/profile` | อัปเดตชื่อแสดงผลของแอดมิน | `Params: id`, `{ name }` | `{ success, message }` |
| `POST` | `/api/admins/line-callback`| Callback สำหรับ LINE Login | `{ code, adminId }` | `{ success, lineUserId, displayName }` |

---

## 2. 📦 Products (การจัดการสินค้า)

| Method | Endpoint | Description | Request Body / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | ดึงข้อมูลสินค้าทั้งหมด | - | `Array` ของสินค้า |
| `POST` | `/api/products` | เพิ่มสินค้า 1 รายการ | `{ id, barcode, name, category, retailPrice, wholesalePrice, minWholesaleQty, unitQty, bulkQty, bulkPrice, stock, unit, image, imageId, images, description }` | `{ success, message }` |
| `POST` | `/api/products/bulk`| นำเข้าสินค้าพร้อมกันหลายรายการ | `{ products: [...] }` | `{ success, message }` |
| `PUT` | `/api/products` | อัปเดตข้อมูลสินค้า | *(เหมือน POST `/api/products`)* | `{ success, message }` |
| `DELETE`| `/api/products` | ลบสินค้า | `Query: id` | `{ success, message }` |

---

## 3. 🛒 Orders (การจัดการคำสั่งซื้อ)

| Method | Endpoint | Description | Request Body / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/orders` | ดึงข้อมูลคำสั่งซื้อทั้งหมด | - | `Array` ของคำสั่งซื้อ |
| `GET` | `/api/orders/track` | ลูกค้าค้นหาออเดอร์ | `Query: lineUserId` หรือ `(orderId + contact)`| `{ success, orders }` |
| `POST` | `/api/orders` | สร้างคำสั่งซื้อใหม่ & แจ้งเตือนผ่าน LINE| `{ customerName, customerContact, address, deliveryMethod ("DELIVERY"\|"PICKUP"), totalAmount, items, customerLineUserId?, customerLineDisplayName?, customerLinePictureUrl? }` | `{ success, message, id }` |
| `PUT` | `/api/orders/:id/status` | อัปเดตสถานะ (หาก `CONFIRMED` สต๊อกจะลด)| `Params: id`, `{ status, managedBy }` | `{ success }` |
| `PUT` | `/api/orders/:id` | อัปเดตรายการสินค้า/ยอดเงิน | `Params: id`, `{ items, totalAmount }` | `{ success }` |
| `PUT` | `/api/orders/:id/shipping` | อัปเดตเลขพัสดุและบริษัทขนส่ง | `Params: id`, `{ trackingNumber, courier, status }`| `{ success }` |
| `DELETE`| `/api/orders/:id` | ลบคำสั่งซื้อทิ้งถาวร | `Params: id` | `{ success, message }` |

---

## 4. 📢 Posts (โปรโมชั่นและข่าวสาร)

| Method | Endpoint | Description | Request Body / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/posts` | ดึงข้อมูลโพสต์ทั้งหมด | - | `Array` ของโพสต์ |
| `POST` | `/api/posts` | สร้างโพสต์ใหม่ | `{ id, title, description, linkedProductIds, createdAt, expiresAt, isActive }`| `{ success, message }` |
| `PUT` | `/api/posts` | อัปเดตข้อมูลโพสต์ | *(เหมือน POST แต่รับ id เพื่อระบุตัว)* | `{ success, message }` |
| `DELETE`| `/api/posts` | ลบโพสต์ | `Query: id` | `{ success, message }` |
| `GET` | `/promotions/:id` | อ่าน HTML พร้อมพิมพ์ OG Data | `Params: id` | `HTML String` (สำหรับ SEO/Share โซเชียล)|

---

## 5. ⚙️ Settings (การตั้งค่าระบบ)

| Method | Endpoint | Description | Request Body / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/settings/:key` | ดึงค่า Setting ตัวใดตัวหนึ่ง | `Params: key` | `{ success, data: (JSON) }` |
| `PUT` | `/api/settings/:key` | บันทึกหรืออัปเดต Setting ตัวใดตัวหนึ่ง| `Params: key`, `Body: (JSON Object)` | `{ success, message }` |

---

## 6. 📱 LINE API (Webhook)

| Method | Endpoint | Description | Request Body / Params | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/webhook` | Webhook ใช้รับ Event จาก LINE Bot (เช่น ตอนลากบอทเข้ากลุ่ม) | `Body: events` จากเซิร์ฟเวอร์ LINE | `200 OK` |

---

*หมายเหตุ: API ส่วนหน้าบ้านและหลังบ้านต่อกันผ่าน `VITE_API_URL` หรือกรณีรัน Local คือ `http://localhost:5000` (Backend) และ `http://localhost:5173` (Frontend)*

*อัปเดตล่าสุด: 27 มีนาคม 2569 — เพิ่ม `PATCH /api/admins/:id/profile` และปรับปรุง `deliveryMethod` field ใน POST /api/orders*
