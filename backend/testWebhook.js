const fetch = require('node-fetch');

async function testSimulatedWebhook() {
    console.log("🚀 Testing Local Webhook (Port 5000)...");

    const simulatedEvent = {
        events: [
            {
                type: "join",
                source: {
                    type: "group",
                    groupId: "C_SIMULATED_TEST_GROUP_ID_12345"
                },
                timestamp: Date.now()
            }
        ]
    };

    try {
        const response = await fetch('http://localhost:5000/api/webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(simulatedEvent)
        });

        const text = await response.text();
        console.log(`📡 Response Status: ${response.status}`);
        console.log(`✅ If successful, you should see "🎯 LINE BOT ถูกเชิญเข้ากลุ่ม!" in your server terminal right now.`);
    } catch (error) {
        console.error("❌ Failed to connect to localhost:5000. Is the server running?");
        console.error(error.message);
    }
}

testSimulatedWebhook();
