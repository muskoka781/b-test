import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: 'AIzaSyCiaFkF20V2XTtLSgna5mYNvKnYvLEIMdo',
  authDomain: 'b-test-dc1ae.firebaseapp.com',
  projectId: 'b-test-dc1ae',
  storageBucket: 'b-test-dc1ae.firebasestorage.app',
  messagingSenderId: '713561940049',
  appId: '1:713561940049:web:f4df947947f9ed7bb09870',
  measurementId: 'G-8MDG28VMM6',
}

export const firebaseApp = initializeApp(firebaseConfig)
export const analytics = isSupported().then((supported) =>
  supported ? getAnalytics(firebaseApp) : null,
)
