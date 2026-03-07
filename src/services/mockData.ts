// mockData.ts
import { Product, Post, Order } from '../types';

// ฟังก์ชันช่วยสร้าง Link รูปภาพ (จะได้โหลดไวๆ และมีชื่อสินค้าแปะอยู่)
// เทคนิค: ใช้ placehold.co ไปก่อน พอมีรูปจริงใน Cloudinary ค่อยมาเปลี่ยน URL ตรงนี้
const getImg = (text: string, color: string = 'cbd5e1') => 
  `https://placehold.co/400x400/${color}/334155?text=${encodeURIComponent(text)}`;

// ==========================================
// 📦 1. PRODUCTS (สินค้าทุกอย่าง 20 บาท)
// ==========================================
export const PRODUCTS: Product[] = [
  // --- หมวดสินค้าเทศกาล ---
  {
    id: '8850001', 
    barcode: '8850001',
    name: 'ชุดธูปเทียนทอง (แพ็ค 3 ชุด)',
    category: 'สินค้าเทศกาล',
    retailPrice: 20,
    wholesalePrice: 18,
    minWholesaleQty: 12,
    stock: 100,
    unit: 'แพ็ค',
    image: getImg('ธูปเทียน', 'fca5a5'), // สีแดงอ่อน
    images: [getImg('ธูปเทียน-1', 'fca5a5'), getImg('ธูปเทียน-2', 'fca5a5')],
    description: 'ชุดธูปเทียนแผ่นทอง สำหรับไหว้พระ สะดวกพกพา'
  },
  {
    id: '8850002',
    barcode: '8850002',
    name: 'สายรุ้งปีใหม่ (ยาว 2 เมตร)',
    category: 'สินค้าเทศกาล',
    retailPrice: 20,
    wholesalePrice: 17,
    minWholesaleQty: 12,
    stock: 50,
    unit: 'เส้น',
    image: getImg('สายรุ้ง', 'fcd34d'), // สีเหลือง
    images: [getImg('สายรุ้ง-1', 'fcd34d'), getImg('สายรุ้ง-2', 'fcd34d')],
    description: 'สายรุ้งฟอยล์ประดับงานปาร์ตี้ สีสันสดใส'
  },
  {
    id: '8850003',
    barcode: '8850003',
    name: 'ซองอั่งเปา (แพ็ค 10 ซอง)',
    category: 'สินค้าเทศกาล',
    retailPrice: 20,
    wholesalePrice: 15,
    minWholesaleQty: 20,
    stock: 200,
    unit: 'แพ็ค',
    image: getImg('ซองอั่งเปา', 'ef4444'), // สีแดงเข้ม
    images: [getImg('ซองอั่งเปา-หน้า', 'ef4444'), getImg('ซองอั่งเปา-หลัง', 'ef4444')],
    description: 'ซองแดงลวดลายมงคล กระดาษหนาอย่างดี'
  },

  // --- หมวดเครื่องครัว ---
  {
    id: '8850004',
    barcode: '8850004',
    name: 'ฟองน้ำล้างจาน (แพ็ค 5 ชิ้น)',
    category: 'เครื่องครัว',
    retailPrice: 20,
    wholesalePrice: 18,
    minWholesaleQty: 12,
    stock: 150,
    unit: 'แพ็ค',
    image: getImg('ฟองน้ำ', '86efac'), // สีเขียว
    images: [getImg('ฟองน้ำ-แพ็ค', '86efac'), getImg('เนื้อฟองน้ำ', '86efac')],
    description: 'ฟองน้ำพร้อมใยขัด ขจัดคราบมันได้ดีเยี่ยม'
  },
  {
    id: '8850005',
    barcode: '8850005',
    name: 'มีดปอกผลไม้ ด้ามพลาสติก',
    category: 'เครื่องครัว',
    retailPrice: 20,
    wholesalePrice: 18,
    minWholesaleQty: 12,
    stock: 80,
    unit: 'เล่ม',
    image: getImg('มีดปอกผลไม้', 'fdba74'), // สีส้ม
    images: [getImg('มีด-ด้ามส้ม', 'fdba74')],
    description: 'มีดสแตนเลสขนาดเล็ก คมกริบ สำหรับปอกผลไม้'
  },
  {
    id: '8850006',
    barcode: '8850006',
    name: 'กล่องถนอมอาหาร (ใบเล็ก แพ็คคู่)',
    category: 'เครื่องครัว',
    retailPrice: 20,
    wholesalePrice: 18,
    minWholesaleQty: 12,
    stock: 60,
    unit: 'แพ็ค',
    image: getImg('กล่องอาหาร', '93c5fd'), // สีฟ้า
    images: [getImg('กล่อง-ฝาปิด', '93c5fd')],
    description: 'กล่องพลาสติกใส่อาหาร เข้าไมโครเวฟได้'
  },

  // --- หมวดอุปกรณ์ไฟฟ้า ---
  {
    id: '8850007',
    barcode: '8850007',
    name: 'ที่รัดสายไฟ (Cable Tie 100 เส้น)',
    category: 'อุปกรณ์ไฟฟ้า',
    retailPrice: 20,
    wholesalePrice: 18,
    minWholesaleQty: 10,
    stock: 120,
    unit: 'ห่อ',
    image: getImg('Cable Tie', 'e2e8f0'), // สีเทา
    images: [getImg('เคเบิ้ลไทร์', 'e2e8f0')],
    description: 'เคเบิ้ลไทร์ ไนล่อน อย่างดี เหนียว ไม่ขาดง่าย'
  },
  {
    id: '8850008',
    barcode: '8850008',
    name: 'เทปพันสายไฟ (ม้วนใหญ่)',
    category: 'อุปกรณ์ไฟฟ้า',
    retailPrice: 20,
    wholesalePrice: 17,
    minWholesaleQty: 12,
    stock: 100,
    unit: 'ม้วน',
    image: getImg('เทปพันสายไฟ', '1e293b'), // สีเทาเข้ม
    images: [getImg('เทปดำ', '1e293b')],
    description: 'เทปดำพันสายไฟ ยืดหยุ่นดี ติดทน'
  },
  {
    id: '8850009',
    barcode: '8850009',
    name: 'ปลั๊กตัวผู้-ตัวเมีย (คู่)',
    category: 'อุปกรณ์ไฟฟ้า',
    retailPrice: 20,
    wholesalePrice: 18,
    minWholesaleQty: 12,
    stock: 200,
    unit: 'คู่',
    image: getImg('ปลั๊กไฟ', 'cbd5e1'), 
    images: [getImg('หัวปลั๊ก', 'cbd5e1')],
    description: 'หัวปลั๊กไฟสำหรับงานซ่อมแซม ขาแบน'
  },

  // --- หมวดเครื่องเขียน ---
  {
    id: '8850010',
    barcode: '8850010',
    name: 'ปากกาลูกลื่น (แพ็ค 3 ด้าม)',
    category: 'เครื่องเขียน',
    retailPrice: 20,
    wholesalePrice: 18,
    minWholesaleQty: 12,
    stock: 300,
    unit: 'แพ็ค',
    image: getImg('ปากกา', '3b82f6'), // สีน้ำเงิน
    images: [getImg('ปากกา-น้ำเงิน', '3b82f6'), getImg('ปากกา-แดง', 'ef4444')],
    description: 'ปากกาหมึกน้ำเงิน เขียนลื่น เส้นคมชัด'
  },
  {
    id: '8850011',
    barcode: '8850011',
    name: 'สมุดฉีก เล่มเล็ก (แพ็ค 2 เล่ม)',
    category: 'เครื่องเขียน',
    retailPrice: 20,
    wholesalePrice: 18,
    minWholesaleQty: 12,
    stock: 100,
    unit: 'แพ็ค',
    image: getImg('สมุดฉีก', 'fcd34d'),
    images: [getImg('สมุด-ปกเหลือง', 'fcd34d')],
    description: 'สมุดจดบันทึก กระดาษมีเส้น ฉีกง่าย'
  },
  {
    id: '8850012',
    barcode: '8850012',
    name: 'กาวน้ำใส (ขวดใหญ่)',
    category: 'เครื่องเขียน',
    retailPrice: 20,
    wholesalePrice: 17,
    minWholesaleQty: 12,
    stock: 50,
    unit: 'ขวด',
    image: getImg('กาวน้ำ', '67e8f9'),
    images: [getImg('ขวดกาว', '67e8f9')],
    description: 'กาวน้ำคุณภาพดี ติดกระดาษแน่น แห้งไว'
  },

  // --- หมวดของเล่น ---
  {
    id: '8850013',
    barcode: '8850013',
    name: 'ลูกบอลยาง (คละสี)',
    category: 'ของเล่น',
    retailPrice: 20,
    wholesalePrice: 18,
    minWholesaleQty: 12,
    stock: 60,
    unit: 'ลูก',
    image: getImg('ลูกบอล', 'f9a8d4'), // สีชมพู
    images: [getImg('บอล-ชมพู', 'f9a8d4')],
    description: 'ลูกบอลยางเด้งดึ๋ง ขนาดพอดีมือ เล่นสนุก'
  },
  {
    id: '8850014',
    barcode: '8850014',
    name: 'ชุดตักทราย (ถัง+ที่ตัก)',
    category: 'ของเล่น',
    retailPrice: 20,
    wholesalePrice: 18,
    minWholesaleQty: 12,
    stock: 40,
    unit: 'ชุด',
    image: getImg('ชุดตักทราย', 'bef264'), // สีเขียวมะนาว
    images: [getImg('ถังทราย', 'bef264')],
    description: 'ของเล่นชายหาด พลาสติกสีสดใส'
  },
  {
    id: '8850015',
    barcode: '8850015',
    name: 'เป่าฟองสบู่ (ขวดใหญ่)',
    category: 'ของเล่น',
    retailPrice: 20,
    wholesalePrice: 18,
    minWholesaleQty: 12,
    stock: 80,
    unit: 'ขวด',
    image: getImg('ที่เป่าฟอง', 'a855f7'), // สีม่วง
    images: [getImg('ขวดเป่าฟอง', 'a855f7')],
    description: 'น้ำยาเป่าฟองสบู่ พร้อมไม้เป่า ฟองเยอะ'
  },

  // --- หมวดเบ็ดเตล็ด ---
  {
    id: '8850016',
    barcode: '8850016',
    name: 'ทิชชู่เปียก (ห่อใหญ่)',
    category: 'เบ็ดเตล็ด',
    retailPrice: 20,
    wholesalePrice: 18,
    minWholesaleQty: 12,
    stock: 200,
    unit: 'ห่อ',
    image: getImg('ทิชชู่เปียก', 'e2e8f0'),
    images: [getImg('ห่อทิชชู่', 'e2e8f0')],
    description: 'กระดาษทิชชู่เปียก ไม่มีแอลกอฮอล์ เช็ดสะอาด'
  },
  {
    id: '8850017',
    barcode: '8850017',
    name: 'ยางรัดผม (กระปุก)',
    category: 'เบ็ดเตล็ด',
    retailPrice: 20,
    wholesalePrice: 18,
    minWholesaleQty: 12,
    stock: 100,
    unit: 'กระปุก',
    image: getImg('ยางรัดผม', '14b8a6'),
    images: [getImg('กระปุกยาง', '14b8a6'), getImg('ยางสีดำ', '334155')],
    description: 'ยางรัดผมสีดำ ยืดหยุ่นดี ไม่กินผม บรรจุในกระปุก'
  },
  {
    id: '8850018',
    barcode: '8850018',
    name: 'ถุงขยะดำ (แพ็คประหยัด)',
    category: 'เบ็ดเตล็ด',
    retailPrice: 20,
    wholesalePrice: 17,
    minWholesaleQty: 20,
    stock: 150,
    unit: 'แพ็ค',
    image: getImg('ถุงขยะ', '000000'),
    images: [getImg('ม้วนถุงขยะ', '000000')],
    description: 'ถุงขยะเหนียว รับน้ำหนักได้ดี ขนาดมาตรฐาน'
  }
];

