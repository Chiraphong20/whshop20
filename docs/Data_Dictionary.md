# พจนานุกรมข้อมูล (Data Dictionary)

เอกสารนี้รวบรวมรายละเอียดโครงสร้างของแต่ละตารางในฐานข้อมูล (Physical Data Model) โดยอธิบายชื่อคอลัมน์, ชนิดข้อมูล (Data Type), ค่าใช้งานเริ่มต้น (Default) และรายละเอียดของข้อมูลที่จัดเก็บ

---

## 1. ตาราง: `admins` 
**คำอธิบาย:** จัดเก็บข้อมูลผู้ดูแลระบบและสิทธิ์การเข้าใช้งานระบบ รวมถึงเชื่อมต่อกับบัญชี LINE ของระบบหลังบ้าน

| ชื่อคอลัมน์ (Field) | ชนิดข้อมูล (Type) | เงื่อนไข (Constraints) | ค่าเริ่มต้น (Default) | คำอธิบาย (Description) |
| :--- | :--- | :--- | :--- | :--- |
| `id` | int(11) | PK, NOT NULL, AUTO_INCREMENT | - | รหัสผู้ดูแลระบบ (Primary Key) |
| `username` | varchar(50) | UK, NOT NULL | - | ชื่อผู้ใช้สำหรับระบบ Login |
| `password` | varchar(255) | NOT NULL | - | รหัสผ่าน (เข้ารหัสแบบ BCRYPT) |
| `name` | varchar(100) | NOT NULL | - | ชื่อแสดงผล / นามสกุล |
| `role` | enum | NOT NULL | 'ADMIN' | สิทธิ์ผู้ใช้งาน (`ADMIN` หรือ `SUPER_ADMIN`) |
| `createdAt` | timestamp | NULL | current_timestamp() | วันและเวลาที่สร้างบัญชีนี้ |
| `lineUserId` | varchar(50) | NULL | - | ไอดีผู้ใช้ LINE Profile สำหรับรับแจ้งเตือนหรือ Login |

---

## 2. ตาราง: `orders`
**คำอธิบาย:** จัดเก็บข้อมูลคำสั่งซื้อสินค้าและข้อมูลลูกค้าที่สั่งซื้อ รายการสินค้าต่างๆ จะถูกบันทึกเป็น JSON String ไว้ในฟิลด์ `items` เพื่อให้ไม่เกิดผลกระทบหากสินค้าถูกเปลี่ยนราคาหรือลบทิ้งในอนาคต

| ชื่อคอลัมน์ (Field) | ชนิดข้อมูล (Type) | เงื่อนไข (Constraints) | ค่าเริ่มต้น (Default) | คำอธิบาย (Description) |
| :--- | :--- | :--- | :--- | :--- |
| `id` | varchar(50) | PK, NOT NULL | - | รหัสคำสั่งซื้อ (เช่น ORD04-03-01) |
| `customerName` | varchar(255) | NULL | - | ชื่อลูกค้า |
| `customerContact` | varchar(255) | NULL | - | ข้อมูลติดต่อลูกค้า (เช่น เบอร์โทร) |
| `address` | text | NULL | - | ที่อยู่สำหรับจัดส่ง |
| `deliveryMethod` | varchar(50) | NULL | - | วิธีจัดส่ง (เช่น DELIVERY, PICKUP) |
| `status` | varchar(50) | NULL | - | สถานะออเดอร์ (เช่น PENDING, CONFIRMED) |
| `totalAmount` | decimal(10,2)| NULL | - | ยอดรวมสุทธิของบิล |
| `items` | longtext | NULL | - | รายการสินค้า JSON Array (`[{productId, name, price, qty}]`) |
| `trackingNumber` | varchar(100) | NULL | - | หมายเลขพัสดุสำหรับติดตาม (Tracking) |
| `courier` | varchar(100) | NULL | - | บริษัทจัดส่ง (โลจิสติกส์) |
| `timestamp` | datetime | NULL | - | วันที่และเวลาที่สั่งซื้อ |
| `managedBy` | varchar(50) | NULL | - | ชื่อ username แอดมินที่เป็นคนรับออเดอร์นี้ |
| `customerLineUserId`| varchar(50) | NULL | - | LINE User ID ของลูกค้า (กรณีเข้าระบบผ่าน LIFF) |
| `customerLineDisplayName`| varchar(255)| NULL | - | ชื่อใน LINE ของลูกค้า |
| `customerLinePictureUrl`| text | NULL | - | URL รูปภาพโปรไฟล์ LINE ของลูกค้า |

---

