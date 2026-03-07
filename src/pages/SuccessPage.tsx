import React from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

const SuccessPage = () => (
  <div className="h-screen flex flex-col items-center justify-center p-8 text-center bg-slate-100">
    <div className="w-24 h-24 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-6 animate-bounce border-4 border-orange-200">
      <Check size={48} />
    </div>
    <h2 className="text-2xl font-bold text-slate-900">ได้รับออเดอร์แล้ว!</h2>
    <p className="text-slate-500 mt-2 mb-8">ข้อมูลถูกส่งไปยังแอดมินเรียบร้อยแล้ว<br/>โปรดรอการตอบกลับเพื่อยืนยันยอดเงิน</p>
    <Link to="/" className="w-full max-w-xs py-3 border-2 border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-colors">
        กลับหน้าหลัก
    </Link>
  </div>
);

export default SuccessPage;