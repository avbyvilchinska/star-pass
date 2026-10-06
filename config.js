// Налаштування Firebase для входу через пошту.
// 1. Створи проєкт на https://console.firebase.google.com (інструкція в README.md).
// 2. Project settings → Your apps → Web app → скопіюй сюди значення з firebaseConfig.
// Ці ключі не секретні: вони й так видні в браузері. Захищають дані правила з firestore.rules.
// Якщо apiKey зробити порожнім, сайт працюватиме без акаунтів і зберігатиме прогрес лише в браузері.

window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyC7Xl1YNfYMxwOJAh0-HbV_3aIy03XuIo4",
  authDomain: "zoryanyi-shlyakh.firebaseapp.com",
  projectId: "zoryanyi-shlyakh",
  storageBucket: "zoryanyi-shlyakh.firebasestorage.app",
  messagingSenderId: "422883948637",
  appId: "1:422883948637:web:d8ab63c764a185b17635b4"
};

// Синхронізація з Google Календарем (необовʼязково). Встав сюди OAuth Client ID з Google Cloud Console
// (інструкція в README, розділ «Google Календар»). Поки порожньо — кнопки синхронізації не показуються.
window.GOOGLE_CLIENT_ID = "422883948637-s9dng7c1kve3teoaderumpo790qbmc97.apps.googleusercontent.com";
