# Software Requirements Specification (SRS)
## ระบบ LINE Commerce Pro (linecommerce-pro)

**เวอร์ชันเอกสาร:** 1.0  
**วันที่จัดทำ:** 9 มีนาคม 2569  
**จัดทำโดย:** ทีมพัฒนา linecommerce-pro  

---

## สารบัญ
1. [บทนำ (Introduction)](#1-บทนำ-introduction)
2. [คำอธิบายภาพรวมของระบบ (Overall Description)](#2-คำอธิบายภาพรวมของระบบ-overall-description)
3. [ผู้ใช้งานของระบบ (Users)](#3-ผู้ใช้งานของระบบ-users)
4. [ความต้องการเชิงฟังก์ชัน (Functional Requirements)](#4-ความต้องการเชิงฟังก์ชัน-functional-requirements)
5. [ความต้องการที่ไม่ใช่เชิงฟังก์ชัน (Non-Functional Requirements)](#5-ความต้องการที่ไม่ใช่เชิงฟังก์ชัน-non-functional-requirements)
6. [ข้อจำกัดของระบบ (Constraints)](#6-ข้อจำกัดของระบบ-constraints)
7. [สถาปัตยกรรมของระบบ (System Architecture)](#7-สถาปัตยกรรมของระบบ-system-architecture)
8. [โครงสร้างฐานข้อมูล (Database)](#8-โครงสร้างฐานข้อมูล-database)
9. [ขอบเขตของ API (API Scope)](#9-ขอบเขตของ-api-api-scope)

---

## 1. บทนำ (Introduction)

### 1.1 วัตถุประสงค์ (Purpose)
เอกสารฉบับนี้คือข้อกำหนดความต้องการซอฟต์แวร์ (Software Requirements Specification: SRS) ของระบบ **LINE Commerce Pro** ซึ่งเป็นแพลตฟอร์ม E-Commerce สำหรับร้านค้าที่ใช้ LINE เป็นช่องทางการขายหลัก เอกสารนี้ครอบคลุมขอบเขตของระบบ ความต้องการด้านฟังก์ชันการทำงาน ความต้องการที่ไม่ใช่ฟังก์ชัน รวมถึงสถาปัตยกรรมและข้อจำกัดของระบบ

### 1.2 ขอบเขตของระบบ (Scope)
ระบบ LINE Commerce Pro พัฒนาขึ้นเพื่อ:
- ให้ **ลูกค้า** สามารถเรียกดูสินค้า เพิ่มลงตะกร้า และสั่งซื้อได้ผ่าน LINE LIFF โดยไม่ต้องดาวน์โหลดแอปเพิ่มเติม
- ให้ **ผู้ดูแลระบบ (Admin)** สามารถจัดการสินค้า คำสั่งซื้อ โปรโมชั่น รายงาน และการตั้งค่าร้านได้ผ่านหน้า Dashboard บนเว็บ
- เชื่อมต่อกับ **LINE Messaging API** เพื่อส่งการแจ้งเตือนคำสั่งซื้อแบบ Real-time ให้ทั้ง Admin และ ลูกค้า

### 1.3 คำจำกัดความ (Definitions)

| คำศัพท์ | ความหมาย |
|---|---|
| LIFF | LINE Front-end Framework – เว็บแอปที่รันอยู่ภายใน LINE App |
| LINE Bot / Webhook | บัญชี LINE ที่สามารถรับ-ส่งข้อความอัตโนมัติ |
| Rich Menu | เมนูภาพแบบโต้ตอบที่แสดงในแชท LINE |
| Admin | ผู้ดูแลระบบหรือผู้จำหน่าย |
| Super Admin | ผู้ดูแลระบบระดับสูงสุด สามารถจัดการ Admin ได้ |
| Order ID | รหัสคำสั่งซื้อรูปแบบ `ORDDDMM-SEQ` (เช่น `ORD0403-01`) |
| SKU | Stock Keeping Unit – รหัสสินค้าภายใน |

---

## 2. คำอธิบายภาพรวมของระบบ (Overall Description)

### 2.1 มุมมองระบบ (System Perspective)
LINE Commerce Pro เป็นเว็บแอปพลิเคชันแบบ Full-Stack ที่แบ่งออกเป็น 2 ส่วนหลัก:

```
                    ┌──────────────────────────────────┐
                    │          LINE Platform            │
                    │   (LIFF / Messaging API / Bot)   │
                    └──────────┬───────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                      │
┌────────▼────────┐   ┌────────▼──────────┐  ┌───────▼────────┐
│  Customer LIFF  │   │  LINE Notification │  │  LINE Webhook  │
│   (Frontend)   │   │  (Push Message)   │  │  (Event Recv.) │
└────────┬────────┘   └────────┬──────────┘  └───────┬────────┘
         │                     │                      │
         └─────────────────────▼──────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Backend (Node.js) │
                    │    Express Server   │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   MySQL Database    │
                    └─────────────────────┘
```

### 2.2 ฟีเจอร์หลักของระบบ

| หมวด | ฟีเจอร์ |
|---|---|
| 🛒 หน้าร้านค้า | เรียกดูสินค้า, ตะกร้า, สั่งซื้อ, ติดตามพัสดุ |
| 📦 จัดการสินค้า | CRUD สินค้า, นำเข้าแบบ Bulk, จัดการสต๊อก |
| 📝 จัดการคำสั่งซื้อ | ดูออเดอร์, เปลี่ยนสถานะ, ใส่เลขติดตามพัสดุ |
| 📢 โปรโมชั่น/โพสต์ | สร้างโพสต์ข่าว, ผูกกับสินค้า, ตั้งวันหมดอายุ |
| 📊 รายงาน | รายงานยอดขาย, สรุปรายวัน/เดือน, Export Excel/PDF |
| ⚙️ ตั้งค่าระบบ | ตั้งค่าร้านค้า, LINE Token, LINE Group |
| 👥 จัดการ Admin | เพิ่ม/ลบ Admin, สิทธิ์การใช้งาน, ผูกบัญชี LINE |

---

## 3. ผู้ใช้งานของระบบ (Users)

### 3.1 Super Admin
- มีสิทธิ์ใช้งานทุกฟีเจอร์ในระบบ
- สามารถสร้าง แก้ไข และลบบัญชี Admin ได้
- สามารถแก้ไขการตั้งค่าระดับระบบทั้งหมด

### 3.2 Admin
- สามารถจัดการสินค้า คำสั่งซื้อ และโพสต์ได้
- ดูรายงานได้ แต่ไม่สามารถจัดการบัญชี Admin คนอื่นได้
- สามารถผูกบัญชี LINE ส่วนตัวเพื่อรับการแจ้งเตือนได้

### 3.3 Customer (ลูกค้า)
- ไม่ต้องสมัครสมาชิก ใช้งานผ่าน LINE LIFF
- ข้อมูลตัวตน (LINE User ID, ชื่อ, รูปโปรไฟล์) ดึงมาจาก LINE โดยอัตโนมัติ
- สามารถเรียกดูสินค้า สั่งซื้อ และติดตามสถานะพัสดุของตัวเองได้

---

## 4. ความต้องการเชิงฟังก์ชัน (Functional Requirements)

### FR-01: ระบบยืนยันตัวตน Admin (Authentication)

| รหัส | ความต้องการ |
|---|---|
| FR-01-1 | ระบบต้องให้ Admin เข้าสู่ระบบด้วย Username และ Password |
| FR-01-2 | ระบบต้องออก JWT Token เมื่อเข้าสู่ระบบสำเร็จ |
| FR-01-3 | ระบบต้องให้ Admin เปลี่ยนรหัสผ่านของตัวเองได้ |
| FR-01-4 | ระบบต้องป้องกัน API ที่สำคัญด้วยการตรวจสอบ JWT Token |
| FR-01-5 | ระบบต้องรองรับการผูกบัญชี LINE Login กับบัญชี Admin (LINE Login OAuth) |
| FR-01-6 | Super Admin เท่านั้นที่สามารถสร้างหรือลบบัญชี Admin ได้ |

### FR-02: การจัดการสินค้า (Product Management)

| รหัส | ความต้องการ |
|---|---|
| FR-02-1 | Admin สามารถเพิ่ม แก้ไข และลบสินค้าได้ |
| FR-02-2 | แต่ละสินค้าต้องมีข้อมูล: ชื่อ, หมวดหมู่, ราคาปลีก, ราคาส่ง, จำนวนขั้นต่ำสำหรับราคาส่ง, สต๊อก, หน่วย, รูปภาพ |
| FR-02-3 | ระบบต้องรองรับ Barcode และ Product ID แบบกำหนดเอง |
| FR-02-4 | ระบบต้องรองรับโครงสร้างราคา 3 ระดับ: ปลีก (`retailPrice`), ส่ง (`wholesalePrice`) และยกลัง (`bulkPrice`) |
| FR-02-5 | Admin สามารถนำเข้าสินค้าพร้อมกันหลายรายการผ่านไฟล์ Excel (Bulk Import) |
| FR-02-6 | ระบบต้องแสดงรูปภาพสินค้าหลัก 1 รูป และรองรับรูปภาพเพิ่มเติม (Gallery) |
| FR-02-7 | ระบบต้องลดจำนวนสต๊อกอัตโนมัติเมื่อสถานะออเดอร์ถูกเปลี่ยนเป็น `CONFIRMED` |

### FR-03: ระบบตะกร้าสินค้าและคำสั่งซื้อ (Cart & Order)

| รหัส | ความต้องการ |
|---|---|
| FR-03-1 | ลูกค้าสามารถเพิ่มสินค้าลงตะกร้า ปรับจำนวน หรือลบออกได้ |
| FR-03-2 | ระบบต้องคำนวณราคาสินค้าอัตโนมัติตามจำนวนที่สั่ง (ปลีก / ส่ง / ยกลัง) |
| FR-03-3 | ลูกค้าต้องกรอกชื่อ, ช่องทางติดต่อ (เบอร์โทร/LINE ID), วิธีรับสินค้า (จัดส่ง/รับเอง) |
| FR-03-4 | ถ้าเลือกจัดส่ง ลูกค้าต้องกรอกที่อยู่จัดส่ง |
| FR-03-5 | ระบบต้องสร้าง Order ID รูปแบบ `ORDDDMM-SEQ` ให้อัตโนมัติ |
| FR-03-6 | เมื่อสร้างออเดอร์สำเร็จ ระบบต้องแจ้งเตือนผ่าน LINE ไปยัง Group ของ Admin |
| FR-03-7 | ถ้าลูกค้าใช้งานผ่าน LIFF ระบบต้องบันทึก `lineUserId`, `lineDisplayName`, `linePictureUrl` โดยอัตโนมัติ |

### FR-04: การจัดการคำสั่งซื้อ (Order Management)

| รหัส | ความต้องการ |
|---|---|
| FR-04-1 | Admin สามารถดูรายการออเดอร์ทั้งหมด ค้นหา และกรองตามสถานะได้ |
| FR-04-2 | Admin สามารถเปลี่ยนสถานะออเดอร์ได้: `PENDING → CONFIRMED → SHIPPED → COMPLETED` หรือ `CANCELLED` |
| FR-04-3 | Admin สามารถกรอกเลขพัสดุและบริษัทขนส่งได้ |
| FR-04-4 | Admin สามารถแก้ไขรายการสินค้าและยอดเงินภายในออเดอร์ได้ |
| FR-04-5 | Admin สามารถบันทึกยอดเงินคืนลูกค้า (`refundAmount`) ได้ |
| FR-04-6 | เมื่อออเดอร์ถูกจัดส่ง ระบบต้องส่งเลขพัสดุไปแจ้งลูกค้าผ่าน LINE |
| FR-04-7 | ลูกค้าสามารถติดตามสถานะออเดอร์ของตัวเองได้ (ผ่าน lineUserId หรือ Order ID + เบอร์โทร) |
| FR-04-8 | บัญชีที่บันทึกใน `managedBy` ต้องอ้างอิง `username` ของ Admin ที่ดำเนินการ |

### FR-05: ระบบโพสต์และโปรโมชั่น (Posts & Promotions)

| รหัส | ความต้องการ |
|---|---|
| FR-05-1 | Admin สามารถสร้าง แก้ไข และลบโพสต์ข่าวสาร/โปรโมชั่นได้ |
| FR-05-2 | Admin สามารถผูกสินค้าเข้ากับโพสต์ได้ (ผ่าน `linkedProductIds`) |
| FR-05-3 | โพสต์ต้องมีวันเริ่มต้น (`createdAt`) และวันหมดอายุ (`expiresAt`) |
| FR-05-4 | โพสต์ที่หมดอายุต้องถูกซ่อนจากหน้าลูกค้าโดยอัตโนมัติ |
| FR-05-5 | แต่ละโพสต์ต้องมี URL ที่แชร์ได้ พร้อม Open Graph (OG) Tags สำหรับ Social Media |

### FR-06: ระบบรายงาน (Reporting)

| รหัส | ความต้องการ |
|---|---|
| FR-06-1 | Admin สามารถดูสรุปยอดขายรายวัน รายสัปดาห์ และรายเดือนได้ |
| FR-06-2 | ระบบต้องแสดงสินค้าขายดีและสรุปยอดรวม |
| FR-06-3 | Admin สามารถ Export รายงานเป็นไฟล์ Excel (.xlsx) ได้ |
| FR-06-4 | Admin สามารถ Export รายงานเป็นไฟล์ PDF ได้ |
| FR-06-5 | ระบบต้องแสดง Dashboard สรุปภาพรวม เช่น จำนวนออเดอร์ ยอดขายวันนี้ สต๊อกต่ำ |

### FR-07: การตั้งค่าระบบ (System Settings)

| รหัส | ความต้องการ |
|---|---|
| FR-07-1 | Admin สามารถตั้งค่าชื่อร้าน, LINE Notify Token, LINE Group ID ได้ |
| FR-07-2 | การตั้งค่าต้องถูกเก็บในตาราง `SETTING` แบบ Key-Value |
| FR-07-3 | ระบบต้องโหลดค่า Setting มาใช้งานในทุกครั้งที่เซิร์ฟเวอร์ส่งการแจ้งเตือน LINE |

### FR-08: การเชื่อมต่อ LINE Platform

| รหัส | ความต้องการ |
|---|---|
| FR-08-1 | ระบบต้องรับ Event จาก LINE Webhook (เช่น เมื่อมีการเพิ่ม Bot เข้ากลุ่ม เพื่อบันทึก Group ID อัตโนมัติ) |
| FR-08-2 | ระบบต้องส่ง Push Message ผ่าน LINE Messaging API เมื่อมีออเดอร์ใหม่ |
| FR-08-3 | ระบบต้องส่งข้อมูลเลขพัสดุให้ลูกค้าผ่าน LINE เมื่อ Admin อัปเดตสถานะ `SHIPPED` |
| FR-08-4 | Frontend ต้องเรียก LIFF SDK เพื่อดึงข้อมูลโปรไฟล์ LINE ของลูกค้าโดยอัตโนมัติ |
| FR-08-5 | ระบบต้องรองรับ Rich Menu ที่ลิงก์ลูกค้ามายังหน้าร้าน (LIFF URL) |

---

## 5. ความต้องการที่ไม่ใช่เชิงฟังก์ชัน (Non-Functional Requirements)

### 5.1 ประสิทธิภาพ (Performance)
- หน้าเว็บหลักต้องโหลดภายใน **3 วินาที** สำหรับ 4G Network
- API Response ต้องตอบสนองภายใน **1 วินาที** สำหรับกรณีปกติ
- ระบบต้องรองรับผู้ใช้งานพร้อมกันได้อย่างน้อย **20 คน** (สำหรับ Free Tier Hosting)

### 5.2 ความปลอดภัย (Security)
- รหัสผ่านของ Admin ต้องถูก Hash ด้วย **bcrypt** ก่อนบันทึกฐานข้อมูล
- API ทุก Route ที่ต้องการสิทธิ์ต้องป้องกันด้วย **JWT (JSON Web Token)**
- ข้อมูลสำคัญ (API Keys, Database URL) ต้องเก็บใน **Environment Variables** ห้าม Hard-code
- ระบบต้องกำหนด **CORS** ให้อนุญาตเฉพาะ Origin ที่กำหนดไว้

### 5.3 ความสามารถในการใช้งาน (Usability)
- UI ต้องรองรับทั้ง Desktop และ Mobile (Responsive Design)
- หน้า LIFF ต้องออกแบบมาสำหรับการใช้งานบนโทรศัพท์มือถือเป็นหลัก
- Admin Dashboard ต้องใช้งานได้ง่าย มีเมนูนำทางที่ชัดเจน

### 5.4 ความเสถียร (Reliability)
- ระบบต้อง Uptime ไม่ต่ำกว่า **99%** ต่อเดือน (ขึ้นกับ SLA ของ Hosting Provider)
- ข้อมูลออเดอร์ต้องไม่สูญหาย มีการ Snapshot ราคาสินค้า ณ เวลาสั่งซื้อลงใน `OrderItem`

### 5.5 การบำรุงรักษา (Maintainability)
- Backend พัฒนาด้วย Node.js + Express.js รองรับการ Deploy บน Render หรือ Railway
- Frontend พัฒนาด้วย React (TypeScript) + Vite รองรับการ Deploy บน Vercel
- ฐานข้อมูลใช้ MySQL เชื่อมต่อผ่าน `mysql2` library

---

## 6. ข้อจำกัดของระบบ (Constraints)

| ข้อจำกัด | รายละเอียด |
|---|---|
| LINE LIFF | ต้องรันภายใน LINE App เท่านั้น บางฟีเจอร์ (เช่น ดึง Profile) ไม่ทำงานบน Browser |
| Hosting Free Tier | RAM และ CPU มีจำกัด เซิร์ฟเวอร์อาจ Sleep เมื่อไม่มีการใช้งาน |
| MySQL | ความสัมพันธ์ระหว่าง Order-Product และ Post-Product ถูกเก็บเป็น JSON Array แทน Foreign Key เพื่อความยืดหยุ่น |
| LINE Messaging API | มีขีดจำกัด Rate Limit สำหรับการส่งข้อความต่อเดือน (ขึ้นกับ Plan) |
| ภาษา | Frontend พัฒนาด้วย TypeScript เท่านั้น ไม่รองรับ JavaScript Plain |

---

## 7. สถาปัตยกรรมของระบบ (System Architecture)

### 7.1 Technology Stack

| ชั้น | เทคโนโลยี | รายละเอียด |
|---|---|---|
| **Frontend** | React 19 + TypeScript + Vite 6 | SPA, Routing ด้วย React Router v7 |
| **UI Library** | Ant Design 6 + Lucide React | Components และ Icons |
| **Backend** | Node.js + Express.js | REST API Server, Port 5000 |
| **Database** | MySQL 8 | Relational Database |
| **LINE SDK** | `@line/liff` v2 | LIFF Integration |
| **PDF/Excel** | jsPDF + jspdf-autotable + xlsx | Export Reports |
| **AI** | `@google/genai` | AI Integration (Gemini) |
| **Deploy (FE)** | Vercel | Static Site Hosting |
| **Deploy (BE)** | Render | Node.js Server Hosting |

### 7.2 Deployment Diagram

```
Internet
   │
   ├── [Vercel] ── Frontend (React/Vite) ──── VITE_API_URL ──► [Render] Backend (Node.js)
   │                                                                        │
   └── [LINE Platform] ── Webhook ──────────────────────────────────────────┘
                                                                            │
                                                                   [MySQL Database]
```

### 7.3 Flow การสั่งซื้อ

```
ลูกค้า (LINE LIFF)
   1. เปิด Rich Menu → เข้าหน้าร้าน LIFF
   2. เรียกดูสินค้า → เพิ่มลงตะกร้า
   3. กรอกข้อมูลลูกค้า → กด "ยืนยันสั่งซื้อ"
   4. Frontend POST /api/orders
   5. Backend: สร้าง Order ID → บันทึก DB → ส่ง LINE Push ไปกลุ่ม Admin
   6. ลูกค้าเห็นหน้า "สั่งซื้อสำเร็จ"

Admin (Dashboard)
   7. รับแจ้งเตือนออเดอร์ใหม่ใน LINE Group
   8. เข้า Dashboard → เปลี่ยนสถานะเป็น CONFIRMED (สต๊อกลดอัตโนมัติ)
   9. จัดส่งสินค้า → กรอกเลขพัสดุ → สถานะ SHIPPED
  10. Backend: ส่ง LINE Push เลขพัสดุให้ลูกค้า
```

---

## 8. โครงสร้างฐานข้อมูล (Database)

ระบบประกอบด้วย **5 ตาราง** หลัก:

| ตาราง | คำอธิบาย | Primary Key |
|---|---|---|
| `ADMIN` | ข้อมูลผู้ดูแลระบบและสิทธิ์ | `id` (INT) |
| `PRODUCT` | ข้อมูลสินค้าและราคาทุกระดับ | `id` (VARCHAR) |
| `ORDER` | คำสั่งซื้อ พร้อม Snapshot รายการสินค้าใน JSON | `id` (VARCHAR, `ORDDDMM-SEQ`) |
| `POST` | โพสต์ข่าวสารและโปรโมชั่น | `id` (VARCHAR) |
| `SETTING` | การตั้งค่าระบบแบบ Key-Value | `setting_key` (VARCHAR) |

> รายละเอียดทุก Column ดูได้ที่ [Data_Dictionary.md](./Data_Dictionary.md) และแผนภาพความสัมพันธ์ดูได้ที่ [ER_Diagram.md](./ER_Diagram.md)

---

## 9. ขอบเขตของ API (API Scope)

ระบบเปิดให้บริการ REST API ทั้งหมด **6 หมวด**:

| หมวด | Base Path | จำนวน Endpoints |
|---|---|---|
| 🔐 Authentication & Admins | `/api/login`, `/api/admins`, `/api/auth` | 7 |
| 📦 Products | `/api/products` | 5 |
| 🛒 Orders | `/api/orders` | 8 |
| 📢 Posts | `/api/posts`, `/promotions` | 5 |
| ⚙️ Settings | `/api/settings` | 2 |
| 📱 LINE Webhook | `/api/webhook` | 1 |

> รายละเอียด Request/Response ของแต่ละ Endpoint ดูได้ที่ [API_Documentation.md](./API_Documentation.md)

---

*เอกสารนี้จัดทำโดยอ้างอิงจาก Source Code จริงของระบบ ณ วันที่ 9 มีนาคม 2569*
