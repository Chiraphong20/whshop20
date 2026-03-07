const line = require('@line/bot-sdk');

const lineConfig = {
    channelAccessToken: 'Y4YhRd1XCA8Tf2CaWV53f5dbgHzirjbjoorpwFJ1q2EKq9ixuJKPdy3GvWVFMj8EyMbYHjdG/4q129KWDEcs5YbH1WXuFUkaMAxMl3MOOoywophuynZaHB9BXGS6Yl+kH9uX1MU3eEA0LuS2/en7nAdB04t89/1O/w1cDnyilFU=',
    channelSecret: '8f8aab2552be93a7572b7af6359a00f3'
};
const client = new line.messagingApi.MessagingApiClient(lineConfig);

async function test() {
    try {
        const uids = ["U9753b0ac3dcffda1e1415ea4e47d8707", "U78ac8360461825bdd0ca31e7bb3ecc6b"];
        for (const uid of uids) {
            console.log("Testing push to:", uid);
            try {
                await client.pushMessage({
                    to: uid,
                    messages: [{ type: 'text', text: 'Test from CLI' }]
                });
                console.log("Success for", uid);
            } catch (e) {
                console.log("Failed for", uid, ":", e.message, "\nBody:", e.body);
            }
        }
    } catch (e) {
        console.log("Fatal Error:", e);
    }
}
test();