## 3. ตาราง: `products`
**คำอธิบาย:** จัดเก็บข้อมูลสินค้า, บาร์โค้ด, หมวดหมู่ และกลไกราคา (ราคาปลีก / ส่ง / ยกลัง) รวมถึงสต๊อกสินค้า

| ชื่อคอลัมน์ (Field) | ชนิดข้อมูล (Type) | เงื่อนไข (Constraints) | ค่าเริ่มต้น (Default) | คำอธิบาย (Description) |
| :--- | :--- | :--- | :--- | :--- |
| `id` | varchar(50) | PK, NOT NULL | - | รหัสสินค้าแบบกำหนดเองหรือ Gen ขึ้นมา |
| `barcode` | varchar(100) | NULL | - | บาร์โค้ดสินค้า (รับจากเครื่องสแกน) |
| `name` | varchar(255) | NOT NULL | - | ชื่อสินค้า |
| `category` | varchar(100) | NOT NULL | - | หมวดหมู่ของสินค้า (เช่น เครื่องใช้, ของกิน) |
| `retailPrice` | decimal(10,2)| NOT NULL | - | ราคาขายปลีก |
| `wholesalePrice`| decimal(10,2)| NOT NULL | - | ราคาขายส่ง (เมื่อซื้อถึงยอดขั้นต่ำ) |
| `minWholesaleQty`| int(11) | NOT NULL | - | จำนวนชิ้นขั้นต่ำที่จะได้ราคาขายส่ง |
| `stock` | int(11) | NOT NULL | 0 | จำนวนสินค้าคงเหลือ |
| `unit` | varchar(50) | NULL | - | หน่วยเรียก (เช่น ชิ้น, ใบ, กล่อง) |
| `image` | text | NULL | - | URL ของภาพหน้าปกสินค้า |
| `images` | longtext | NULL | - | รายการ URL ภาพเสริมของสินค้า (JSON Array) |
| `description` | text | NULL | - | รายละเอียดของสินค้าเพิ่มเติม |
| `imageId` | varchar(255) | NULL | - | ID อ้างอิงภาพใน Cloud (ใช้สำหรับตอนลบภาพ) |
| `unitQty` | int(11) | NULL | 1 | จำนวนย่อยใน 1 ชุด |
| `bulkQty` | int(11) | NULL | 0 | จำนวนต่อ 1 ลัง (ใช้คำนวณราคายกลัง) |
| `bulkPrice` | int(11) | NULL | 0 | ราคาซื้อยกลัง (เหมาลัง) |

---

## 4. ตาราง: `posts`
**คำอธิบาย:** จัดเก็บข้อมูลโปรโมชั่น ข่าวสาร และบอร์ดประกาศหน้าร้าน

| ชื่อคอลัมน์ (Field) | ชนิดข้อมูล (Type) | เงื่อนไข (Constraints) | ค่าเริ่มต้น (Default) | คำอธิบาย (Description) |
| :--- | :--- | :--- | :--- | :--- |
| `id` | varchar(50) | PK, NOT NULL | - | รหัสโพสต์ (UUID หรือจัดเจนอัตโนมัติ) |
| `title` | varchar(255) | NOT NULL | - | หัวข้อโพสต์ |
| `description` | text | NULL | - | เนื้อหา/รายละเอียดของโพสต์ |
| `linkedProductIds`| longtext | NULL | - | รหัสสินค้าที่เชื่อมโยงกับโปรโมชั่นนี้ (JSON Array) |
| `createdAt` | datetime | NULL | - | วันที่สร้างโพสต์ |
| `expiresAt` | datetime | NULL | - | วันที่หมดอายุ (ซ่อนอัตโนมัติ) |
| `isActive` | tinyint(1) | NULL | 1 | สถานะเปิด/ปิดการแสดงผลหน้าร้าน (1=เปิด 0=ปิด)|

---

## 5. ตาราง: `settings`
**คำอธิบาย:** จัดเก็บข้อมูลการตั้งค่าโครงสร้างของเว็บ หรือค่า Config ของร้านค้าในรูปแบบ Key-Value

| ชื่อคอลัมน์ (Field) | ชนิดข้อมูล (Type) | เงื่อนไข (Constraints) | ค่าเริ่มต้น (Default) | คำอธิบาย (Description) |
| :--- | :--- | :--- | :--- | :--- |
| `setting_key` | varchar(50) | PK, NOT NULL | - | คีย์สแลงของการตั้งค่า (เช่น store_name, color) |
| `setting_value` | text | NOT NULL | - | ข้อมูลการตั้งค่า (มักจะ Serialize เป็น JSON) |
| `description` | varchar(255) | NULL | - | คำอธิบายของการค่านี้ |
