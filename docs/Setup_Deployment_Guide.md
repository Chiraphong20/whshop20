# คู่มือการติดตั้งและการเปิดใช้งานระบบ (Setup & Deployment Guide)

เอกสารนี้ครอบคลุมขั้นตอนการติดตั้งระบบ **WongHiran Shop (วงษ์หิรัญค้าส่ง 20 บาท)** ลงบนเครื่อง Local (สำหรับการพัฒนา) และการนำขึ้นระบบจริง (Production Deployment)

---

## 1. สิ่งที่ต้องเตรียมก่อนติดตั้ง (Prerequisites)

- **Node.js**: เวอร์ชัน 20.x ขึ้นไป ([ดาวน์โหลด](https://nodejs.org/))
- **MySQL**: เวอร์ชัน 8.x (เพื่อใช้เป็นระบบฐานข้อมูล)
- **Git**: สำหรับดาวน์โหลดและจัดการโค้ด ([ดาวน์โหลด](https://git-scm.com/))
- **บัญชี LINE Developers**: สำหรับการตั้งค่า LINE Login, LIFF และ Messaging API
- **บัญชี Vercel**: สำหรับ Deploy Frontend
- **บัญชี Render.com** (หรือแพลตฟอร์มอื่นๆ): สำหรับ Deploy Backend

---

## 2. การตั้งค่าตัวแปรในระบบ (Environment Variables)

ระบบนี้แบ่งออกเป็น 2 ส่วนหลัก คือ Frontend (React) และ Backend (Express) 
คุณต้องสร้างไฟล์ `.env` ในทั้งสองส่วน ดังนี้

### 2.1 Frontend Environment (`/.env` ที่ Root Folder)
สร้างไฟล์ `.env` และกำหนดค่าดังนี้:
```env
# URL ของ Backend API
VITE_API_URL=http://localhost:5000  # เปลี่ยนเป็น URL จริงเมื่อขึ้น Production

# LIFF ID สำหรับให้ลูกค้าเข้าสู่ระบบผ่าน LINE
VITE_LIFF_ID=your_liff_id_here

# Channel ID ของ LINE Login (ถ้ามีการดึงโปรไฟล์)
VITE_LINE_LOGIN_CHANNEL_ID=your_channel_id_here
```

### 2.2 Backend Environment (`/backend/.env`)
สร้างไฟล์ `.env` ในโฟลเดอร์ `backend` และกำหนดค่าดังนี้:
```env
# ตั้งค่า Server
PORT=5000

# ตั้งค่าฐานข้อมูล MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=linecommerce_db

# ตั้งค่าความปลอดภัย
JWT_SECRET=your_super_secret_jwt_key

# ตั้งค่า LINE Messaging API (สำหรับการส่งของแจ้งเตือน)
LINE_CHANNEL_ACCESS_TOKEN=your_messaging_api_access_token
LINE_CHANNEL_SECRET=your_messaging_api_secret

# ตั้งค่า LINE Login (สำหรับ Admin เข้าสู่ระบบ)
LINE_LOGIN_CHANNEL_ID=your_login_channel_id
LINE_LOGIN_CHANNEL_SECRET=your_login_channel_secret

# ID ของกลุ่ม LINE ที่ต้องการให้แชทบอทส่งออเดอร์ไปแจ้งเตือน
ADMIN_LINE_GROUP_ID=your_admin_group_id

# URL ของ Frontend (ใช้สำหรับ CORS)
VITE_API_URL=http://localhost:3000
```

---

## 3. การรันระบบในเครื่อง Local (Local Development)

### 3.1 การตั้งค่าฐานข้อมูล
1. เปิดโปรแกรมจัดการฐานข้อมูล (เช่น MySQL Workbench, DBeaver หรือ phpMyAdmin)
2. สร้างฐานข้อมูลใหม่: 
   ```sql
   CREATE DATABASE linecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. นำเข้าตารางฐานข้อมูลที่เตรียมไว้ (ถ้ามีไฟล์ .sql)

### 3.2 การเปิดใช้งาน Backend
1. เปิด Terminal และเข้าไปที่โฟลเดอร์ `backend`
   ```bash
   cd backend
   ```
2. ติดตั้งแพ็กเกจที่จำเป็น
   ```bash
   npm install
   ```
3. รันเซิร์ฟเวอร์
   ```bash
   node server.js
   ```
   > หากการเชื่อมต่อสำเร็จ จะแสดงข้อความว่า `Server is running on port 5000` และ `Connected to the MySQL database.`

### 3.3 การเปิดใช้งาน Frontend
1. เปิด Terminal ใหม่ที่หน้า Root Folder (ไม่ต้องเข้าโฟลเดอร์ใด)
2. ติดตั้งแพ็กเกจที่จำเป็น
   ```bash
   npm install
   ```
3. รันโปรเจกต์
   ```bash
   npm run dev
   ```
   > ระบบจะจำลองเซิร์ฟเวอร์ขึ้นมาที่ `http://localhost:3000` (หรือพอร์ตอื่นตามที่แสดงใน Console)

---

## 4. คู่มือการ Deployment (Production)

### 4.1 การ Deploy ฐานข้อมูล MySQL บน Cloud
แนะนำให้ใช้บริการฐานข้อมูลบนคลาวด์ เช่น Aiven, TiDB, PlanetScale หรือรัน MySQL บน VPS หลังจากสร้างเสร็จแล้ว ให้นำ `DB_HOST`, `DB_USER`, `DB_PASSWORD` ไปใส่ใน `.env` ของ Backend

### 4.2 การ Deploy Backend บน Render.com
1. สมัครบัญชีและล็อกอินที่ [Render.com](https://render.com)
2. เลือก **New +** > **Web Service**
3. เชื่อมต่อกับ GitHub/GitLab ซอร์ซโค้ดของคุณ
4. ตั้งค่าบริการ:
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: (ปล่อยว่าง หรือพิมพ์ `npm install`)
   - **Start Command**: `node server.js`
5. ไปที่แท็บ **Environment** > ซ่อนและใส่ค่าตัวแปรจากไฟล์ `/backend/.env` (เปลี่ยนพอร์ตตามความเหมาะสมหรือให้ Render จัดการให้)
6. กด **Create Web Service** และคัดลอก URL ของ Backend ไว้ใช้งานต่อ

### 4.3 การ Deploy Frontend บน Vercel
1. สมัครบัญชีและล็อกอินที่ [Vercel.com](https://vercel.com)
2. เลือก **Add New...** > **Project** 
3. เชื่อมต่อและ Import Repository ของคุณ
4. ตั้งค่าโปรเจกต์:
   - **Framework Preset**: `Vite` (Vercel มักจะตรวจพบอัตโนมัติ)
   - **Root Directory**: `./` (Root ล่างสุด)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. ไปที่ส่วนของ **Environment Variables** และใส่ตัวแปรจากไฟล์หัวข้อ 2.1 `/.env` (โดยให้ `VITE_API_URL` ตรงกับลิงก์จากข้อ 4.2)
6. กด **Deploy**

---

## 5. การตั้งค่าการเชื่อมต่อกับ LINE API

เพื่อให้ระบบสมบูรณ์ ต้องมีการเชื่อมต่อกับฝั่ง LINE เพื่อให้เกิดการแจ้งเตือนและการเข้าสู่ระบบที่ถูกต้อง:

### 5.1 ตั้งค่า LINE Login และ LIFF
1. เข้าไปที่ [LINE Developers Console](https://developers.line.biz/)
2. สร้าง **Provider** และสร้างช่องทาง (Channel) แบบ **LINE Login**
3. ไปที่แท็บ **LIFF** เพื่อสร้าง LIFF App ใหม่
   - กำหนด **Endpoint URL** เป็น URL ของ Frontend จาก Vercel
   - ตั้งค่า Scopes เป็น `profile, openid` และกด Add
4. นำ `LIFF ID`, `Channel ID`, และ `Channel Secret` ไปใส่ในตัวแปร `.env` ตามที่กำหนด

### 5.2 ตั้งค่า Messaging API (สำหรับแชทบอทและการแจ้งเตือน)
1. ใน Provider เดียวกัน สร้างช่องทางใหม่แบบ **Messaging API**
2. ไปที่แท็บ **Messaging API** และออก `Channel access token (long-lived)`
3. นำ `Channel ID`, `Channel Secret` และ `Channel access token` ไปใส่ใน `.env` ของ Backend
4. ตั้งค่า **Webhook URL**: ระบุเป็น `https://[URL-Backend-ของคุณ]/webhook` และเปิด **Use webhook** เป็นสีเขียว
5. เพิ่มแชทบอทตัวนี้เข้าไปในกลุ่ม LINE ที่ต้องการให้มีคนรับแจ้งเตือนออเดอร์ แล้วเชิญบอทเข้ากลุ่ม
6. คัดลอก Group ID ไปใส่ที่ตัวแปร `ADMIN_LINE_GROUP_ID` (อาจได้มาจากการ Log ตอนบอทถูกดึงเข้ากลุ่ม)

---
*หากมีข้อสงสัยหรือพบปัญหาในขั้นตอนใด สามารถตรวจสอบ Error Log ที่ช่องทางหน้า Console ของ Vercel (ฝั่ง Frontend) หรือ Render (ฝั่ง Backend) ได้เลย*
