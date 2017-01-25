import * as admin from "firebase-admin";
import fetch from "node-fetch";

const SERVER_FCM_KEY = 'AAAAtekhB7Y:APA91bExoKHtko6c4iK5qMy73_zJBq8AbSVcdKeg_Rs943T9InJWiXMgSn-9EyLf6XVWbmy8hS4ovKBu74nqdrl3ZtGCzBa-EC_s9AdBg3IWwl4TTm81M9W8F-W8AKpkPtJZHgg0EOen';

const app = admin.initializeApp({
    credential: admin.credential.cert("serviceAccount.json"),
    databaseURL: "https://fcm-shop-demo.firebaseio.com"
});

const db = app.database();

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendPushMessage(message: any, registrationIds: Array<string>) {
    try {
        const body = {
            'registration_ids': registrationIds,
            'data': message,
            'timestamp': Date.now()
        };
        let response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
                'Authorization': `key=${SERVER_FCM_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        let res = response.json();
        // todo: check which tokens failed, remove them from database
    } catch (e) {
        console.error('sending notifications failed', e)
    }
}

async function getRegistrationIdsForUser(userKey): Promise<Array<string>> {
    let snap = await db.ref(`/users/${userKey}/fcmToken`).once('value');
    let token = snap.val();

    return [token]
}

async function startOrderProcessing(orderKey, order) {
    let orderStateRef = db.ref(`/orders/${orderKey}/state`);
    let registrationIds = await getRegistrationIdsForUser(order.user);

    await timeout(10000);

    await Promise.all([
        orderStateRef.set('processing'),
        sendPushMessage({order: orderKey, state: 'processing'}, registrationIds)
    ]);

    await timeout(20000);

    await Promise.all([
        orderStateRef.set('shipping_transfer'),
        sendPushMessage({order: orderKey, state: 'shipping_transfer'}, registrationIds)
    ]);

    await timeout(30000);

    await Promise.all([
        orderStateRef.set('shipping_success'),
        sendPushMessage({order: orderKey, state: 'shipping_success'}, registrationIds)
    ]);
}

db.ref("/orders").on('child_added', (snapshot) => {
    let orderKey = snapshot.key;
    let order = snapshot.val();
    console.log(`processing order ${orderKey}`);
    startOrderProcessing(orderKey, order)
});