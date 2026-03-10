# การกําหนดสภาพแวดล้อมการพัฒนาระบบ (Development Environment)

เอกสารนี้รวบรวมรายละเอียดเครื่องมือ ซอฟต์แวร์ และฮาร์ดแวร์ที่ใช้ในการพัฒนาระบบ **WongHiran Shop** (วงษ์หิรัญค้าส่ง 20 บาท) เพื่อให้ผู้พัฒนาและผู้ที่เกี่ยวข้องสามารถติดตั้งและรักษาสภาพแวดล้อมได้อย่างถูกต้องและมีประสิทธิภาพ

---

## 1. ภาพรวมสถาปัตยกรรมระบบ

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│              React 19 + TypeScript + Vite + TailwindCSS         │
│                     Deploy: Vercel (CDN)                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS / REST API
┌───────────────────────────▼─────────────────────────────────────┐
│                    BACKEND (Node.js)                            │
│                 Express 5 + JWT + bcryptjs                      │
│                     Deploy: Render.com                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │ mysql2
┌───────────────────────────▼─────────────────────────────────────┐
│                  DATABASE (MySQL)                               │
│               MySQL 8.x — Cloud / Local                        │
└─────────────────────────────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│              EXTERNAL SERVICES                                  │
│   LINE Messaging API │ LINE Login OAuth │ LIFF │ Cloudinary     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. ซอฟต์แวร์ที่ต้องติดตั้ง (Development Prerequisites)

