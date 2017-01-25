importScripts('https://www.gstatic.com/firebasejs/3.5.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/3.5.2/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in the
// messagingSenderId.
firebase.initializeApp({
  'messagingSenderId': '781300336566'
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.setBackgroundMessageHandler(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const data = payload.data;

  const notificationTitle = 'Your order state changed';
  const notificationOptions = {
    body: `The order is now '${data.state}'.`,
    icon: '/images/shop-icon-128.png'
  };

  return self.registration.showNotification(notificationTitle,
    notificationOptions);
});