// ==========================================
// 📢 2. POSTS (ข่าวสารร้านทุกอย่าง 20)
// ==========================================
export const POSTS: Post[] = [
  {
    id: 'post1',
    title: '🔥 ทุกอย่าง 20 บาท! ทั้งร้าน',
    description: 'จะหยิบชิ้นไหนก็ 20 บาท คุ้มกว่านี้ไม่มีอีกแล้ว ซื้อครบ 1 โหล ลดเหลือชิ้นละ 18 บาททันที!',
    linkedProductIds: ['8850004', '8850005', '8850006', '8850016', '8850017'],
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true
  },
  {
    id: 'post2',
    title: '✏️ เครื่องเขียนเปิดเทอม ราคาเดียว',
    description: 'ปากกา สมุด กาว อุปกรณ์การเรียน ทุกชิ้น 20 บาท ผู้ปกครองยิ้มแก้มปริ',
    linkedProductIds: ['8850010', '8850011', '8850012'],
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true
  },
  {
    id: 'post3',
    title: '🧹 อุปกรณ์ทำความสะอาดสุดคุ้ม',
    description: 'แม่บ้านถูกใจ ฟองน้ำ ถุงขยะ ไม้กวาดเล็ก ทุกอย่าง 20 บาท ช่วยประหยัดค่าใช้จ่ายในบ้าน',
    linkedProductIds: ['8850004', '8850018'],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    isActive: true
  }
];

