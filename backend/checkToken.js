// ทดสอบว่า Channel Access Token ยังใช้งานได้ไหม
// รันด้วย: node backend/checkToken.js

require('dotenv').config({ path: __dirname + '/.env' });
const https = require('https');

const TOKEN = 'Y4YhRd1XCA8Tf2CaWV53f5dbgHzirjbjoorpwFJ1q2EKq9ixuJKPdy3GvWVFMj8EyMbYHjdG/4q129KWDEcs5YbH1WXuFUkaMAxMl3MOOoywophuynZaHB9BXGS6Yl+kH9uX1MU3eEA0LuS2/en7nAdB04t89/1O/w1cDnyilFU=';

const options = {
    hostname: 'api.line.me',
    path: '/v2/bot/info',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${TOKEN}`
    }
};

console.log('🔍 กำลังตรวจสอบ Token...\n');

const req = https.request(options, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            const info = JSON.parse(data);
            console.log('✅ Token ถูกต้องและยังใช้งานได้!');
            console.log(`   ชื่อบอท: ${info.displayName}`);
            console.log(`   UID: ${info.userId}`);
            console.log(`   Basic ID: @${info.basicId}`);
        } else {
            console.error('❌ Token ไม่ถูกต้องหรือหมดอายุแล้ว!');
            console.error(`   Status: ${res.statusCode}`);
            console.error(`   Response: ${data}`);
            console.log('\n⚠️  วิธีแก้ไข:');
            console.log('   1. ไปที่ https://developers.line.biz/console/');
            console.log('   2. เลือก Channel ร้านค้า -> แท็บ Messaging API');
            console.log('   3. เลื่อนลงสุด หัวข้อ "Channel access token"');
            console.log('   4. กดปุ่ม "Issue" เพื่อออก Token ตัวใหม่');
            console.log('   5. ก็อปปี้มาแทนที่ใน server.js ครับ');
        }
    });
});

req.on('error', (e) => {
    console.error('❌ ไม่สามารถเชื่อมต่อ LINE API ได้:', e.message);
});

req.end();
