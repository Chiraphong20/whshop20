require('dotenv').config();

const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const GROUP_ID = process.env.ADMIN_LINE_GROUP_ID;

console.log('📋 Token (first 20 chars):', TOKEN ? TOKEN.substring(0, 20) + '...' : '❌ ไม่พบ TOKEN');
console.log('📋 Group ID:', GROUP_ID || '❌ ไม่พบ GROUP_ID');

if (!TOKEN || !GROUP_ID) {
    console.error('\n❌ กรุณาตรวจสอบค่าใน .env ก่อน');
    process.exit(1);
}

async function test() {
    try {
        const res = await fetch('https://api.line.me/v2/bot/message/push', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`
            },
            body: JSON.stringify({
                to: GROUP_ID,
                messages: [{ type: 'text', text: '✅ ทดสอบแจ้งเตือน Order จากระบบ WH Shop\nถ้าคุณเห็นข้อความนี้แสดงว่าระบบทำงานปกติ 🎉' }]
            })
        });

        const data = await res.json();

        if (res.ok) {
            console.log('\n✅ ส่งสำเร็จ! ตรวจสอบกลุ่ม LINE ได้เลย');
        } else {
            console.error('\n❌ ส่งไม่สำเร็จ:', JSON.stringify(data, null, 2));

            if (data.message?.includes('Invalid reply token')) {
                console.log('💡 Hint: Group ID อาจผิด');
            } else if (data.message?.includes('Invalid access token')) {
                console.log('💡 Hint: Channel Access Token ผิดหรือหมดอายุ');
            } else if (data.message?.includes('The bot is not a member')) {
                console.log('💡 Hint: Bot ยังไม่ได้อยู่ในกลุ่มนี้ → เพิ่ม Bot เข้ากลุ่มก่อน');
            }
        }
    } catch (err) {
        console.error('\n❌ Network Error:', err.message);
    }
}

test();
