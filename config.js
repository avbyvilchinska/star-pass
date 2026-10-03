// Налаштування Firebase для входу через пошту.
// 1. Створи проєкт на https://console.firebase.google.com (інструкція в README.md).
// 2. Project settings → Your apps → Web app → скопіюй сюди значення з firebaseConfig.
// Ці ключі не секретні: вони й так видні в браузері. Захищають дані правила з firestore.rules.
// Поки apiKey порожній, сайт працює без акаунтів і зберігає прогрес лише в браузері.

window.FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