// ==========================================
// 📝 3. ORDERS (ประวัติคำสั่งซื้อ 20 บาท)
// ==========================================
export const ORDERS: Order[] = [
  {
    id: 'ORD-001',
    customerName: 'คุณสมศักดิ์',
    customerContact: '081-111-2222',
    address: 'หมู่บ้านจัดสรร อ.เมือง จ.ขอนแก่น',
    deliveryMethod: 'DELIVERY',
    status: 'PENDING',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 นาทีก่อน
    totalAmount: 100,
    items: [
      { 
        productId: '8850004', 
        productName: 'ฟองน้ำล้างจาน', 
        quantity: 2, 
        price: 20,  // ✅ แก้ pricePerUnit -> price
        totalPrice: 40, 
        productImage: getImg('ฟองน้ำ', '86efac') 
      },
      { 
        productId: '8850016', 
        productName: 'ทิชชู่เปียก', 
        quantity: 3, 
        price: 20, 
        totalPrice: 60, 
        productImage: getImg('ทิชชู่เปียก', 'e2e8f0') 
      }
    ]
  },
  {
    id: 'ORD-002',
    customerName: 'ร้านป้าแดง (ขายส่ง)',
    customerContact: '044-555-666',
    address: 'ตลาดสดเทศบาล',
    deliveryMethod: 'PICKUP',
    status: 'CONFIRMED',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 ชม.ก่อน
    totalAmount: 900,
    items: [
      { 
        productId: '8850010', 
        productName: 'ปากกาลูกลื่น', 
        quantity: 50, 
        price: 18, // ราคาส่ง
        totalPrice: 900, 
        productImage: getImg('ปากกา', '3b82f6') 
      }
    ]
  },
  {
    id: 'ORD-003',
    customerName: 'คุณแม่น้องบอย',
    customerContact: 'Line: mom_boy',
    address: 'ส่งถึงบ้าน',
    deliveryMethod: 'DELIVERY',
    status: 'SHIPPED',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 วันก่อน
    totalAmount: 60,
    trackingNumber: 'KER-889900112', // ✅ เพิ่มเลขพัสดุ
    courier: 'Kerry Express',        // ✅ เพิ่มชื่อขนส่ง
    items: [
      { 
        productId: '8850013', 
        productName: 'ลูกบอลยาง', 
        quantity: 1, 
        price: 20, 
        totalPrice: 20, 
        productImage: getImg('ลูกบอล', 'f9a8d4') 
      },
      { 
        productId: '8850014', 
        productName: 'ชุดตักทราย', 
        quantity: 2, 
        price: 20, 
        totalPrice: 40, 
        productImage: getImg('ชุดตักทราย', 'bef264') 
      }
    ]
  },
  {
    id: 'ORD-004',
    customerName: 'คุณสมชาย (แจ้งของหมด)',
    customerContact: '099-888-7777',
    address: 'คอนโดหรู ใจกลางเมือง',
    deliveryMethod: 'DELIVERY',
    status: 'PENDING', // รอตรวจสอบ
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    totalAmount: 40,
    items: [
       { 
        productId: '8850013', 
        productName: 'ลูกบอลยาง (สมมติว่าหมด)', 
        quantity: 2, 
        price: 20, 
        totalPrice: 40, 
        productImage: getImg('ลูกบอล', 'f9a8d4') 
      }
    ]
  }
];