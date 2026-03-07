// =========================================================
// 🌐 การตั้งค่า API URL กลางตัวแปรเดียวกันทั้งหมด
// =========================================================

export const getApiUrl = () => {
    if (typeof window === 'undefined') return 'http://localhost:5000';

    // 🌟 ถ้ารันบนโปรดักชัน (เช่น Vercel) และมีการตั้งค่า VITE_API_URL ไว้ ให้บังคับใช้ค่านั้นเป็นหลักเพื่อป้องกันข้อผิดพลาด HTTP/HTTPS
    if (import.meta.env.VITE_API_URL) {
        return import.meta.env.VITE_API_URL;
    }

    const hostname = window.location.hostname;
    const isNgrok = hostname.includes('ngrok-free.dev');

    // 1. ถ้าเข้าผ่าน Ngrok ให้ใช้ Path ว่างเพื่อให้ Vite Proxy โยนไปหาพอร์ต 5000
    if (isNgrok) return '';

    // 2. ถ้าเข้าผ่าน Localhost (ในคอมตัวเอง)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:5000';
    }

    // 3. ถ้าเข้าผ่าน IP เครื่อง (LAN) นอกเหนือจากนี้
    return `http://${hostname}:5000`;
};

export const API_URL = getApiUrl();

// 💡 สร้าง Header มาตรฐานรวม ngrok-skip-browser-warning เอาไว้ใช้ทุกครั้งที่มีการ Fetch ป้องกัน ngrok สกัดกั้นบนมือถือใหม่
export const getAuthHeaders = (extraHeaders: Record<string, string> = {}) => {
    return {
        'ngrok-skip-browser-warning': 'true',
        ...extraHeaders
    };
};
