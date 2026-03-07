// ทดสอบจำลองการสั่งซื้อ → ดูว่าข้อความเข้ากลุ่ม LINE ได้ไหม
// รัน: node backend/testOrder.js

const http = require('http');

const testOrder = {
    id: `TEST-${Date.now()}`,
    customerName: 'ลูกค้าทดสอบ',
    customerContact: '0812345678',
    address: '123 ถ.ทดสอบ กทม',
    deliveryMethod: 'DELIVERY',
    status: 'PENDING',
    totalAmount: 199,
    items: [
        { productId: 'TEST001', productName: 'สินค้าทดสอบ', quantity: 2, price: 99.50 }
    ],
    timestamp: Date.now()
};

const body = JSON.stringify(testOrder);
const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/orders',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
    }
};

console.log('🛒 กำลังจำลองการสั่งซื้อ... ดูที่หน้าจอดำของ server.js ด้วยครับ\n');

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        console.log(`📡 Response Status: ${res.statusCode}`);
        try {
            const json = JSON.parse(data);
            if (json.success) {
                console.log('✅ บันทึกออเดอร์สำเร็จ! ดูกลุ่ม LINE ว่ามีข้อความเข้ามาไหมครับ');
            } else {
                console.log('❌ Response:', json);
            }
        } catch {
            console.log('Response:', data);
        }
    });
});

req.on('error', (e) => {
    console.error('❌ ไม่สามารถเชื่อมต่อ Server ได้:', e.message);
    console.log('➡️  ตรวจสอบว่า node server.js กำลังรันอยู่บนพอร์ต 5000 นะครับ');
});

req.write(body);
req.end();
