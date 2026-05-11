import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

export const firebaseConfig = {
  apiKey: 'AIzaSyD4n916v90fsZQSvUCPW2MXTt0a3Vtdndc',
  authDomain: 'tfg-web-29f9b.firebaseapp.com',
  projectId: 'tfg-web-29f9b',
  storageBucket: 'tfg-web-29f9b.firebasestorage.app',
  messagingSenderId: '910728123688',
  appId: '1:910728123688:web:5cc99ca3a581021ef96c1d',
  measurementId: 'G-JR4NHPEYHF',
}

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const storage = getStorage(app)

export default app