| ซอฟต์แวร์ | เวอร์ชันที่แนะนำ | วัตถุประสงค์ | ดาวน์โหลด |
| :--- | :---: | :--- | :--- |
| **Node.js** | 20.x LTS ขึ้นไป | รันทั้ง Frontend Build และ Backend Server | [nodejs.org](https://nodejs.org) |
| **npm** | 10.x (มากับ Node.js) | จัดการ Package Dependencies | มากับ Node.js |
| **Git** | 2.x | Version Control | [git-scm.com](https://git-scm.com) |
| **MySQL Server** | 8.x | ฐานข้อมูลหลักของระบบ (Local Dev) | [mysql.com](https://www.mysql.com) |
| **Visual Studio Code** | ล่าสุด | Code Editor (แนะนำ) | [code.visualstudio.com](https://code.visualstudio.com) |

---

## 3. สภาพแวดล้อม Frontend (Client-Side)

### 3.1 Framework & Build Tool

| เทคโนโลยี | เวอร์ชัน | บทบาท |
| :--- | :---: | :--- |
| **React** | 19.x | UI Framework หลัก |
| **TypeScript** | ~5.8.2 | Type-safe JavaScript (target: ES2022) |
| **Vite** | 6.x | Build Tool / Dev Server (Port: 3000) |
| **@vitejs/plugin-react** | 5.x | React Fast Refresh Plugin สำหรับ Vite |

### 3.2 UI & Styling

| Library | เวอร์ชัน | บทบาท |
| :--- | :---: | :--- |
| **Ant Design (antd)** | 6.x | UI Component Library (Modal, Form, Select ฯลฯ) |
| **TailwindCSS** | (via CDN/config) | Utility-first CSS Framework |
| **lucide-react** | 0.563.x | Icon Library |

### 3.3 Routing & State

| Library | เวอร์ชัน | บทบาท |
| :--- | :---: | :--- |
| **react-router-dom** | 7.x | Client-side Routing (SPA) |
| React Context / useState | built-in | Global & Local State Management |

### 3.4 Integration Libraries (Frontend)

| Library | เวอร์ชัน | บทบาท |
| :--- | :---: | :--- |
| **@line/liff** | 2.27.x | LINE LIFF SDK สำหรับระบุตัวตนลูกค้า |
| **@google/genai** | 1.38.x | Google Gemini AI SDK |
| **xlsx** | 0.18.x | อ่าน/เขียนไฟล์ Excel (Import สินค้า) |
| **html2canvas** | 1.4.x | แปลง HTML เป็นรูปภาพ (ใบสั่งซื้อ) |
| **jspdf** | 4.x | สร้างไฟล์ PDF |
| **react-helmet-async** | 2.x | จัดการ HTML `<head>` (SEO) |

---

## 4. สภาพแวดล้อม Backend (Server-Side)

### 4.1 Runtime & Framework

| เทคโนโลยี | เวอร์ชัน | บทบาท |
| :--- | :---: | :--- |
| **Node.js** | 20.x LTS | JavaScript Runtime |
| **Express** | 5.x | HTTP Web Framework |
| **CommonJS** | - | Module system ของ Backend |

### 4.2 Database & Authentication

| Library | เวอร์ชัน | บทบาท |
| :--- | :---: | :--- |
| **mysql2** | 3.18.x | MySQL Driver / Connection Pool |
| **bcryptjs** | 3.x | Hash รหัสผ่าน (ความแข็งแกร่ง: 10 rounds) |
| **jsonwebtoken (JWT)** | 9.x | ออกและตรวจสอบ Token สำหรับ Auth |
| **dotenv** | 17.x | โหลด Environment Variables จาก `.env` |

### 4.3 Integration Libraries (Backend)

| Library | เวอร์ชัน | บทบาท |
| :--- | :---: | :--- |
| **@line/bot-sdk** | 10.6.x | LINE Messaging API (ส่งแจ้งเตือน) |
| **cors** | 2.8.x | จัดการ Cross-Origin Resource Sharing |

### 4.4 Port & Endpoint

| สภาพแวดล้อม | URL | Port |
| :--- | :--- | :---: |
| Local Development | `http://localhost:5000` | 5000 |
| Production (Render.com) | `https://your-app.onrender.com` | 443 |

---

## 5. ฐานข้อมูล (Database)

| รายการ | รายละเอียด |
| :--- | :--- |
| **ระบบฐานข้อมูล** | MySQL 8.x |
| **Driver** | mysql2 (Connection Pool) |
| **Local Host** | `localhost:3306` |
| **Charset** | utf8mb4 (รองรับภาษาไทยและ Emoji) |
| **ตารางหลัก** | `admins`, `orders`, `products`, `posts`, `settings` |

---

## 6. บริการภายนอก (External Services)

| บริการ | วัตถุประสงค์ | Dashboard |
| :--- | :--- | :--- |
| **LINE Messaging API** | ส่งแจ้งเตือนออเดอร์ไปยังแอดมิน/กลุ่ม LINE | [developers.line.biz](https://developers.line.biz) |
| **LINE Login (OAuth 2.0)** | เชื่อมบัญชี LINE ของแอดมิน | [developers.line.biz](https://developers.line.biz) |
| **LINE LIFF** | ระบุตัวตนลูกค้าผ่าน LINE App | [developers.line.biz](https://developers.line.biz) |
| **Cloudinary** | จัดเก็บและส่งรูปภาพสินค้า (CDN) | [cloudinary.com](https://cloudinary.com) |
| **Google Gemini AI** | AI Assistant สำหรับระบบ (ถ้ามี) | [ai.google.dev](https://ai.google.dev) |

---

## 7. การ Deploy (Production Environment)

| ส่วน | แพลตฟอร์ม | วิธี Deploy |
| :--- | :--- | :--- |
| **Frontend** | [Vercel](https://vercel.com) | Git Push → Auto Deploy, Config: `vercel.json` (SPA Rewrite) |
| **Backend** | [Render.com](https://render.com) | Git Push → Auto Deploy, Start Command: `node server.js` |
| **Database** | MySQL Cloud (Tidb/Railway/PlanetScale หรือ VPS) | Manual Setup |

### 7.1 Vercel Configuration (`vercel.json`)
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
> ตั้งค่า SPA Rewrite เพื่อให้ React Router ทำงานได้ถูกต้องบน Vercel

---

## 8. Environment Variables

### 8.1 Frontend (`.env` หรือ `.env.local`)
```env
VITE_API_URL=https://your-backend.onrender.com
VITE_LIFF_ID=xxxxxxxxxx-xxxxxxxx
GEMINI_API_KEY=AIzaSy...
```

### 8.2 Backend (`backend/.env`)
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=linecommerce_db

JWT_SECRET=your_jwt_secret

LINE_CHANNEL_ACCESS_TOKEN=...
LINE_CHANNEL_SECRET=...
LINE_LOGIN_CHANNEL_ID=...
LINE_LOGIN_CHANNEL_SECRET=...
ADMIN_LINE_GROUP_ID=...

VITE_API_URL=https://your-frontend.vercel.app
```

---

## 9. คำสั่งรันระบบในโหมดพัฒนา (Local Development)

### ขั้นตอนที่ 1 — ติดตั้ง Dependencies
```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

### ขั้นตอนที่ 2 — รัน Backend
```bash
cd backend
node server.js
# Server จะรันที่ http://localhost:5000
```

### ขั้นตอนที่ 3 — รัน Frontend
```bash
# (กลับมาที่ root folder)
npm run dev
# Dev Server จะรันที่ http://localhost:3000
```

### ขั้นตอนที่ 4 — Build สำหรับ Production
```bash
npm run build
# ผลลัพธ์อยู่ใน /dist folder
```

---

## 10. ข้อกำหนดฮาร์ดแวร์ขั้นต่ำสำหรับนักพัฒนา

| รายการ | ข้อกำหนดขั้นต่ำ | แนะนำ |
| :--- | :--- | :--- |
| **CPU** | Dual Core 2.0 GHz | Quad Core 2.5 GHz ขึ้นไป |
| **RAM** | 4 GB | 8 GB ขึ้นไป |
| **Storage** | SSD 20 GB ว่าง | SSD 50 GB ขึ้นไป |
| **OS** | Windows 10 / macOS 12 / Ubuntu 20.04 | Windows 11 / macOS 14 / Ubuntu 22.04 |
| **เน็ตเวิร์ก** | 10 Mbps | 50 Mbps ขึ้นไป (สำหรับ Cloudinary/LINE API) |

---

## 11. Extensions VS Code ที่แนะนำ

| Extension | Publisher | วัตถุประสงค์ |
| :--- | :--- | :--- |
| ESLint | Microsoft | ตรวจสอบคุณภาพโค้ด |
| Prettier | Prettier | จัดรูปแบบโค้ดอัตโนมัติ |
| Tailwind CSS IntelliSense | Tailwind Labs | Autocomplete Tailwind class |
| TypeScript (built-in) | Microsoft | TypeScript Language Support |
| Thunder Client | Thunder Client | ทดสอบ REST API ใน VS Code |
| MySQL (mwSQL) | cweijan | จัดการ MySQL Database ผ่าน VS Code |
