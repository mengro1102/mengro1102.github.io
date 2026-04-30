import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, get, set, runTransaction } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyC8dyIaUkNCiKnX7m1WjeGujN74VHMg4qo",
  authDomain: "mengro1102-homepage.firebaseapp.com",
  databaseURL: "https://mengro1102-homepage-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "mengro1102-homepage",
  storageBucket: "mengro1102-homepage.firebasestorage.app",
  messagingSenderId: "1094301101832",
  appId: "1:1094301101832:web:de63525c413a06e24306bd",
  measurementId: "G-MJFZ4KR9BM"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function hashIP(ip) {
    const encoder = new TextEncoder();
    const data = encoder.encode(ip);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getVisitorIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (e) {
        return 'unknown-' + Math.random().toString(36).substring(7);
    }
}

async function updateVisitorCount() {
    const ip = await getVisitorIP();
    const hashedIP = await hashIP(ip);
    
    const now = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstDate = new Date(now.getTime() + kstOffset);
    
    const todayStr = kstDate.toISOString().split('T')[0];
    const yesterdayDate = new Date(kstDate.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    const visitorRef = ref(db, `visitors/${todayStr}/${hashedIP}`);
    const statsRef = ref(db, `stats`);

    // Check if this IP already visited today
    const snapshot = await get(visitorRef);
    
    if (!snapshot.exists()) {
        // New unique visitor for today
        await set(visitorRef, true);
        
        // Update total and today counts using transaction
        const todayCountRef = ref(db, `counts/${todayStr}`);
        await runTransaction(todayCountRef, (current) => (current || 0) + 1);
        
        const totalCountRef = ref(db, `counts/total`);
        await runTransaction(totalCountRef, (current) => (current || 0) + 1);
    }

    // Fetch values to display
    const todayVal = (await get(ref(db, `counts/${todayStr}`))).val() || 0;
    const yesterdayVal = (await get(ref(db, `counts/${yesterdayStr}`))).val() || 0;
    const totalVal = (await get(ref(db, `counts/total`))).val() || 0;

    document.getElementById('stats-today').innerText = todayVal.toLocaleString();
    document.getElementById('stats-yesterday').innerText = yesterdayVal.toLocaleString();
    document.getElementById('stats-total').innerText = totalVal.toLocaleString();
}

document.addEventListener('DOMContentLoaded', updateVisitorCount);
