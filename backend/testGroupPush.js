require('dotenv').config({ path: __dirname + '/.env' });
const line = require('@line/bot-sdk');

const lineConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || 'Y4YhRd1XCA8Tf2CaWV53f5dbgHzirjbjoorpwFJ1q2EKq9ixuJKPdy3GvWVFMj8EyMbYHjdG/4q129KWDEcs5YbH1WXuFUkaMAxMl3MOOoywophuynZaHB9BXGS6Yl+kH9uX1MU3eEA0LuS2/en7nAdB04t89/1O/w1cDnyilFU=',
    channelSecret: process.env.LINE_CHANNEL_SECRET || '8f8aab2552be93a7572b7af6359a00f3'
};

const lineClient = new line.messagingApi.MessagingApiClient(lineConfig);

// The ID the user provided
const groupId = 'C060968cabd3f7d43fe9edebae2e21448';

async function testPush() {
    console.log(`Sending test message to: ${groupId}`);
    try {
        await lineClient.pushMessage({
            to: groupId,
            messages: [{
                type: 'text',
                text: '👋 สวัสดีครับ! นี่คือข้อความทดสอบจากระบบเว็ปร้านค้า เพื่อยืนยันว่าบอทส่งข้อความเข้ากลุ่มนี้ได้สำเร็จครับ 🎉'
            }]
        });
        console.log('✅ Success! ส่งข้อความเข้ากลุ่มสำเร็จ แสดงว่า Group ID นี้ถูกต้องครับ!');
    } catch (error) {
        console.error('❌ Failed! ส่งไม่สำเร็จ เกิดข้อผิดพลาดดังนี้:');
        if (error.originalError?.response?.data) {
            console.error(error.originalError.response.data);
        } else {
            console.error(error.message || error);
        }
    }
}

testPush();
