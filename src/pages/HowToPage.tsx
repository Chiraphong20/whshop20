import React from 'react';
import { Search, ShoppingCart, MapPin, Clock } from 'lucide-react';
import Header from '../components/Header';

const HowToPage = ({ cartCount }: { cartCount: number }) => (
  <div className="h-screen bg-slate-100">
    <Header title="วิธีสั่งซื้อ" backTo="/" cartCount={cartCount} />
    <div className="p-6 space-y-6">
      {[ 
          {n:1, t:'เลือกสินค้า', d:'เลือกจากหมวดหมู่ หรือ ดูจากฟีดสินค้าใหม่', i: <Search className="text-orange-600"/>}, 
          {n:2, t:'ตรวจสอบตะกร้า', d:'ระบบปรับเป็นราคาส่งให้อัตโนมัติเมื่อครบจำนวนขั้นต่ำ', i: <ShoppingCart className="text-orange-600"/>}, 
          {n:3, t:'ระบุการจัดส่ง', d:'เลือกส่งถึงบ้าน หรือ มารับเองที่ร้าน', i: <MapPin className="text-orange-600"/>}, 
          {n:4, t:'รอการยืนยัน', d:'แอดมินจะเช็คสต็อกและยืนยันออเดอร์กลับไปทางไลน์', i: <Clock className="text-orange-600"/>} 
      ].map((s) => (
        <div key={s.n} className="flex gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-orange-50 rounded-full"></div>
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center shrink-0 z-10 border border-orange-200">
            {s.i}
          </div>
          <div className="z-10">
              <h3 className="font-bold text-slate-900 text-lg">ขั้นตอนที่ {s.n}: {s.t}</h3>
              <p className="text-slate-600 text-sm mt-1">{s.d}</p>
          </div>
        </div>
      ))}
      <div className="text-center mt-8 p-4 bg-orange-50 rounded-xl border border-orange-100">
        <p className="text-orange-800 font-bold">มีข้อสงสัยเพิ่มเติม?</p>
        <p className="text-orange-600 text-sm">ทักแชทสอบถามแอดมินได้ตลอดเวลาครับ</p>
      </div>
    </div>
  </div>
);

export default HowToPage;