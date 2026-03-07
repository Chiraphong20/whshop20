// ✅ ทดสอบส่งข้อความเข้ากลุ่ม LINE โดยตรง
// รันด้วย: node backend/testSendToGroup.js

require('dotenv').config({ path: __dirname + '/.env' });
const { MessagingApiClient } = require('@line/bot-sdk').messagingApi;

const client = new MessagingApiClient({
    channelAccessToken: 'Y4YhRd1XCA8Tf2CaWV53f5dbgHzirjbjoorpwFJ1q2EKq9ixuJKPdy3GvWVFMj8EyMbYHjdG/4q129KWDEcs5YbH1WXuFUkaMAxMl3MOOoywophuynZaHB9BXGS6Yl+kH9uX1MU3eEA0LuS2/en7nAdB04t89/1O/w1cDnyilFU='
});

const GROUP_ID = process.env.ADMIN_LINE_GROUP_ID;

async function run() {
    console.log(`📡 กำลังส่งข้อความไปที่ Group ID: ${GROUP_ID}`);
    try {
        await client.pushMessage({
            to: GROUP_ID,
            messages: [{ type: 'text', text: '🧪 ทดสอบส่งข้อความจากระบบหลังบ้านครับ! ถ้าเห็นข้อความนี้แสดงว่า Group ID ถูกต้อง ✅' }]
        });
        console.log('✅ SUCCESS! ส่งสำเร็จ Group ID ถูกต้องครับ!');
    } catch (err) {
        const errMsg = err?.response?.data?.message || err?.body?.message || err?.message || JSON.stringify(err);
        console.error(`❌ FAILED: ${errMsg}`);
        if (errMsg.includes('The user has not agreed to the Official Account')) {
            console.log('⚠️  บอทไม่ได้เป็นเพื่อนกับกลุ่มนี้ หรือกลุ่มนี้ไม่ได้เชิญบอทเข้ามา');
        }
        if (errMsg.includes('Invalid reply token') || errMsg.includes('400')) {
            console.log('⚠️  Group ID ไม่ถูกต้อง หรือบอทไม่ได้อยู่ในกลุ่มนี้');
        }
    }
}

run();
