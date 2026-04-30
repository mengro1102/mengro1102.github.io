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
    
    // KST(한국 시간) 정확하게 계산 (접속자 로컬 시간 오차 방지)
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const kstDate = new Date(utc + (9 * 60 * 60 * 1000));
    
    const todayStr = kstDate.toISOString().split('T')[0];
    const yesterdayDate = new Date(kstDate.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    const visitorRef = ref(db, `visitors/${todayStr}/${hashedIP}`);

    // 오늘 해당 IP가 방문했는지 확인
    const snapshot = await get(visitorRef);
    
    if (!snapshot.exists()) {
        // 오늘 처음 방문한 경우
        await set(visitorRef, true);
        
        // 트랜잭션을 이용해 안전하게 카운트 증가
        const todayCountRef = ref(db, `counts/${todayStr}`);
        await runTransaction(todayCountRef, (current) => (current || 0) + 1);
        
        const totalCountRef = ref(db, `counts/total`);
        await runTransaction(totalCountRef, (current) => (current || 0) + 1);
    }

    // 화면에 표시할 데이터 가져오기
    const todayVal = (await get(ref(db, `counts/${todayStr}`))).val() || 0;
    const yesterdayVal = (await get(ref(db, `counts/${yesterdayStr}`))).val() || 0;
    const totalVal = (await get(ref(db, `counts/total`))).val() || 0;

    // HTML 요소에 값 주입
    const elToday = document.getElementById('stats-today');
    const elYesterday = document.getElementById('stats-yesterday');
    const elTotal = document.getElementById('stats-total');
    if (elToday) elToday.innerText = todayVal.toLocaleString();
    if (elYesterday) elYesterday.innerText = yesterdayVal.toLocaleString();
    if (elTotal) elTotal.innerText = totalVal.toLocaleString();
}

document.addEventListener('DOMContentLoaded', updateVisitorCount);